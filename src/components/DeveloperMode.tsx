import React, { useState } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { Settings, Lock, Unlock } from 'lucide-react';

const DeveloperMode: React.FC = () => {
  const { isDeveloperMode, setIsDeveloperMode } = useBlockStore();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleToggleDeveloperMode = () => {
    if (isDeveloperMode) {
      // 如果当前是开发者模式，直接关闭
      setIsDeveloperMode(false);
    } else {
      // 如果当前不是开发者模式，显示密钥输入框
      setShowKeyModal(true);
      setInputKey('');
      setError('');
    }
  };

  const handleKeySubmit = () => {
    if (inputKey === 'daish') {
      setIsDeveloperMode(true);
      setShowKeyModal(false);
      setInputKey('');
      setError('');
    } else {
      setError('密钥错误，请重新输入');
      setInputKey('');
    }
  };

  const handleKeyCancel = () => {
    setShowKeyModal(false);
    setInputKey('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeySubmit();
    } else if (e.key === 'Escape') {
      handleKeyCancel();
    }
  };

  return (
    <>
      {/* 开发者模式按钮 */}
      <button
        className={`header-btn ${isDeveloperMode ? 'developer-active' : ''}`}
        onClick={handleToggleDeveloperMode}
        title={isDeveloperMode ? '退出开发者模式' : '进入开发者模式'}
      >
        {isDeveloperMode ? <Unlock size={18} /> : <Lock size={18} />}
        {isDeveloperMode ? '开发者' : '开发者'}
      </button>

      {/* 密钥输入模态框 */}
      {showKeyModal && (
        <div className="developer-key-modal-overlay">
          <div className="developer-key-modal">
            <div className="developer-key-modal-header">
              <Settings size={20} />
              <h3>开发者模式</h3>
            </div>
            
            <div className="developer-key-modal-content">
              <p>请输入开发者密钥以启用开发者模式：</p>
              
              <div className="developer-key-input-group">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="请输入密钥"
                  className="developer-key-input"
                  autoFocus
                />
                {error && <div className="developer-key-error">{error}</div>}
              </div>
            </div>
            
            <div className="developer-key-modal-actions">
              <button
                className="developer-key-btn secondary"
                onClick={handleKeyCancel}
              >
                取消
              </button>
              <button
                className="developer-key-btn primary"
                onClick={handleKeySubmit}
                disabled={!inputKey.trim()}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeveloperMode;
