import React from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { FontConfig } from '../types/blocks';
import { webRRunner } from '../core/rRunner/webRRunner';

// 常用中文字体列表
// 注意：Windows系统上某些字体需要使用中文名称才能正确识别
const CHINESE_FONTS = [
  { name: '微软雅黑', value: 'Microsoft YaHei', description: '现代无衬线字体，清晰易读（推荐）' },
  { name: '宋体', value: 'SimSun', description: '经典衬线字体，适合正式文档' },
  { name: '黑体', value: 'SimHei', description: '无衬线字体，醒目突出' },
  { name: '楷体', value: 'KaiTi', description: '书法风格，优雅美观' },
  { name: '仿宋', value: 'FangSong', description: '印刷体，古典风格' },
  { name: '新宋体', value: 'NSimSun', description: '宋体的改进版本' },
  { name: '华文宋体', value: 'STSong', description: '清晰的衬线字体' },
  { name: '华文黑体', value: 'STHeiti', description: '粗黑体，醒目突出' },
  { name: '华文楷体', value: 'STKaiti', description: '流畅的书法体' },
];

// 常用英文字体列表
const ENGLISH_FONTS = [
  { name: 'Times Roman', value: 'Times', description: '经典衬线字体，学术标准' },
  { name: 'Times New Roman', value: 'Times New Roman', description: '改进版Times，更清晰' },
  { name: 'Arial', value: 'Arial', description: '现代无衬线字体，清晰易读' },
  { name: 'Helvetica', value: 'Helvetica', description: '经典无衬线字体，简洁专业' },
  { name: 'Calibri', value: 'Calibri', description: 'Office默认字体，温和友好' },
  { name: 'Georgia', value: 'Georgia', description: '屏显衬线字体，优雅大方' },
  { name: 'Palatino', value: 'Palatino', description: '文艺复兴风格，适合阅读' },
  { name: 'Garamond', value: 'Garamond', description: '法国古典字体，精致优雅' },
  { name: 'Courier', value: 'Courier', description: '等宽字体，适合代码' },
  { name: 'Verdana', value: 'Verdana', description: '宽松字距，网页友好' },
];

interface FontSelectorProps {
  onClose?: () => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ onClose }) => {
  const { fontConfig, setFontConfig } = useBlockStore();
  const [localFontConfig, setLocalFontConfig] = React.useState<FontConfig>(fontConfig);

  // 更新中文字体
  const handleChineseFontChange = (font: string) => {
    setLocalFontConfig({ ...localFontConfig, chineseFont: font });
  };

  // 更新英文字体
  const handleEnglishFontChange = (font: string) => {
    setLocalFontConfig({ ...localFontConfig, englishFont: font });
  };

  // 确认选择
  const handleConfirm = async () => {
    setFontConfig(localFontConfig);
    
    // 实时更新WebR中的字体配置
    try {
      await webRRunner.updateFontConfig(
        localFontConfig.chineseFont,
        localFontConfig.englishFont
      );
    } catch (error) {
      console.error('更新字体配置失败:', error);
    }
    
    if (onClose) {
      onClose();
    }
  };

  // 重置为默认
  const handleReset = () => {
    const defaultConfig: FontConfig = {
      chineseFont: 'Microsoft YaHei',  // 改为微软雅黑，兼容性更好
      englishFont: 'Arial'  // 改为Arial，兼容性更好
    };
    setLocalFontConfig(defaultConfig);
  };

  return (
    <div className="font-selector">
      <div className="font-selector-header">
        <h3>🔤 字体配置</h3>
        <p className="font-selector-subtitle">
          选择用于图表的中文和英文字体
        </p>
        
        <div className="font-selector-tip">
          💡 提示：
          <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
            <li>中文字体用于显示所有中文文本（标题、标签、图例等）</li>
            <li>英文字体用于显示英文文本和数字</li>
            <li>默认配置：宋体 + Times Roman（学术论文标准）</li>
            <li>在WebR环境中，字体支持依赖于浏览器的字体渲染能力</li>
          </ul>
        </div>
      </div>

      <div className="font-selector-content">
        {/* 中文字体选择 */}
        <div className="font-category">
          <h4 className="category-title">🇨🇳 中文字体</h4>
          <div className="font-options">
            {CHINESE_FONTS.map(font => (
              <label 
                key={font.value} 
                className={`font-option ${localFontConfig.chineseFont === font.value ? 'font-option-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="chinese-font"
                  value={font.value}
                  checked={localFontConfig.chineseFont === font.value}
                  onChange={() => handleChineseFontChange(font.value)}
                />
                <div className="font-info">
                  <span className="font-name" style={{ fontFamily: font.value }}>
                    {font.name}
                  </span>
                  <span className="font-desc">{font.description}</span>
                  <span className="font-preview" style={{ fontFamily: font.value }}>
                    示例：科研数据可视化
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 英文字体选择 */}
        <div className="font-category">
          <h4 className="category-title">🔤 英文字体</h4>
          <div className="font-options">
            {ENGLISH_FONTS.map(font => (
              <label 
                key={font.value} 
                className={`font-option ${localFontConfig.englishFont === font.value ? 'font-option-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="english-font"
                  value={font.value}
                  checked={localFontConfig.englishFont === font.value}
                  onChange={() => handleEnglishFontChange(font.value)}
                />
                <div className="font-info">
                  <span className="font-name" style={{ fontFamily: font.value }}>
                    {font.name}
                  </span>
                  <span className="font-desc">{font.description}</span>
                  <span className="font-preview" style={{ fontFamily: font.value }}>
                    Preview: Scientific Data Visualization
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 当前选择预览 */}
        <div className="font-preview-box">
          <h4 className="preview-title">📋 当前配置预览</h4>
          <div className="preview-content">
            <div className="preview-row">
              <strong>中文字体：</strong>
              <span style={{ fontFamily: localFontConfig.chineseFont }}>
                {CHINESE_FONTS.find(f => f.value === localFontConfig.chineseFont)?.name || localFontConfig.chineseFont}
              </span>
            </div>
            <div className="preview-row">
              <strong>英文字体：</strong>
              <span style={{ fontFamily: localFontConfig.englishFont }}>
                {ENGLISH_FONTS.find(f => f.value === localFontConfig.englishFont)?.name || localFontConfig.englishFont}
              </span>
            </div>
            <div className="preview-sample">
              <p style={{ fontFamily: `${localFontConfig.chineseFont}, ${localFontConfig.englishFont}` }}>
                混合示例：Scientific Research 科学研究 (123.456)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="font-selector-footer">
        <button 
          className="font-btn font-btn-reset" 
          onClick={handleReset}
        >
          🔄 恢复默认
        </button>
        <button 
          className="font-btn font-btn-confirm" 
          onClick={handleConfirm}
        >
          ✓ 确认应用
        </button>
      </div>

      <style>{`
        .font-selector {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .font-selector-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .font-selector-header h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .font-selector-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .font-selector-tip {
          margin-top: 12px;
          padding: 12px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #92400e;
          text-align: left;
        }

        .font-selector-content {
          max-height: 500px;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .font-category {
          margin-bottom: 32px;
        }

        .category-title {
          margin: 0 0 16px 0;
          font-size: 1.1rem;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .font-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .font-option {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .font-option:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .font-option-selected {
          background: #eff6ff;
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .font-option input[type="radio"] {
          margin-right: 12px;
          margin-top: 4px;
          width: 18px;
          height: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .font-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .font-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 1rem;
        }

        .font-desc {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .font-preview {
          font-size: 0.9rem;
          color: #4b5563;
          margin-top: 4px;
          padding: 6px;
          background: #f3f4f6;
          border-radius: 4px;
        }

        .font-preview-box {
          margin-top: 24px;
          padding: 16px;
          background: #f0f9ff;
          border: 2px solid #3b82f6;
          border-radius: 8px;
        }

        .preview-title {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #1e40af;
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-row {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 0.95rem;
        }

        .preview-row strong {
          color: #374151;
          min-width: 90px;
        }

        .preview-row span {
          color: #1f2937;
          font-size: 1.05rem;
        }

        .preview-sample {
          margin-top: 8px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dbeafe;
        }

        .preview-sample p {
          margin: 0;
          font-size: 1.1rem;
          color: #1f2937;
          text-align: center;
        }

        .font-selector-footer {
          display: flex;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .font-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .font-btn-reset {
          background: #6b7280;
          color: white;
        }

        .font-btn-reset:hover {
          background: #4b5563;
        }

        .font-btn-confirm {
          background: #10b981;
          color: white;
        }

        .font-btn-confirm:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
};

export default FontSelector;

