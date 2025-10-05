/**
 * 图像格式转换工具
 * 将 SVG 转换为 PNG、JPEG 等格式
 */

import { ExportFormat } from '../types/blocks';

/**
 * 将 SVG data URL 转换为指定格式
 * @param svgDataUrl SVG 格式的 data URL
 * @param format 目标格式 (png, jpeg, svg, pdf)
 * @param width 输出宽度（像素）
 * @param height 输出高度（像素）
 * @param dpi DPI（每英寸点数）
 * @returns Promise<string> 转换后的 data URL
 */
export async function convertSVGToFormat(
  svgDataUrl: string,
  format: ExportFormat,
  width: number,
  height: number,
  dpi: number = 720
): Promise<string> {
  // 如果是 SVG 格式，直接返回
  if (format === 'svg') {
    return svgDataUrl;
  }

  // PDF 格式暂不支持（需要服务端或专用库）
  if (format === 'pdf') {
    throw new Error('PDF 格式暂不支持，请使用 PNG 或 SVG 格式');
  }

  // 计算像素尺寸
  let pixelWidth = Math.round(width * dpi);
  let pixelHeight = Math.round(height * dpi);

  console.log(`🔄 转换图像格式: ${format.toUpperCase()}, ${width}×${height} 英寸, ${dpi} DPI = ${pixelWidth}×${pixelHeight} 像素`);
  
  // 检查Canvas尺寸限制（大多数浏览器限制在 32767 像素）
  const MAX_CANVAS_SIZE = 32767;
  let adjustedDPI = dpi;
  
  if (pixelWidth > MAX_CANVAS_SIZE || pixelHeight > MAX_CANVAS_SIZE) {
    // 自动调整DPI以适应浏览器限制
    const maxDimension = Math.max(width, height);
    adjustedDPI = Math.floor(MAX_CANVAS_SIZE / maxDimension * 0.95); // 留5%余量
    pixelWidth = Math.round(width * adjustedDPI);
    pixelHeight = Math.round(height * adjustedDPI);
    
    console.warn(`⚠️ 原始尺寸超出浏览器限制，自动调整 DPI: ${dpi} → ${adjustedDPI}`);
    console.log(`📐 调整后尺寸: ${pixelWidth}×${pixelHeight} 像素`);
  }

  return new Promise((resolve, reject) => {
    // 检查 SVG 中使用的字体
    const svgBase64 = svgDataUrl.split(',')[1];
    const svgText = decodeURIComponent(escape(atob(svgBase64)));
    const fontMatch = svgText.match(/font-family\s*[:=]\s*["']([^"']+)["']/);
    const fontFamily = fontMatch ? fontMatch[1] : 'Microsoft YaHei, sans-serif';
    
    console.log(`🔤 检测到 SVG 使用字体: ${fontFamily}`);
    
    // 检查字体是否可用
    if (document.fonts) {
      const fonts = fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
      console.log(`🔍 检查字体可用性:`, fonts);
      
      for (const font of fonts) {
        const available = document.fonts.check(`12px "${font}"`);
        console.log(`   ${font}: ${available ? '✅ 可用' : '❌ 不可用'}`);
      }
    }
    
    // 创建一个 Image 对象加载 SVG
    const img = new Image();
    
    img.onload = async () => {
      try {
        // 等待字体加载完成
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
          console.log(`✅ 字体已加载完成`);
        }
        
        // 创建 Canvas 元素
        const canvas = document.createElement('canvas');
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'));
          return;
        }

        // 填充白色背景（对于 JPEG 格式特别重要）
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);

        // 设置图像平滑（保持字体清晰）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 计算实际的缩放比例（保持宽高比）
        const targetAspectRatio = pixelWidth / pixelHeight;
        const imgAspectRatio = img.width / img.height;
        
        let drawWidth = pixelWidth;
        let drawHeight = pixelHeight;
        
        // 如果宽高比不同，调整绘制尺寸以保持比例
        if (Math.abs(targetAspectRatio - imgAspectRatio) > 0.01) {
          if (imgAspectRatio > targetAspectRatio) {
            // 图像更宽，以宽度为准
            drawHeight = pixelWidth / imgAspectRatio;
          } else {
            // 图像更高，以高度为准
            drawWidth = pixelHeight * imgAspectRatio;
          }
        }
        
        const x = (pixelWidth - drawWidth) / 2;
        const y = (pixelHeight - drawHeight) / 2;
        
        console.log(`📐 图像绘制: SVG=${img.width}×${img.height}, Canvas=${pixelWidth}×${pixelHeight}, 绘制=${drawWidth.toFixed(0)}×${drawHeight.toFixed(0)}`);
        
        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // 根据格式导出
        let mimeType: string;
        let quality: number = 0.95; // 默认质量（0-1）

        switch (format) {
          case 'png':
            mimeType = 'image/png';
            // PNG 是无损格式，不需要 quality 参数
            break;
          case 'jpeg':
            mimeType = 'image/jpeg';
            quality = 0.95; // JPEG 质量
            break;
          default:
            reject(new Error(`不支持的格式: ${format}`));
            return;
        }

        // 转换为 data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        console.log(`✅ 图像转换成功: ${format.toUpperCase()}, 大小约 ${(dataUrl.length / 1024 / 1024).toFixed(2)} MB`);
        resolve(dataUrl);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      console.error('❌ SVG 加载失败:', error);
      reject(new Error('SVG 加载失败'));
    };

    // 设置图像源为 SVG data URL
    img.src = svgDataUrl;
  });
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(format: ExportFormat): string {
  return format;
}

/**
 * 获取 MIME 类型
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    png: 'image/png',
    svg: 'image/svg+xml',
    jpeg: 'image/jpeg',
    pdf: 'application/pdf'
  };
  return mimeTypes[format];
}

/**
 * 获取格式的显示名称
 */
export function getFormatDisplayName(format: ExportFormat): string {
  const displayNames: Record<ExportFormat, string> = {
    png: 'PNG (高质量位图)',
    svg: 'SVG (矢量图)',
    jpeg: 'JPEG (压缩图像)',
    pdf: 'PDF (文档格式)'
  };
  return displayNames[format];
}

/**
 * 获取格式的描述
 */
export function getFormatDescription(format: ExportFormat): string {
  const descriptions: Record<ExportFormat, string> = {
    png: '无损压缩，适合网页展示和打印，支持透明背景',
    svg: '矢量格式，无限缩放不失真，适合编辑和高质量印刷',
    jpeg: '有损压缩，文件小，适合照片和网页，不支持透明背景',
    pdf: '文档格式，适合打印和分享，需要额外库支持（暂不可用）'
  };
  return descriptions[format];
}

