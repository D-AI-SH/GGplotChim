import React from 'react';
import { BlockInstance, BlockDefinition } from '../types/blocks';
import { useBlockStore } from '../store/useBlockStore';
import { X, Circle } from 'lucide-react';

interface BlockNodeProps {
  block: BlockInstance;
  definition: BlockDefinition;
  onClick: () => void;
  onDelete: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionStart?: (blockId: string, type: 'input' | 'output') => void;
  onConnectionEnd?: (type: 'input' | 'output') => void;
  isDragging?: boolean;
}

const BlockNode: React.FC<BlockNodeProps> = ({ 
  block, 
  definition, 
  onClick, 
  onDelete,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  isDragging = false
}) => {
  const { selectedBlockId } = useBlockStore();
  const isSelected = selectedBlockId === block.id;
  
  const handleConnectionStart = (e: React.MouseEvent, type: 'input' | 'output') => {
    e.stopPropagation();
    if (onConnectionStart) {
      onConnectionStart(block.id, type);
    }
  };
  
  const handleConnectionEnd = (e: React.MouseEvent, type: 'input' | 'output') => {
    e.stopPropagation();
    if (onConnectionEnd) {
      onConnectionEnd(type);
    }
  };
  
  return (
    <div
      className={`block-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        borderLeftColor: definition.color
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {/* 输入连接点（顶部） */}
      <div 
        className="connection-point connection-input"
        onMouseDown={(e) => handleConnectionStart(e, 'input')}
        onMouseUp={(e) => handleConnectionEnd(e, 'input')}
        title="输入连接点 - 连接到上一个积木"
      >
        <Circle size={12} fill={block.connections.input ? definition.color : 'white'} />
      </div>
      
      <div className="block-node-header">
        <span className="block-node-label">{definition.label}</span>
        <button
          className="block-node-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="block-node-params">
        {Object.entries(block.params).map(([key, value]) => {
          const param = definition.params.find(p => p.name === key);
          if (!param || value === undefined || value === '') return null;
          
          return (
            <div key={key} className="param-display">
              <span className="param-label">{param.label}:</span>
              <span className="param-value">{String(value)}</span>
            </div>
          );
        })}
      </div>
      
      {/* 输出连接点（底部） */}
      <div 
        className="connection-point connection-output"
        onMouseDown={(e) => handleConnectionStart(e, 'output')}
        onMouseUp={(e) => handleConnectionEnd(e, 'output')}
        title="输出连接点 - 连接到下一个积木"
      >
        <Circle size={12} fill={block.connections.outputs.length > 0 ? definition.color : 'white'} />
      </div>
      
      {/* 顺序标记 */}
      {block.order > 0 && (
        <div className="block-order-badge">
          #{block.order + 1}
        </div>
      )}
    </div>
  );
};

export default BlockNode;

