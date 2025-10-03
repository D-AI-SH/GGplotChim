import { WebR } from 'webr';

export interface RunResult {
  success: boolean;
  output?: string;
  error?: string;
  plotUrl?: string;
}

class WebRRunner {
  private webR: WebR | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化 WebR 实例
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this._doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async _doInitialize(): Promise<void> {
    console.log('🚀 [步骤 1/4] 正在初始化 WebR...');
    this.updateInitProgress('[1/4] 准备初始化 WebR...');
    
    try {
      // 步骤 1: 创建 WebR 实例
      console.log('📦 创建 WebR 实例（使用 Channel 模式，无需 Service Worker）');
      this.webR = new WebR({
        baseUrl: 'https://webr.r-wasm.org/latest/',
        // 使用 Channel 模式而不是 Service Worker 模式
        // 这样更简单，不需要额外的 worker 配置
      });

      // 步骤 2: 初始化 WebR
      console.log('⏳ [步骤 2/4] 正在下载和初始化 WebR 运行时...');
      this.updateInitProgress('[2/4] 正在下载 WebR 运行时（约 10MB）...');
      
      await this.webR.init();
      this.isInitialized = true;
      
      console.log('✅ [步骤 2/4] WebR 核心初始化成功！');
      
      // 步骤 3: 安装 ggplot2 包
      console.log('📦 [步骤 3/4] 正在安装 ggplot2 包...');
      this.updateInitProgress('[3/4] 正在安装 ggplot2 包（约 10-20MB）...');
      
      try {
        // WebR 有预编译的二进制包，使用 webr::install() 而不是 install.packages()
        await this.webR.installPackages(['ggplot2']);
        console.log('✅ [步骤 3/4] ggplot2 安装成功！');
        
        // 步骤 4: 验证安装
        console.log('🔍 [步骤 4/4] 验证 ggplot2 安装...');
        this.updateInitProgress('[4/4] 正在验证 ggplot2 安装...');
        
        await this.webR.evalR('library(ggplot2)');
        console.log('✅ [步骤 4/4] ggplot2 加载验证成功');
      
      } catch (pkgError) {
        console.warn('⚠️ ggplot2 安装失败，将在首次使用时尝试安装:', pkgError);
        this.updateInitProgress('[3/4] ggplot2 安装失败，但可以继续使用');
        // 不阻止初始化，允许后续按需安装
      }
      
      // 更新全局状态 - WebR 已完全就绪
      console.log('🎉 ========================================');
      console.log('🎉 WebR 环境完全就绪！可以开始使用了！');
      console.log('🎉 ========================================');
      this.updateInitProgress('✅ 初始化完成！');
      this.updateStoreReadyState();
      
    } catch (error) {
      console.error('❌ WebR 初始化失败:', error);
      console.error('   错误详情:', error);
      this.isInitialized = false;
      
      this.updateInitProgress('❌ 初始化失败，请刷新页面重试');
      
      // 即使失败也更新状态，让用户看到界面
      this.updateStoreReadyState();
      
      throw new Error(`WebR 初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新初始化进度
   */
  private updateInitProgress(progress: string): void {
    try {
      const { useBlockStore } = require('../../store/useBlockStore');
      const { setWebRInitProgress } = useBlockStore.getState();
      setWebRInitProgress(progress);
    } catch (error) {
      console.warn('⚠️ 无法更新初始化进度:', error);
    }
  }

  /**
   * 更新 Store 中的 WebR 就绪状态
   */
  private updateStoreReadyState(): void {
    try {
      // 动态导入 store 以避免循环依赖
      const { useBlockStore } = require('../../store/useBlockStore');
      const { setIsWebRReady } = useBlockStore.getState();
      setIsWebRReady(true);
      console.log('✅ Store 状态已更新：WebR 就绪');
    } catch (error) {
      console.warn('⚠️ 无法更新 Store 状态:', error);
    }
  }

  /**
   * 运行 R 代码
   */
  async runCode(code: string): Promise<RunResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.webR) {
        throw new Error('WebR 未初始化');
      }

      console.log('🔄 正在运行 R 代码...');
      
      // 执行代码
      const result = await this.webR.evalR(code);
      const output = await result.toJs();
      
      console.log('✅ 代码执行成功！');
      
      return {
        success: true,
        output: JSON.stringify(output, null, 2)
      };
      
    } catch (error) {
      console.error('❌ 代码执行失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 运行 R 代码并生成图表
   */
  async runPlot(code: string): Promise<RunResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.webR) {
        throw new Error('WebR 未初始化');
      }

      console.log('📊 正在生成图表...');

      // 确保 ggplot2 已加载
      try {
        await this.webR.evalR('if (!require("ggplot2", quietly = TRUE)) { stop("ggplot2 not available") }');
      } catch (e) {
        // 如果 ggplot2 未安装，尝试安装
        console.log('📦 正在安装 ggplot2...');
        await this.webR.installPackages(['ggplot2']);
        await this.webR.evalR('library(ggplot2)');
      }

      // 使用 SVG 格式捕获图表（WebR 原生支持）
      // WebR 使用虚拟文件系统，我们可以写入一个临时文件
      const plotCode = `
library(ggplot2)

# 创建临时 SVG 文件
temp_file <- "/tmp/plot.svg"
svg(temp_file, width = 8, height = 6)

# 执行用户代码
${code}

# 关闭设备
dev.off()

# 读取 SVG 内容
svg_content <- readLines(temp_file, warn = FALSE)
paste(svg_content, collapse = "\\n")
`;

      // 执行绘图代码
      const result = await this.webR.evalR(plotCode);
      const svgContent = await result.toString();
      
      // 创建 SVG data URL
      const plotUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
      
      console.log('✅ 图表生成成功！');
      
      return {
        success: true,
        plotUrl: plotUrl,
        output: 'Plot generated successfully'
      };
      
    } catch (error) {
      console.error('❌ 图表生成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 获取 WebR 控制台输出
   */
  async captureOutput(code: string): Promise<string[]> {
    if (!this.webR) {
      throw new Error('WebR 未初始化');
    }

    const shelter = await new this.webR.Shelter();
    try {
      const result = await shelter.captureR(code, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: false,
      });

      const output = result.output
        .filter((line: any) => line.type === 'stdout' || line.type === 'stderr')
        .map((line: any) => line.data);

      return output;
    } finally {
      shelter.purge();
    }
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取 WebR 实例（用于高级用法，如AST解析）
   */
  getWebR(): WebR | null {
    return this.webR;
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.webR) {
      await this.webR.close();
      this.webR = null;
      this.isInitialized = false;
    }
  }
}

// 创建单例实例
export const webRRunner = new WebRRunner();

