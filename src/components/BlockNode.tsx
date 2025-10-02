import React from 'react';
import { BlockInstance, BlockDefinition } from '../types/blocks';
import { useBlockStore } from '../store/useBlockStore';
import { X } from 'lucide-react';

interface BlockNodeProps {
  block: BlockInstance;
  definition: BlockDefinition;
  onClick: () => void;
  onDelete: () => void;
}

const BlockNode: React.FC<BlockNodeProps> = ({ block, definition, onClick, onDelete }) => {
  const { selectedBlockId } = useBlockStore();
  const isSelected = selectedBlockId === block.id;
  
  return (
    <div
      className={`block-node ${isSelected ? 'selected' : ''}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        borderLeftColor: definition.color
      }}
      onClick={onClick}
    >
      <div className="block-node-header">
        <span className="block-node-label">{definition.label}</span>
        <button
          className="block-node-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
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
    </div>
  );
};

export default BlockNode;

