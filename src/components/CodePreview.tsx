import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useBlockStore } from '../store/useBlockStore';
import { Copy, Download, Lock, Unlock, RefreshCw } from 'lucide-react';

const CodePreview: React.FC = () => {
  const { generatedCode, updateCodeAndSync, syncSource } = useBlockStore();
  const [isEditable, setIsEditable] = useState(false);
  const [localCode, setLocalCode] = useState(generatedCode);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 当生成的代码更新时，同步到本地代码（仅在非用户编辑时）
  useEffect(() => {
    if (syncSource !== 'code') {
      setLocalCode(generatedCode);
    }
  }, [generatedCode, syncSource]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    alert('代码已复制到剪贴板！');
  };
  
  const handleDownload = () => {
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ggplot_code.R';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const toggleEditable = () => {
    setIsEditable(!isEditable);
    if (!isEditable) {
      // 切换到可编辑模式时，同步当前代码
      setLocalCode(generatedCode);
    }
  };
  
  const handleCodeChange = (value: string | undefined) => {
    if (!value) return;
    
    console.log('📝 [CodePreview] 代码变更，长度:', value.length);
    setLocalCode(value);
    
    // 防抖：用户停止输入500ms后才同步到积木
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (isEditable) {
        console.log('⏰ [CodePreview] 防抖计时器触发，开始同步...');
        updateCodeAndSync(value);
      }
    }, 500);
  };
  
  const handleSyncNow = () => {
    console.log('🔄 [CodePreview] 手动触发同步');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    updateCodeAndSync(localCode);
  };
  
  return (
    <div className="code-preview">
      <div className="code-actions">
        <button 
          className={`action-btn ${isEditable ? 'active' : ''}`} 
          onClick={toggleEditable} 
          title={isEditable ? '锁定代码（只读）' : '解锁代码（可编辑）'}
        >
          {isEditable ? <Unlock size={16} /> : <Lock size={16} />}
          {isEditable ? '可编辑' : '只读'}
        </button>
        
        {isEditable && (
          <button 
            className="action-btn sync-btn" 
            onClick={handleSyncNow} 
            title="立即同步到积木块"
          >
            <RefreshCw size={16} />
            同步
          </button>
        )}
        
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
          value={localCode}
          theme="vs-dark"
          onChange={handleCodeChange}
          options={{
            readOnly: !isEditable,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2
          }}
        />
      </div>
      
      {isEditable && (
        <div className="code-sync-hint">
          <span className="hint-icon">💡</span>
          <span>编辑代码后会自动同步到左侧积木块（延迟500ms），或点击"同步"按钮立即同步</span>
        </div>
      )}
    </div>
  );
};

export default CodePreview;

