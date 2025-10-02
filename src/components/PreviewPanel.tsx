import React, { useState } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import CodePreview from './CodePreview';
import PlotPreview from './PlotPreview';

const PreviewPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'plot'>('code');
  
  return (
    <div className="preview-panel">
      <div className="preview-header">
        <div className="preview-tabs">
          <button
            className={`preview-tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            📝 代码预览
          </button>
          <button
            className={`preview-tab ${activeTab === 'plot' ? 'active' : ''}`}
            onClick={() => setActiveTab('plot')}
          >
            📊 图表预览
          </button>
        </div>
      </div>
      
      <div className="preview-content">
        {activeTab === 'code' ? <CodePreview /> : <PlotPreview />}
      </div>
    </div>
  );
};

export default PreviewPanel;

