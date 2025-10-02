import React from 'react';
import Editor from '@monaco-editor/react';
import { useBlockStore } from '../store/useBlockStore';
import { Copy, Download } from 'lucide-react';

const CodePreview: React.FC = () => {
  const { generatedCode } = useBlockStore();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('代码已复制到剪贴板！');
  };
  
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ggplot_code.R';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="code-preview">
      <div className="code-actions">
        <button className="action-btn" onClick={handleCopy} title="复制代码">
          <Copy size={16} />
          复制
        </button>
        <button className="action-btn" onClick={handleDownload} title="下载代码">
          <Download size={16} />
          下载
        </button>
      </div>
      
      <div className="code-editor">
        <Editor
          height="100%"
          defaultLanguage="r"
          value={generatedCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
        />
      </div>
    </div>
  );
};

export default CodePreview;

