import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useBlockStore } from '../store/useBlockStore';
import { Copy, Download, Lock, Unlock, RefreshCw } from 'lucide-react';

const CodePreview: React.FC = () => {
  const { generatedCode, updateCodeAndSync, enableCodeNormalization } = useBlockStore();
  const [isEditable, setIsEditable] = useState(false);
  const [localCode, setLocalCode] = useState(generatedCode);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null); // 同步到积木块的计时器（500ms）
  const normalizeTimerRef = useRef<NodeJS.Timeout | null>(null); // 规范化显示的计时器（5秒）
  const lastEditTimeRef = useRef<number>(0); // 最后一次编辑的时间戳
  
  // 当生成的代码更新时，同步到本地代码
  useEffect(() => {
    // 如果用户最近5秒内编辑过，不要覆盖用户的输入
    const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
    if (timeSinceLastEdit < 5000) {
      console.log('⏭️ [CodePreview] 用户最近编辑过，跳过更新');
      return;
    }
    
    console.log('✨ [CodePreview] 更新本地代码（规范化后）');
    setLocalCode(generatedCode);
  }, [generatedCode]);
  
  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      if (normalizeTimerRef.current) {
        clearTimeout(normalizeTimerRef.current);
      }
    };
  }, []);
  
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
    const currentCode = value; // 保存当前代码的快照
    setLocalCode(currentCode);
    lastEditTimeRef.current = Date.now(); // 记录编辑时间
    
    // 清除所有现有的计时器
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    if (normalizeTimerRef.current) {
      clearTimeout(normalizeTimerRef.current);
    }
    
    // 第一步：500ms 后同步到积木块（解析AST并更新store）
    syncTimerRef.current = setTimeout(async () => {
      if (isEditable) {
        console.log('⏰ [CodePreview] 500ms计时器触发，同步到积木块...');
        console.log('📊 [CodePreview] 同步的代码长度:', currentCode.length);
        await updateCodeAndSync(currentCode);
        console.log('✅ [CodePreview] 积木块同步完成');
        
        // 第二步：再等待5秒后，如果用户没有继续编辑，且启用了代码规范化，则显示规范化后的代码
        normalizeTimerRef.current = setTimeout(() => {
          const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
          const { enableCodeNormalization: normalizationEnabled } = useBlockStore.getState();
          
          if (timeSinceLastEdit >= 5000) {
            if (normalizationEnabled) {
              console.log('🎨 [CodePreview] 5秒无编辑，准备应用代码规范化');
              const { generatedCode: updatedCode } = useBlockStore.getState();
              console.log('📊 [CodePreview] 编辑时的代码长度:', currentCode.length);
              console.log('📊 [CodePreview] 规范化后代码长度:', updatedCode.length);
              console.log('📊 [CodePreview] 编辑时代码前100字符:', currentCode.substring(0, 100));
              console.log('📊 [CodePreview] 规范化后前100字符:', updatedCode.substring(0, 100));
              console.log('📊 [CodePreview] 代码是否相同:', currentCode === updatedCode);
              if (currentCode !== updatedCode) {
                console.log('✅ [CodePreview] 应用规范化代码');
                setLocalCode(updatedCode);
              } else {
                console.log('⏭️ [CodePreview] 代码已经是规范化的，无需更新');
              }
            } else {
              console.log('⏭️ [CodePreview] 代码规范化已禁用，保持用户编辑的代码');
            }
          } else {
            console.log('⏭️ [CodePreview] 用户继续编辑了，跳过规范化');
          }
        }, 5000);
      }
    }, 500);
  };
  
  const handleSyncNow = async () => {
    console.log('🔄 [CodePreview] 手动触发同步');
    const codeBeforeSync = localCode;
    console.log('📊 [CodePreview] 同步前代码长度:', codeBeforeSync.length);
    
    // 清除所有计时器
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    if (normalizeTimerRef.current) {
      clearTimeout(normalizeTimerRef.current);
    }
    
    // 立即同步
    await updateCodeAndSync(codeBeforeSync);
    console.log('✅ [CodePreview] 手动同步完成');
    
    // 等待下一个 tick 以获取更新后的 generatedCode
    setTimeout(() => {
      const { generatedCode: updatedCode, enableCodeNormalization: normalizationEnabled } = useBlockStore.getState();
      
      if (normalizationEnabled) {
        console.log('🎨 [CodePreview] 代码规范化已启用，立即应用规范化');
        console.log('📊 [CodePreview] 规范化后代码长度:', updatedCode.length);
        console.log('📊 [CodePreview] 同步前代码前100字符:', codeBeforeSync.substring(0, 100));
        console.log('📊 [CodePreview] 规范化后前100字符:', updatedCode.substring(0, 100));
        console.log('📊 [CodePreview] 代码是否相同:', codeBeforeSync === updatedCode);
        setLocalCode(updatedCode);
      } else {
        console.log('⏭️ [CodePreview] 代码规范化已禁用，保持用户编辑的代码');
      }
    }, 0);
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
          <span>
            编辑代码后会自动同步到积木块（500ms后）
            {enableCodeNormalization && '，5秒无编辑时自动规范化显示'}
          </span>
        </div>
      )}
    </div>
  );
};

export default CodePreview;

