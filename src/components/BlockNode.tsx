import React from 'react';
import { BlockInstance, BlockDefinition } from '../types/blocks';
import { useBlockStore } from '../store/useBlockStore';
import { blockDefinitions } from '../data/blockDefinitions';
import { X, Circle } from 'lucide-react';

interface BlockNodeProps {
  block: BlockInstance;
  definition: BlockDefinition;
  onClick: (e: React.MouseEvent) => void;
  onDelete: (blockId: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionStart?: (blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput', e?: React.MouseEvent) => void;
  onConnectionEnd?: (blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput') => void;
  onDropToSlot?: (slotName: string, draggedBlockId: string) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  dropTarget?: { containerId: string; slotName: string; insertIndex: number } | null;
  onDoubleClick?: (blockId: string) => void;
  onButtonToggle?: (blockId: string, paramName: string, buttonId: string) => void;
}

const BlockNode: React.FC<BlockNodeProps> = ({ 
  block, 
  definition, 
  onClick, 
  onDelete,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  onDropToSlot,
  isDragging = false,
  isSelected = false,
  dropTarget = null,
  onDoubleClick,
  onButtonToggle
}) => {
  const { blocks } = useBlockStore();
  
  const getBlockDefinition = (blockType: string) => {
    return blockDefinitions.find(def => def.type === blockType);
  };
  
  const handleConnectionStart = (e: React.MouseEvent, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput') => {
    e.stopPropagation();
    e.preventDefault();
    if (onConnectionStart) {
      onConnectionStart(block.id, type, e);
    }
  };
  
  const handleConnectionEnd = (e: React.MouseEvent, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput') => {
    e.stopPropagation();
    e.preventDefault();
    if (onConnectionEnd) {
      onConnectionEnd(block.id, type);
    }
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🖱️ 双击积木:', block.id);
    if (onDoubleClick) {
      onDoubleClick(block.id);
    }
  };
  
  const isContainer = definition.slots && definition.slots.length > 0;
  
  return (
    <div
      className={`block-node ${isContainer ? 'container-block' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      data-block-id={block.id}
      style={{
        borderLeftColor: definition.color,
        boxShadow: isSelected ? '0 0 0 3px rgba(79, 70, 229, 0.5)' : undefined
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
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
            onDelete(block.id);
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
          
          // 处理按钮组参数
          if (param.type === 'buttonGroup') {
            const selectedButtons = Array.isArray(value) ? value : [];
            const buttonOptions = param.buttonOptions || [];
            const rows = param.rows || 1;
            
            return (
              <div key={key} className="param-display button-group-param">
                <span className="param-label">{param.label}:</span>
                <div className="button-group" style={{ gridTemplateColumns: `repeat(${Math.ceil(buttonOptions.length / rows)}, 1fr)` }}>
                  {buttonOptions.map((option) => {
                    const isSelected = selectedButtons.includes(option.id);
                    const isDisabled = selectedButtons.some(selectedId => {
                      const selectedOption = buttonOptions.find(opt => opt.id === selectedId);
                      return selectedOption?.conflicts?.includes(option.id);
                    });
                    
                    return (
                      <button
                        key={option.id}
                        className={`param-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onButtonToggle) {
                            onButtonToggle(block.id, key, option.id);
                          }
                        }}
                        disabled={isDisabled}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          
          return (
            <div key={key} className="param-display">
              <span className="param-label">{param.label}:</span>
              <span className="param-value">{String(value)}</span>
            </div>
          );
        })}
      </div>
      
      {/* 容器型积木的插槽 */}
      {definition.isContainer && definition.slots && (
        <div className="block-slots">
          {definition.slots.map((slot) => {
            const childrenIds = block.children?.[slot.name] || [];
            const isDropTarget = dropTarget?.containerId === block.id && dropTarget?.slotName === slot.name;
            
            return (
              <div 
                key={slot.name} 
                className={`block-slot ${isDropTarget ? 'drop-target' : ''}`}
              >
                <div className="slot-label">{slot.label}</div>
                
                {/* 循环体输入连接点 */}
                <div 
                  className="connection-point connection-body-input"
                  onMouseDown={(e) => handleConnectionStart(e, 'bodyInput')}
                  onMouseUp={(e) => handleConnectionEnd(e, 'bodyInput')}
                  title="循环体输入 - 连接到循环体第一个积木"
                >
                  <Circle size={10} fill={block.connections.bodyInput ? definition.color : 'white'} />
                </div>
                
                <div className="slot-drop-zone">
                  {childrenIds.length === 0 ? (
                    <>
                      <div className="slot-placeholder">拖拽积木到这里</div>
                      {isDropTarget && <div className="drop-indicator" style={{ top: 0 }} />}
                    </>
                  ) : (
                    <div className="slot-children">
                      {childrenIds.map((childId, index) => {
                        const childBlock = blocks.find(b => b.id === childId);
                        const childDef = childBlock ? getBlockDefinition(childBlock.blockType) : null;
                        if (!childBlock || !childDef) return null;
                        
                        return (
                          <React.Fragment key={childId}>
                            {isDropTarget && dropTarget.insertIndex === index && (
                              <div className="drop-indicator" />
                            )}
                            <BlockNode
                              block={childBlock}
                              definition={childDef}
                              onClick={(e) => { e.stopPropagation(); onClick(e); }}
                              onDelete={onDelete}
                              onMouseDown={(e) => { 
                                e.stopPropagation(); 
                                onMouseDown?.(e);
                              }}
                              onConnectionStart={onConnectionStart}
                              onConnectionEnd={onConnectionEnd}
                              onDropToSlot={onDropToSlot}
                              dropTarget={dropTarget}
                              onDoubleClick={onDoubleClick}
                            />
                          </React.Fragment>
                        );
                      })}
                      {isDropTarget && dropTarget.insertIndex === childrenIds.length && (
                        <div className="drop-indicator" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* 循环体输出连接点 */}
                <div 
                  className="connection-point connection-body-output"
                  onMouseDown={(e) => handleConnectionStart(e, 'bodyOutput')}
                  onMouseUp={(e) => handleConnectionEnd(e, 'bodyOutput')}
                  title="循环体输出 - 连接到循环体最后一个积木"
                >
                  <Circle size={10} fill={block.connections.bodyOutput ? definition.color : 'white'} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 输出连接点（底部） */}
      <div 
        className="connection-point connection-output"
        onMouseDown={(e) => handleConnectionStart(e, 'output')}
        onMouseUp={(e) => handleConnectionEnd(e, 'output')}
        title="输出连接点 - 连接到下一个积木"
      >
        <Circle size={12} fill={block.connections.output ? definition.color : 'white'} />
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

