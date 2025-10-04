import React, { useState, useEffect } from 'react';
import BlockPalette from './components/BlockPalette';
import Canvas from './components/Canvas';
import PreviewPanel from './components/PreviewPanel';
import DeveloperPanel from './components/DeveloperPanel';
import DeveloperMode from './components/DeveloperMode';
import RPackageSelector from './components/RPackageSelector';
import TemplateSelector from './components/TemplateSelector';
import { BlockDefinition } from './types/blocks';
import { useBlockStore } from './store/useBlockStore';
import { Trash2, Download, Upload, FileCode } from 'lucide-react';
import { webRRunner } from './core/rRunner/webRRunner';

const App: React.FC = () => {
  const canvasRef = React.useRef<any>(null);
  const { clearAll, isWebRReady, webRInitProgress, isDeveloperMode, selectedPackages } = useBlockStore();
  const [showPackageSelector, setShowPackageSelector] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [initStarted, setInitStarted] = useState(false);
  
  // 当用户确认包选择后，开始初始化 WebR
  useEffect(() => {
    if (!initStarted && !showPackageSelector) {
      const initWebR = async () => {
        try {
          console.log('🚀 应用启动，开始初始化 WebR...');
          console.log('📦 用户选择的包:', selectedPackages);
          await webRRunner.initialize();
          console.log('✅ WebR 初始化完成');
        } catch (error) {
          console.error('❌ WebR 初始化失败:', error);
        }
      };
      
      setInitStarted(true);
      initWebR();
    }
  }, [showPackageSelector, initStarted, selectedPackages]);
  
  const handleBlockDragStart = (block: BlockDefinition, e: React.MouseEvent) => {
    // 将拖拽事件传递给Canvas处理
    if (canvasRef.current && canvasRef.current.handleBlockDragStart) {
      canvasRef.current.handleBlockDragStart(block, e);
    }
  };
  
  const handleClearAll = () => {
    if (confirm('确定要清空所有积木吗？')) {
      clearAll();
    }
  };
  
  const handleExport = () => {
    // 导出项目功能
    alert('项目导出功能开发中...');
  };
  
  const handleImport = () => {
    // 导入项目功能
    alert('项目导入功能开发中...');
  };
  
  const handleOpenTemplates = () => {
    setShowTemplateSelector(true);
  };
  
  return (
    <div className="app">
      {/* 模板选择器 */}
      {showTemplateSelector && (
        <TemplateSelector onClose={() => setShowTemplateSelector(false)} />
      )}
      
      {/* WebR 包选择界面 */}
      {showPackageSelector && !isWebRReady && (
        <div className="webr-loading-overlay">
          <div className="webr-loading-content" style={{ maxWidth: '800px', padding: '20px' }}>
            <RPackageSelector onClose={() => setShowPackageSelector(false)} />
          </div>
        </div>
      )}
      
      {/* WebR 初始化加载遮罩层 */}
      {!showPackageSelector && !isWebRReady && (
        <div className="webr-loading-overlay">
          <div className="webr-loading-content">
            <div className="webr-loading-spinner"></div>
            <h2>正在准备 WebR 环境...</h2>
            <p className="webr-loading-progress">{webRInitProgress}</p>
            <p className="webr-loading-tips">
              💡 首次加载需要下载约 10-20MB 的文件，请耐心等待
            </p>
          </div>
        </div>
      )}
      
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="logo">🎨</span>
            GGplotChim
          </h1>
          <p className="app-subtitle">可视化 ggplot2 编程工具</p>
        </div>
        
        <div className="header-actions">
          <button className="header-btn template-btn" onClick={handleOpenTemplates} title="选择代码模板">
            <FileCode size={18} />
            模板
          </button>
          <button className="header-btn" onClick={handleImport} title="导入项目">
            <Upload size={18} />
            导入
          </button>
          <button className="header-btn" onClick={handleExport} title="导出项目">
            <Download size={18} />
            导出
          </button>
          <button className="header-btn danger" onClick={handleClearAll} title="清空所有">
            <Trash2 size={18} />
            清空
          </button>
          <DeveloperMode />
        </div>
      </header>
      
      <main className="app-main">
        <div className="main-left">
          <BlockPalette onBlockDragStart={handleBlockDragStart} />
        </div>
        
        <div className="main-center">
          <Canvas ref={canvasRef} />
        </div>
        
        <div className="main-right">
          <PreviewPanel />
        </div>
        
        {/* 开发者面板 - 右侧纵向栏，仅在开发者模式下显示 */}
        {isWebRReady && isDeveloperMode && (
          <div className="main-developer">
            <DeveloperPanel webR={webRRunner.getWebR()} />
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <div>
          <p>
            <strong>快捷键：</strong>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
              框选多选 | Ctrl+点击切换选择 | Ctrl+A全选 | Delete删除 | ESC取消选择
            </span>
          </p>
          <p style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            <strong>提示：</strong>在空白区域拖动鼠标可以框选多个积木，批量移动
          </p>
        </div>
        <p className="footer-info">
          GGplotChim v1.0.0 | 基于 React 18 + TypeScript
        </p>
      </footer>
    </div>
  );
};

export default App;

