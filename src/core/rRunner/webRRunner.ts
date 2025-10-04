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
      
      // 步骤 3: 安装用户选择的 R 包
      await this.installSelectedPackages();
      
      // 步骤 3.5: 设置全局兼容性选项
      console.log('⚙️ 正在设置 R 环境兼容性选项...');
      try {
        await this.webR.evalR(`
          # 抑制 dplyr 的分组警告（兼容不带 .groups 参数的 summarize）
          options(dplyr.summarise.inform = FALSE)
          
          # 抑制 tidyr 的弃用警告（兼容 gather/spread 等旧函数）
          options(lifecycle_verbosity = "quiet")
          
          # 抑制包加载消息
          suppressPackageStartupMessages(library(ggplot2, quietly = TRUE))
        `);
        console.log('✅ 兼容性选项已全局设置');
      } catch (e) {
        console.warn('⚠️ 设置兼容性选项失败（但不影响使用）:', e);
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
   * 安装用户选择的 R 包
   */
  async installSelectedPackages(): Promise<void> {
    if (!this.webR) {
      throw new Error('WebR 未初始化');
    }

    try {
      // 获取用户选择的包
      const { useBlockStore } = require('../../store/useBlockStore');
      const { selectedPackages, setInstalledPackages, setIsInstallingPackages } = useBlockStore.getState();
      
      if (!selectedPackages || selectedPackages.length === 0) {
        console.log('⏭️ 没有选择要安装的包');
        this.updateInitProgress('[3/4] 跳过包安装');
        return;
      }

      console.log('📦 [步骤 3/4] 正在安装 R 包:', selectedPackages);
      setIsInstallingPackages(true);
      
      const totalPackages = selectedPackages.length;
      const installedPackages: string[] = [];
      
      for (let i = 0; i < selectedPackages.length; i++) {
        const pkg = selectedPackages[i];
        const progress = `[3/4] 正在安装包 ${i + 1}/${totalPackages}: ${pkg}...`;
        this.updateInitProgress(progress);
        console.log(`📦 [${i + 1}/${totalPackages}] 安装 ${pkg}...`);
        
        try {
          await this.webR.installPackages([pkg]);
          console.log(`✅ ${pkg} 安装成功`);
          installedPackages.push(pkg);
          
          // 验证安装
          await this.webR.evalR(`library(${pkg})`);
          console.log(`✅ ${pkg} 加载验证成功`);
        } catch (pkgError) {
          console.warn(`⚠️ ${pkg} 安装失败:`, pkgError);
          // 继续安装其他包
        }
      }
      
      // 步骤 4: 完成安装
      console.log('🔍 [步骤 4/4] 所有包安装完成');
      this.updateInitProgress(`[4/4] 已安装 ${installedPackages.length}/${totalPackages} 个包`);
      
      // 更新已安装包列表
      setInstalledPackages(installedPackages);
      setIsInstallingPackages(false);
      
      console.log('✅ [步骤 4/4] 包安装流程完成');
      
    } catch (error) {
      console.error('❌ 包安装过程出错:', error);
      const { useBlockStore } = require('../../store/useBlockStore');
      const { setIsInstallingPackages } = useBlockStore.getState();
      setIsInstallingPackages(false);
      this.updateInitProgress('[3/4] 包安装失败，但可以继续使用');
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
      
      // 设置兼容性选项
      try {
        await this.webR.evalR(`
          options(dplyr.summarise.inform = FALSE)
          options(lifecycle_verbosity = "quiet")
          options(warn = -1)
        `);
      } catch (e) {
        console.warn('⚠️ 设置兼容性选项失败:', e);
      }
      
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
  async runPlot(
    code: string, 
    options?: { width?: number; height?: number; dpi?: number }
  ): Promise<RunResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.webR) {
        throw new Error('WebR 未初始化');
      }

      // 使用传入的设置，或默认值
      const width = options?.width ?? 20;
      const height = options?.height ?? 20;
      const dpi = options?.dpi ?? 720;
      const pixelWidth = width * dpi;
      const pixelHeight = height * dpi;

      console.log(`📊 正在生成图表... (${width}×${height} 英寸, ${dpi} DPI = ${pixelWidth}×${pixelHeight} 像素)`);

      // 设置兼容性选项，让 webR 更好地支持旧版 R 代码
      try {
        await this.webR.evalR(`
          # 抑制 dplyr 的分组警告（兼容不带 .groups 参数的 summarize）
          options(dplyr.summarise.inform = FALSE)
          
          # 抑制 tidyr 的弃用警告（兼容 gather/spread 等旧函数）
          options(lifecycle_verbosity = "quiet")
          
          # 设置更宽松的错误处理
          options(warn = -1)  # 抑制所有警告
        `);
        console.log('✅ 兼容性选项已设置');
      } catch (e) {
        console.warn('⚠️ 设置兼容性选项失败，但继续执行:', e);
      }

      // 确保 ggplot2 已加载
      try {
        await this.webR.evalR('if (!require("ggplot2", quietly = TRUE)) { stop("ggplot2 not available") }');
      } catch (e) {
        // 如果 ggplot2 未安装，尝试安装
        console.log('📦 正在安装 ggplot2...');
        await this.webR.installPackages(['ggplot2']);
        await this.webR.evalR('library(ggplot2)');
      }

      // 使用 PNG 格式捕获图表，适用于科研论文（高 DPI）
      // WebR 使用虚拟文件系统，我们可以写入一个临时文件
      
      // 自动在代码末尾添加 print(p)，确保图表被输出到设备
      let processedCode = code.trim();
      if (!processedCode.includes('print(p)') && !processedCode.includes('print(plot)')) {
        processedCode += '\nprint(p)';
      }
      
      const plotCode = `
library(ggplot2)

# 创建临时 PNG 文件（用户自定义设置：${width}×${height} 英寸，${dpi} DPI）
# 输出分辨率：${pixelWidth} x ${pixelHeight} 像素
temp_file <- "/tmp/plot.png"
png(temp_file, width = ${width}, height = ${height}, units = "in", res = ${dpi}, pointsize = 10, 
    type = "cairo", bg = "white")

# 执行用户代码
${processedCode}

# 关闭设备
dev.off()

# 读取 PNG 内容并转换为 base64
png_data <- readBin(temp_file, "raw", n = file.info(temp_file)$size)
base64enc::base64encode(png_data)
`;

      // 先确保 base64enc 包已安装
      try {
        await this.webR.evalR('library(base64enc)');
      } catch {
        console.log('📦 正在安装 base64enc...');
        await this.webR.installPackages(['base64enc']);
        await this.webR.evalR('library(base64enc)');
      }

      // 执行绘图代码
      const result = await this.webR.evalR(plotCode);
      const base64Data = await result.toString();
      
      // 创建 PNG data URL
      const plotUrl = `data:image/png;base64,${base64Data}`;
      
      console.log(`✅ 图表生成成功！（${width}×${height} 英寸，${dpi} DPI = ${pixelWidth}×${pixelHeight} 像素）`);
      
      return {
        success: true,
        plotUrl: plotUrl,
        output: `High-resolution PNG plot generated successfully (${width}×${height} in, ${dpi} DPI, ${pixelWidth}×${pixelHeight} px)`
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

