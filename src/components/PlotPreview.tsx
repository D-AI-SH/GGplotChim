import React from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { Play, AlertCircle } from 'lucide-react';

const PlotPreview: React.FC = () => {
  const { plotUrl, generatedCode } = useBlockStore();
  
  const handleRunCode = () => {
    // 这里将来会集成 WebR 或 OpenCPU
    alert('R 代码执行功能即将推出！\n\n' +
          '下一步将集成 WebR，让您可以在浏览器中直接运行 R 代码并查看图表。');
  };
  
  return (
    <div className="plot-preview">
      {!plotUrl ? (
        <div className="plot-empty">
          <div className="empty-icon">
            <AlertCircle size={48} />
          </div>
          <h3>暂无图表预览</h3>
          <p>点击下方按钮运行代码生成图表</p>
          <button 
            className="run-button"
            onClick={handleRunCode}
            disabled={!generatedCode || generatedCode.includes('请添加积木')}
          >
            <Play size={16} />
            运行代码
          </button>
          
          <div className="info-box">
            <strong>提示：</strong>
            <p>R 代码执行功能开发中，将支持：</p>
            <ul>
              <li>✨ WebR 浏览器端运行（无需服务器）</li>
              <li>📊 实时图表预览</li>
              <li>💾 图表导出（PNG/SVG/PDF）</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="plot-display">
          <img src={plotUrl} alt="Generated plot" />
        </div>
      )}
    </div>
  );
};

export default PlotPreview;

