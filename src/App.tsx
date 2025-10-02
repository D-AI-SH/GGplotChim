import React, { useState } from 'react';
import BlockPalette from './components/BlockPalette';
import Canvas from './components/Canvas';
import PreviewPanel from './components/PreviewPanel';
import { BlockDefinition } from './types/blocks';
import { useBlockStore } from './store/useBlockStore';
import { Trash2, Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [draggedBlock, setDraggedBlock] = useState<BlockDefinition | null>(null);
  const { clearAll } = useBlockStore();
  
  const handleBlockDragStart = (block: BlockDefinition) => {
    setDraggedBlock(block);
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
  
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="logo">🎨</span>
            GGplotChim
          </h1>
          <p className="app-subtitle">可视化 ggplot2 编程工具</p>
        </div>
        
        <div className="header-actions">
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
        </div>
      </header>
      
      <main className="app-main">
        <div className="main-left">
          <BlockPalette onBlockDragStart={handleBlockDragStart} />
        </div>
        
        <div className="main-center">
          <Canvas draggedBlock={draggedBlock} />
        </div>
        
        <div className="main-right">
          <PreviewPanel />
        </div>
      </main>
      
      <footer className="app-footer">
        <p>
          <strong>提示：</strong>从左侧拖拽积木到画布，实时生成 R 代码
        </p>
        <p className="footer-info">
          GGplotChim v1.0.0 | 基于 React 18 + TypeScript
        </p>
      </footer>
    </div>
  );
};

export default App;

