import React, { useState, useEffect } from 'react';
import { BlockInstance, BlockDefinition, BlockParam } from '../types/blocks';
import { useBlockStore } from '../store/useBlockStore';
import { blockDefinitions } from '../data/blockDefinitions';
import { X } from 'lucide-react';
import '../styles/BlockEditor.css';

interface BlockEditorProps {
  blockId: string;
  onClose: () => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ blockId, onClose }) => {
  const { blocks, updateBlock, updateBlockParams } = useBlockStore();
  
  // 查找当前积木和其定义
  const block = blocks.find(b => b.id === blockId);
  const definition = block ? blockDefinitions.find(def => def.type === block.blockType) : null;
  
  // 编辑中的参数状态
  const [editedParams, setEditedParams] = useState<Record<string, any>>({});
  const [editedAssignedTo, setEditedAssignedTo] = useState<string>('');
  
  useEffect(() => {
    if (block) {
      setEditedParams({ ...block.params });
      setEditedAssignedTo(block.assignedTo || '');
    }
  }, [block]);
  
  if (!block || !definition) {
    return null;
  }
  
  // 处理参数变化
  const handleParamChange = (paramName: string, value: any) => {
    setEditedParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };
  
  // 保存更改
  const handleSave = () => {
    // 更新参数
    updateBlockParams(blockId, editedParams);
    
    // 更新赋值变量名
    if (editedAssignedTo !== block.assignedTo) {
      updateBlock(blockId, { assignedTo: editedAssignedTo || undefined });
    }
    
    onClose();
  };
  
  // 取消编辑
  const handleCancel = () => {
    onClose();
  };
  
  // 渲染参数输入框
  const renderParamInput = (param: BlockParam) => {
    const value = editedParams[param.name] ?? param.defaultValue ?? '';
    
    switch (param.type) {
      case 'text':
        return (
          <input
            type="text"
            className="block-editor-input"
            value={value}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            placeholder={param.label}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className="block-editor-input"
            value={value}
            onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
            placeholder={param.label}
          />
        );
      
      case 'boolean':
        return (
          <label className="block-editor-checkbox">
            <input
              type="checkbox"
              checked={value === true || value === 'TRUE'}
              onChange={(e) => handleParamChange(param.name, e.target.checked)}
            />
            <span>{param.label}</span>
          </label>
        );
      
      case 'select':
        return (
          <select
            className="block-editor-select"
            value={value}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
          >
            <option value="">-- 请选择 --</option>
            {param.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'color':
        return (
          <div className="block-editor-color-input">
            <input
              type="color"
              value={value}
              onChange={(e) => handleParamChange(param.name, e.target.value)}
            />
            <input
              type="text"
              className="block-editor-input"
              value={value}
              onChange={(e) => handleParamChange(param.name, e.target.value)}
              placeholder="#000000"
            />
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            className="block-editor-input"
            value={value}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            placeholder={param.label}
          />
        );
    }
  };
  
  return (
    <div className="block-editor-overlay" onClick={handleCancel}>
      <div className="block-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="block-editor-header" style={{ borderLeftColor: definition.color }}>
          <h3>{definition.label} - 参数编辑</h3>
          <button className="block-editor-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>
        
        {/* 内容区 */}
        <div className="block-editor-content">
          {/* 赋值变量名（可选） */}
          <div className="block-editor-section">
            <h4>变量赋值（可选）</h4>
            <div className="block-editor-field">
              <label className="block-editor-label">
                赋值给变量：
                <span className="block-editor-hint">（留空则不赋值）</span>
              </label>
              <input
                type="text"
                className="block-editor-input"
                value={editedAssignedTo}
                onChange={(e) => setEditedAssignedTo(e.target.value)}
                placeholder="例如：p, data, result"
              />
            </div>
          </div>
          
          {/* 积木参数 */}
          {definition.params.length > 0 && (
            <div className="block-editor-section">
              <h4>积木参数</h4>
              {definition.params.map((param) => (
                <div key={param.name} className="block-editor-field">
                  <label className="block-editor-label">
                    {param.label}
                    {param.required && <span className="block-editor-required">*</span>}
                    {param.type !== 'boolean' && ':'}
                  </label>
                  {renderParamInput(param)}
                </div>
              ))}
            </div>
          )}
          
          {/* 积木信息 */}
          <div className="block-editor-section">
            <h4>积木信息</h4>
            <div className="block-editor-info">
              <p><strong>类型：</strong>{definition.type}</p>
              <p><strong>描述：</strong>{definition.description}</p>
              {definition.isContainer && (
                <p className="block-editor-container-hint">
                  🔧 这是一个容器型积木，可以包含其他积木
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* 按钮栏 */}
        <div className="block-editor-footer">
          <button className="block-editor-button block-editor-button-cancel" onClick={handleCancel}>
            取消
          </button>
          <button className="block-editor-button block-editor-button-save" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockEditor;

