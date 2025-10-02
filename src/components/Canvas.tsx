import React, { useCallback, useEffect } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { BlockDefinition, BlockInstance } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';
import BlockNode from './BlockNode';
import { generateRCode } from '../utils/codeGenerator';

interface CanvasProps {
  draggedBlock: BlockDefinition | null;
}

const Canvas: React.FC<CanvasProps> = ({ draggedBlock }) => {
  const { blocks, addBlock, removeBlock, setSelectedBlock, setGeneratedCode } = useBlockStore();
  
  // 更新生成的代码
  useEffect(() => {
    const code = generateRCode(blocks);
    setGeneratedCode(code);
  }, [blocks, setGeneratedCode]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedBlock) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 创建新积木实例
    const newBlock: BlockInstance = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockType: draggedBlock.type,
      position: { x, y },
      params: draggedBlock.params.reduce((acc, param) => {
        acc[param.name] = param.defaultValue;
        return acc;
      }, {} as Record<string, any>)
    };
    
    addBlock(newBlock);
  }, [draggedBlock, addBlock]);
  
  const handleBlockClick = useCallback((blockId: string) => {
    setSelectedBlock(blockId);
  }, [setSelectedBlock]);
  
  const handleBlockDelete = useCallback((blockId: string) => {
    removeBlock(blockId);
    setSelectedBlock(null);
  }, [removeBlock, setSelectedBlock]);
  
  return (
    <div 
      className="canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="canvas-header">
        <h2>画布</h2>
        <div className="canvas-info">
          已添加 {blocks.length} 个积木
        </div>
      </div>
      
      <div className="canvas-content">
        {blocks.length === 0 ? (
          <div className="canvas-empty">
            <p>从左侧拖拽积木到这里开始创建图表</p>
          </div>
        ) : (
          <div className="canvas-blocks">
            {blocks.map(block => {
              const definition = blockDefinitions.find(d => d.type === block.blockType);
              return definition ? (
                <BlockNode
                  key={block.id}
                  block={block}
                  definition={definition}
                  onClick={() => handleBlockClick(block.id)}
                  onDelete={() => handleBlockDelete(block.id)}
                />
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;

