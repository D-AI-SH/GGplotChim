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
    console.log('🚀 正在初始化 WebR...');
    
    try {
      this.webR = new WebR({
        baseUrl: 'https://webr.r-wasm.org/latest/',
        serviceWorkerUrl: '',
      });

      await this.webR.init();
      this.isInitialized = true;
      
      console.log('✅ WebR 初始化成功！');
      
      // 安装 ggplot2 包 - 使用 webr::install() 方法
      console.log('📦 正在安装 ggplot2...');
      try {
        // WebR 有预编译的二进制包，使用 webr::install() 而不是 install.packages()
        await this.webR.installPackages(['ggplot2']);
        console.log('✅ ggplot2 安装成功！');
        
        // 验证安装
        await this.webR.evalR('library(ggplot2)');
        console.log('✅ ggplot2 加载验证成功');
      
      } catch (pkgError) {
        console.warn('⚠️ ggplot2 安装失败，将在首次使用时尝试安装:', pkgError);
        // 不阻止初始化，允许后续按需安装
      }
      
    } catch (error) {
      console.error('❌ WebR 初始化失败:', error);
      this.isInitialized = false;
      throw new Error(`WebR 初始化失败: ${error instanceof Error ? error.message : String(error)}`);
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

