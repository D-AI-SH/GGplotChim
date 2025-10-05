import { WebR } from 'webr';
import { selectBestMirror, CRANMirror } from '../../utils/cranMirrors';

export interface RunResult {
  success: boolean;
  output?: string;
  error?: string;
  plotUrl?: string;
}

// IndexedDB 存储键名
const WEBR_CACHE_KEY = 'webr-vfs-cache';
const PACKAGE_CACHE_KEY = 'webr-installed-packages';

class WebRRunner {
  private webR: WebR | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;
  private selectedMirrors: CRANMirror[] = [];

  /**
   * 从 localStorage 获取已缓存的包列表
   */
  private getCachedPackages(): string[] {
    try {
      const cached = localStorage.getItem(PACKAGE_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn('⚠️ 读取缓存包列表失败:', error);
      return [];
    }
  }

  /**
   * 保存已安装的包列表到 localStorage
   */
  private saveCachedPackages(packages: string[]): void {
    try {
      localStorage.setItem(PACKAGE_CACHE_KEY, JSON.stringify(packages));
      console.log('✅ 包列表已缓存:', packages);
    } catch (error) {
      console.warn('⚠️ 保存包列表缓存失败:', error);
    }
  }

  /**
   * 检查包是否已在缓存中
   */
  private isPackageCached(packageName: string): boolean {
    const cached = this.getCachedPackages();
    return cached.includes(packageName);
  }

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
    console.log('🚀 [步骤 1/5] 正在初始化 WebR...');
    this.updateInitProgress('[1/5] 准备初始化 WebR（已启用缓存）...');
    
    try {
      // 检查缓存状态
      const cachedPackages = this.getCachedPackages();
      const hasCache = cachedPackages.length > 0;
      if (hasCache) {
        console.log('💾 检测到缓存的包:', cachedPackages);
        this.updateInitProgress('[1/5] 检测到缓存，将快速启动...');
      }
      
      // 步骤 0: 选择最佳 CRAN 镜像源（为将来扩展做准备）
      console.log('🌍 正在选择最佳 CRAN 镜像源...');
      try {
        this.selectedMirrors = await selectBestMirror();
        console.log(`✅ 已选择镜像源: ${this.selectedMirrors[0]?.name || '默认'}`);
      } catch (error) {
        console.warn('⚠️ 镜像源选择失败，将使用默认配置:', error);
      }
      
      // 步骤 1: 创建 WebR 实例（启用 IndexedDB 持久化）
      console.log('📦 创建 WebR 实例（启用 IndexedDB 缓存）');
      this.webR = new WebR({
        baseUrl: 'https://webr.r-wasm.org/latest/',
        // 使用 Channel 模式而不是 Service Worker 模式
        // 这样更简单，不需要额外的 worker 配置
        // 启用 IndexedDB 持久化存储，让虚拟文件系统内容在重启后保留
        // @ts-ignore - webR 的类型定义可能不包含这个选项
        createLazyFilesystem: true,
      });

      // 步骤 2: 初始化 WebR
      const initMessage = hasCache 
        ? '[2/5] 正在加载 WebR（浏览器已缓存，速度更快）...'
        : '[2/5] 正在下载 WebR 运行时（约 10MB，首次较慢）...';
      console.log(`⏳ ${initMessage}`);
      this.updateInitProgress(initMessage);
      
      await this.webR.init();
      this.isInitialized = true;
      
      console.log('✅ [步骤 2/5] WebR 核心初始化成功！');
      
      // 步骤 3: 配置 CRAN 镜像源（如果可用）
      if (this.selectedMirrors.length > 0) {
        console.log('⚙️ [步骤 3/5] 正在配置 CRAN 镜像源...');
        try {
          const mirrorUrl = this.selectedMirrors[0].url;
          await this.webR.evalR(`
            # 配置 CRAN 镜像源
            options(repos = c(CRAN = "${mirrorUrl}"))
            cat("✅ CRAN 镜像源已设置为: ${mirrorUrl}\\n")
          `);
          console.log(`✅ CRAN 镜像源已配置: ${this.selectedMirrors[0].name}`);
        } catch (e) {
          console.warn('⚠️ 镜像源配置失败，使用默认配置:', e);
        }
      }
      
      // 步骤 4: 安装核心依赖包（svglite - 用于正确的字体渲染）
      console.log('📦 [步骤 4/5] 正在安装核心依赖包...');
      try {
        console.log('   正在安装 svglite（用于正确渲染字体）...');
        await this.webR.installPackages(['svglite']);
        console.log('   ✅ svglite 安装成功');
      } catch (e) {
        console.warn('   ⚠️ svglite 安装失败（将使用基础 svg() 设备，字体可能无法正确显示）:', e);
      }
      
      // 安装用户选择的其他 R 包
      await this.installSelectedPackages();
      
      // 步骤 5: 设置全局兼容性选项和字体配置
      console.log('⚙️ [步骤 5/5] 正在设置 R 环境兼容性选项和字体配置...');
      try {
        // 获取字体配置
        const { useBlockStore } = require('../../store/useBlockStore');
        const { fontConfig } = useBlockStore.getState();
        
        await this.webR.evalR(`
          # 抑制 dplyr 的分组警告（兼容不带 .groups 参数的 summarize）
          options(dplyr.summarise.inform = FALSE)
          
          # 抑制 tidyr 的弃用警告（兼容 gather/spread 等旧函数）
          options(lifecycle_verbosity = "quiet")
          
          # 抑制包加载消息
          suppressPackageStartupMessages(library(ggplot2, quietly = TRUE))
          
          # 设置全局字体配置（用于主题函数）
          options(
            ggplot_chinese_font = "${fontConfig.chineseFont}",
            ggplot_english_font = "${fontConfig.englishFont}"
          )
          
          cat("✅ 字体配置: 中文=${fontConfig.chineseFont}, 英文=${fontConfig.englishFont}\\n")
        `);
        console.log('✅ 兼容性选项和字体配置已全局设置');
        console.log(`   字体: 中文=${fontConfig.chineseFont}, 英文=${fontConfig.englishFont}`);
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

      // 检查哪些包在上次会话中被安装过（浏览器可能已缓存了它们的 WASM 文件）
      const cachedPackages = this.getCachedPackages();
      const previouslyInstalled = selectedPackages.filter((pkg: string) => cachedPackages.includes(pkg));
      const newPackages = selectedPackages.filter((pkg: string) => !cachedPackages.includes(pkg));
      
      if (previouslyInstalled.length > 0) {
        console.log(`💾 检测到 ${previouslyInstalled.length} 个包之前安装过，浏览器可能已缓存`);
        console.log('   注意：虚拟文件系统已重置，需要重新安装（但会从浏览器缓存快速读取）');
        this.updateInitProgress(`[4/5] 检测到 ${previouslyInstalled.length} 个包可能已被浏览器缓存，将快速安装...`);
      }

      console.log('📦 [步骤 4/5] 需要安装的包:', selectedPackages);
      console.log('   - 新包（需下载）:', newPackages);
      console.log('   - 之前装过的包（可能从缓存加载）:', previouslyInstalled);
      
      setIsInstallingPackages(true);
      
      const totalPackages = selectedPackages.length;
      const installedPackages: string[] = [];
      
      for (let i = 0; i < selectedPackages.length; i++) {
        const pkg = selectedPackages[i];
        const isCached = previouslyInstalled.includes(pkg);
        const cacheHint = isCached ? ' (可能从缓存读取⚡)' : ' (需下载)';
        const progress = `[4/5] 正在安装包 ${i + 1}/${totalPackages}: ${pkg}${cacheHint}`;
        this.updateInitProgress(progress);
        console.log(`📦 [${i + 1}/${totalPackages}] 安装 ${pkg}${cacheHint}`);
        
        try {
          // 尝试使用配置的镜像源安装包
          await this.webR.installPackages([pkg]);
          console.log(`✅ ${pkg} 安装成功`);
          installedPackages.push(pkg);
          
          // 验证安装
          await this.webR.evalR(`library(${pkg})`);
          console.log(`✅ ${pkg} 加载验证成功`);
        } catch (pkgError) {
          console.warn(`⚠️ ${pkg} 安装失败:`, pkgError);
          
          // 如果有多个镜像源，尝试使用备用镜像源
          if (this.selectedMirrors.length > 1) {
            console.log(`🔄 尝试使用备用镜像源安装 ${pkg}...`);
            for (let j = 1; j < Math.min(3, this.selectedMirrors.length); j++) {
              try {
                const backupMirror = this.selectedMirrors[j];
                console.log(`  尝试镜像源 ${j + 1}: ${backupMirror.name}`);
                
                await this.webR.evalR(`
                  options(repos = c(CRAN = "${backupMirror.url}"))
                `);
                
                await this.webR.installPackages([pkg]);
                console.log(`✅ ${pkg} 使用备用镜像源安装成功`);
                installedPackages.push(pkg);
                
                await this.webR.evalR(`library(${pkg})`);
                console.log(`✅ ${pkg} 加载验证成功`);
                break;
              } catch (backupError) {
                console.warn(`  ⚠️ 备用镜像源 ${j + 1} 也失败了`);
              }
            }
          }
        }
      }
      
      // 恢复主镜像源
      if (this.selectedMirrors.length > 0) {
        try {
          await this.webR.evalR(`
            options(repos = c(CRAN = "${this.selectedMirrors[0].url}"))
          `);
        } catch (e) {
          console.warn('⚠️ 恢复主镜像源失败:', e);
        }
      }
      
      console.log('🔍 所有包安装完成');
      const newCount = installedPackages.filter(pkg => newPackages.includes(pkg)).length;
      const reinstalledCount = installedPackages.filter(pkg => previouslyInstalled.includes(pkg)).length;
      this.updateInitProgress(`已安装 ${installedPackages.length} 个包（${newCount} 新，${reinstalledCount} 重装）`);
      
      // 更新已安装包列表
      setInstalledPackages(installedPackages);
      setIsInstallingPackages(false);
      
      // 保存包列表到缓存（记录这次安装的包，下次可能从浏览器缓存快速加载）
      this.saveCachedPackages(installedPackages);
      
      console.log('✅ 包安装流程完成（已记录到 localStorage，浏览器已缓存 WASM 文件）');
      
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

      // 获取字体配置
      const { useBlockStore: importedUseBlockStore } = require('../../store/useBlockStore');
      const { fontConfig } = importedUseBlockStore.getState();
      
      console.log(`🔤 使用字体配置: 中文=${fontConfig.chineseFont}, 英文=${fontConfig.englishFont}`);
      
      // 使用 SVG 格式捕获图表（WebR 环境最佳兼容性）
      // SVG 是矢量格式，适合高质量输出，且 WebR 对其支持最好
      
      // 自动在代码末尾添加 print(p)，确保图表被输出到设备
      let processedCode = code.trim();
      if (!processedCode.includes('print(p)') && !processedCode.includes('print(plot)')) {
        processedCode += '\nprint(p)';
      }
      
      // 构建字体家族设置
      // 使用 svglite 替代基础 svg()，因为它对字体的支持更好
      const plotCode = `
library(ggplot2)

# 设置全局字体选项（让用户代码中的 getOption() 能获取到正确的字体）
options(ggplot_chinese_font = "${fontConfig.chineseFont}")
options(ggplot_english_font = "${fontConfig.englishFont}")

# 创建临时 SVG 文件（用户自定义设置：${width}×${height} 英寸）
# SVG 是矢量格式，WebR 环境中最稳定
temp_file <- "/tmp/plot.svg"

# 尝试加载 svglite 包（如果可用）
use_svglite <- requireNamespace("svglite", quietly = TRUE)

if (use_svglite) {
  # 使用 svglite（对字体支持更好）
  cat("✅ 使用 svglite 包生成 SVG\\n")
  svglite::svglite(temp_file, 
                   width = ${width}, 
                   height = ${height}, 
                   bg = "white",
                   system_fonts = list(
                     sans = "${fontConfig.chineseFont}",
                     serif = "${fontConfig.chineseFont}",
                     mono = "Courier New"
                   ))
} else {
  # 回退到基础 svg()
  cat("⚠️ svglite 不可用，使用基础 svg()\\n")
  svg(temp_file, 
      width = ${width}, 
      height = ${height}, 
      bg = "white",
      family = "sans")  # 使用通用名称，后续在浏览器端替换
}

# 设置 ggplot2 默认主题字体
# 使用 theme_update() 全局设置字体，确保所有文本元素都使用指定字体
# 这会影响所有后续的 ggplot 对象，即使用户代码中有 theme() 也会继承这些设置
theme_update(
  text = element_text(family = "${fontConfig.chineseFont}"),
  plot.title = element_text(family = "${fontConfig.chineseFont}"),
  plot.subtitle = element_text(family = "${fontConfig.chineseFont}"),
  axis.title = element_text(family = "${fontConfig.chineseFont}"),
  axis.text = element_text(family = "${fontConfig.chineseFont}"),
  legend.title = element_text(family = "${fontConfig.chineseFont}"),
  legend.text = element_text(family = "${fontConfig.chineseFont}"),
  strip.text = element_text(family = "${fontConfig.chineseFont}")
)

# 执行用户代码
${processedCode}

# 关闭设备
dev.off()

# 读取 SVG 内容
svg_content <- readLines(temp_file, warn = FALSE)
svg_text <- paste(svg_content, collapse = "\\n")

# 调试：检查 SVG 中的字体设置（在 JavaScript 处理之前）
cat("\\n📊 SVG 生成完成，检查原始字体设置:\\n")
# 使用简单的模式匹配
if (grepl("font-family", svg_text)) {
  cat("   ✅ SVG 中包含 font-family 设置\\n")
  # 尝试提取第一个 font-family 值作为示例
  sample_match <- regmatches(svg_text, regexpr("font-family[=:][^;>]{1,50}", svg_text))
  if (length(sample_match) > 0) {
    cat("   示例:", sample_match[1], "\\n")
  }
} else {
  cat("   ℹ️ 原始 SVG 未包含 font-family（正常，JavaScript 会添加）\\n")
}

# 统计文本元素数量
text_count <- length(gregexpr("<text", svg_text)[[1]])
if (text_count > 0) {
  cat("   📝 SVG 包含", text_count, "个 <text> 元素\\n")
}

svg_text
`;

      // 执行绘图代码
      const result = await this.webR.evalR(plotCode);
      let svgContent = await result.toString();
      
      // 后处理 SVG：确保字体设置正确应用
      // 策略：直接替换 SVG 中所有 font-family 属性
      try {
        // 构建字体回退链：优先使用用户指定的字体，然后是系统默认字体
        const fontFallback = [
          fontConfig.chineseFont,
          // 只添加最基本的系统回退，确保用户指定的字体优先
          'sans-serif'
        ];
        
        const fontFamilyString = fontFallback.map(f => `"${f}"`).join(', ');
        
        // 方法1：替换所有现有的 font-family 属性（如果存在）
        const originalFontCount = (svgContent.match(/font-family/gi) || []).length;
        if (originalFontCount > 0) {
          svgContent = svgContent.replace(
            /font-family\s*[:=]\s*["']?[^"';>]+["']?/gi,
            `font-family="${fontFamilyString}"`
          );
          console.log(`✅ 替换了 ${originalFontCount} 个现有的 font-family 属性`);
        }
        
        // 方法2：为所有 <text> 元素添加 font-family 属性（如果它们没有）
        // 这对基础 svg() 设备特别重要，因为它可能不生成 font-family 属性
        svgContent = svgContent.replace(
          /<text([^>]*?)>/gi,
          (match, attrs) => {
            // 如果已经有 font-family，不要重复添加
            if (/font-family/i.test(attrs)) {
              return match;
            }
            // 添加 font-family 属性
            return `<text${attrs} font-family="${fontFamilyString}">`;
          }
        );
        
        // 方法3：在 SVG 根元素添加全局样式（使用 !important 作为最后的保障）
        const styleContent = `
              text, tspan {
                font-family: ${fontFamilyString} !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            `;
        
        if (svgContent.includes('<style')) {
          svgContent = svgContent.replace(
            /<style[^>]*>/,
            `$&${styleContent}`
          );
        } else {
          svgContent = svgContent.replace(
            /<svg[^>]*>/,
            `$&<style>${styleContent}</style>`
          );
        }
        
        // 调试：输出 SVG 中的字体使用情况
        const fontMatches = svgContent.match(/font-family="[^"]+"/gi);
        const textElements = svgContent.match(/<text[^>]*>/gi);
        
        console.log(`✅ SVG 字体处理完成:`);
        console.log(`   - 目标字体: ${fontConfig.chineseFont}`);
        console.log(`   - <text> 元素数量: ${textElements?.length || 0}`);
        console.log(`   - font-family 属性数量: ${fontMatches?.length || 0}`);
        
        if (fontMatches && fontMatches.length > 0) {
          // 统计字体使用情况
          const fontCounts: Record<string, number> = {};
          fontMatches.forEach(match => {
            const font = match.match(/font-family="([^"]+)"/)?.[1] || 'unknown';
            fontCounts[font] = (fontCounts[font] || 0) + 1;
          });
          console.log(`   - 字体统计:`, fontCounts);
        }
        
        // 检查是否有 <style> 标签作为后备
        if (svgContent.includes('<style>')) {
          console.log(`   - ✅ 已添加全局 <style> 标签作为字体后备`);
        }
        
        // 检查是否有中文文本
        const chineseTextMatch = svgContent.match(/[\u4e00-\u9fa5]+/g);
        if (chineseTextMatch) {
          console.log(`📝 SVG 中包含 ${chineseTextMatch.length} 个中文文本片段，示例:`, chineseTextMatch.slice(0, 3));
        }
        
        // 调试：输出前几个 <text> 元素的完整内容
        if (textElements && textElements.length > 0) {
          console.log(`\n🔍 前3个 <text> 元素示例:`);
          textElements.slice(0, 3).forEach((elem, idx) => {
            console.log(`   ${idx + 1}. ${elem.substring(0, 150)}...`);
          });
        }
        
        // 调试：输出 SVG 开头部分（包含 <style> 标签）
        const svgStart = svgContent.substring(0, 800);
        console.log(`\n🔍 SVG 开头部分:`, svgStart);
        
        // 检查是否使用了 glyph/symbol（文字被转换成路径）
        const hasSymbols = svgContent.includes('<symbol');
        const hasGlyphs = svgContent.includes('glyph');
        const hasUseElements = svgContent.includes('<use');
        
        if (hasSymbols || hasGlyphs) {
          console.warn(`⚠️ SVG 使用了 glyph/symbol 渲染文字（文字被转换成路径）`);
          console.warn(`   这意味着字体设置无法生效，因为文字不是 <text> 元素`);
          console.warn(`   解决方案：需要使用 svglite 包而不是基础 svg() 设备`);
          console.log(`   - 包含 <symbol>: ${hasSymbols}`);
          console.log(`   - 包含 glyph: ${hasGlyphs}`);
          console.log(`   - 包含 <use>: ${hasUseElements}`);
        }
      } catch (e) {
        console.warn('⚠️ SVG 字体后处理失败:', e);
      }
      
      // 创建 SVG data URL
      const plotUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
      
      console.log(`✅ 图表生成成功！（${width}×${height} 英寸，SVG 矢量格式，字体：${fontConfig.chineseFont}）`);
      
      return {
        success: true,
        plotUrl: plotUrl,
        output: `High-quality SVG plot generated successfully (${width}×${height} in, vector format)`
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

  /**
   * 清除所有缓存（包括包列表缓存）
   */
  clearCache(): void {
    try {
      localStorage.removeItem(PACKAGE_CACHE_KEY);
      console.log('🗑️ 缓存已清除');
    } catch (error) {
      console.warn('⚠️ 清除缓存失败:', error);
    }
  }

  /**
   * 获取缓存信息（用于显示）
   */
  getCacheInfo(): { cachedPackages: string[], hasCachedData: boolean } {
    const cachedPackages = this.getCachedPackages();
    return {
      cachedPackages,
      hasCachedData: cachedPackages.length > 0
    };
  }

  /**
   * 更新字体配置（实时更新，无需重启）
   */
  async updateFontConfig(chineseFont: string, englishFont: string): Promise<void> {
    if (!this.webR || !this.isInitialized) {
      console.warn('⚠️ WebR 尚未初始化，无法更新字体配置');
      return;
    }

    try {
      console.log(`🔤 正在更新字体配置: 中文=${chineseFont}, 英文=${englishFont}`);
      await this.webR.evalR(`
        # 更新全局字体配置
        options(
          ggplot_chinese_font = "${chineseFont}",
          ggplot_english_font = "${englishFont}"
        )
        cat("✅ 字体配置已更新: 中文=${chineseFont}, 英文=${englishFont}\\n")
      `);
      console.log('✅ 字体配置更新成功');
    } catch (error) {
      console.error('❌ 更新字体配置失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const webRRunner = new WebRRunner();

