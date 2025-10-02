import React, { useCallback, useEffect, useState } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { BlockDefinition, BlockInstance } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';
import BlockNode from './BlockNode';
import { generateRCode } from '../utils/codeGenerator';
import { connectBlocks, findNearestConnectable, updateChainOrder } from '../utils/blockConnections';

interface CanvasProps {
  draggedBlock: BlockDefinition | null;
}

const SNAP_DISTANCE = 80; // 自动吸附距离

const Canvas: React.FC<CanvasProps> = ({ draggedBlock }) => {
  const { blocks, addBlock, removeBlock, updateBlock, setSelectedBlock, setGeneratedCode } = useBlockStore();
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [nearestBlock, setNearestBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ blockId: string; type: 'input' | 'output' } | null>(null);
  
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
      }, {} as Record<string, any>),
      connections: {
        input: null,
        outputs: []
      },
      order: 0
    };
    
    addBlock(newBlock);
    
    // 检查是否有可以自动连接的积木
    const nearest = findNearestConnectable(newBlock, blocks, SNAP_DISTANCE);
    if (nearest) {
      // 自动连接到最近的积木
      const { source, target } = connectBlocks(nearest, newBlock);
      updateBlock(source.id, source);
      updateBlock(target.id, target);
      
      // 更新整个链的顺序
      const rootBlockId = findRootBlock(blocks, source.id);
      const updatedBlocks = updateChainOrder(blocks, rootBlockId);
      updatedBlocks.forEach(b => updateBlock(b.id, b));
    }
  }, [draggedBlock, addBlock, blocks, updateBlock]);
  
  const handleBlockClick = useCallback((blockId: string) => {
    setSelectedBlock(blockId);
  }, [setSelectedBlock]);
  
  // 开始拖动已存在的积木
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    setDraggingBlockId(blockId);
    setDragOffset({
      x: e.clientX - block.position.x,
      y: e.clientY - block.position.y
    });
    setSelectedBlock(blockId);
  }, [blocks, setSelectedBlock]);
  
  // 拖动积木
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingBlockId || !dragOffset) return;
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    
    // 直接更新 DOM 以获得更平滑的效果
    const blockElement = document.querySelector(`[data-block-id="${draggingBlockId}"]`) as HTMLElement;
    if (blockElement) {
      blockElement.style.left = `${x}px`;
      blockElement.style.top = `${y}px`;
    }
  }, [draggingBlockId, dragOffset]);
  
  // 结束拖动积木
  const handleMouseUp = useCallback(() => {
    if (draggingBlockId) {
      // 从 DOM 获取最终位置并更新 store
      const blockElement = document.querySelector(`[data-block-id="${draggingBlockId}"]`) as HTMLElement;
      if (blockElement) {
        const x = parseFloat(blockElement.style.left) || 0;
        const y = parseFloat(blockElement.style.top) || 0;
        
        const block = blocks.find(b => b.id === draggingBlockId);
        if (block) {
          updateBlock(draggingBlockId, {
            ...block,
            position: { x, y }
          });
        }
      }
      
      setDraggingBlockId(null);
      setDragOffset(null);
    }
  }, [draggingBlockId, blocks, updateBlock]);
  
  // 开始连接
  const handleConnectionStart = useCallback((blockId: string, type: 'input' | 'output') => {
    setConnectingFrom({ blockId, type });
  }, []);
  
  // 完成连接
  const handleConnectionEnd = useCallback((targetBlockId: string, targetType: 'input' | 'output') => {
    if (!connectingFrom) return;
    
    const sourceBlock = blocks.find(b => b.id === connectingFrom.blockId);
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    
    if (!sourceBlock || !targetBlock || sourceBlock.id === targetBlock.id) {
      setConnectingFrom(null);
      return;
    }
    
    // 只允许 output -> input 的连接
    if (connectingFrom.type === 'output' && targetType === 'input') {
      const { source, target } = connectBlocks(sourceBlock, targetBlock);
      updateBlock(source.id, source);
      updateBlock(target.id, target);
      
      // 更新整个链的顺序
      const rootBlockId = findRootBlock(blocks, source.id);
      const updatedBlocks = updateChainOrder(blocks, rootBlockId);
      updatedBlocks.forEach(b => updateBlock(b.id, b));
    } else if (connectingFrom.type === 'input' && targetType === 'output') {
      const { source, target } = connectBlocks(targetBlock, sourceBlock);
      updateBlock(source.id, source);
      updateBlock(target.id, target);
      
      // 更新整个链的顺序
      const rootBlockId = findRootBlock(blocks, source.id);
      const updatedBlocks = updateChainOrder(blocks, rootBlockId);
      updatedBlocks.forEach(b => updateBlock(b.id, b));
    }
    
    setConnectingFrom(null);
  }, [connectingFrom, blocks, updateBlock]);
  
  // 添加全局鼠标事件监听
  useEffect(() => {
    if (draggingBlockId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingBlockId, handleMouseMove, handleMouseUp]);
  
  const handleBlockDelete = useCallback((blockId: string) => {
    const blockToDelete = blocks.find(b => b.id === blockId);
    if (!blockToDelete) return;
    
    // 如果有输入连接，断开
    if (blockToDelete.connections.input) {
      const sourceBlock = blocks.find(b => b.id === blockToDelete.connections.input);
      if (sourceBlock) {
        const updatedSource = {
          ...sourceBlock,
          connections: {
            ...sourceBlock.connections,
            outputs: sourceBlock.connections.outputs.filter(id => id !== blockId)
          }
        };
        updateBlock(sourceBlock.id, updatedSource);
      }
    }
    
    // 如果有输出连接，断开所有下游积木
    blockToDelete.connections.outputs.forEach(outputId => {
      const targetBlock = blocks.find(b => b.id === outputId);
      if (targetBlock) {
        const updatedTarget = {
          ...targetBlock,
          connections: {
            ...targetBlock.connections,
            input: null
          },
          order: 0
        };
        updateBlock(targetBlock.id, updatedTarget);
      }
    });
    
    removeBlock(blockId);
    setSelectedBlock(null);
  }, [blocks, removeBlock, setSelectedBlock, updateBlock]);
  
  // 查找链的根积木
  const findRootBlock = (allBlocks: BlockInstance[], blockId: string): string => {
    const block = allBlocks.find(b => b.id === blockId);
    if (!block || !block.connections.input) return blockId;
    return findRootBlock(allBlocks, block.connections.input);
  };
  
  // 绘制连接线
  const renderConnections = () => {
    return blocks.map(block => {
      return block.connections.outputs.map(outputId => {
        const targetBlock = blocks.find(b => b.id === outputId);
        if (!targetBlock) return null;
        
        const definition = blockDefinitions.find(d => d.type === block.blockType);
        const color = definition?.color || '#666';
        
        // 计算连接线的起点和终点
        const startX = block.position.x + 100; // 假设积木宽度为 200px，中心点为 100px
        const startY = block.position.y + 80; // 假设积木高度约 80px，底部连接点
        const endX = targetBlock.position.x + 100;
        const endY = targetBlock.position.y; // 顶部连接点
        
        // 计算贝塞尔曲线的控制点
        const controlOffset = Math.abs(endY - startY) * 0.5;
        const cp1X = startX;
        const cp1Y = startY + controlOffset;
        const cp2X = endX;
        const cp2Y = endY - controlOffset;
        
        const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        
        return (
          <path
            key={`${block.id}-${outputId}`}
            d={pathD}
            stroke={color}
            strokeWidth="2"
            fill="none"
            className="connection-line"
          />
        );
      });
    });
  };
  
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
            <p className="canvas-tip">💡 积木可以通过上下连接点进行组合</p>
          </div>
        ) : (
          <div className="canvas-blocks">
            {/* SVG 层用于绘制连接线 */}
            <svg className="connection-layer">
              {renderConnections()}
            </svg>
            
            {/* 积木层 */}
            {blocks.map(block => {
              const definition = blockDefinitions.find(d => d.type === block.blockType);
              return definition ? (
                <div key={block.id} data-block-id={block.id}>
                  <BlockNode
                    block={block}
                    definition={definition}
                    onClick={() => handleBlockClick(block.id)}
                    onDelete={() => handleBlockDelete(block.id)}
                    onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
                    onConnectionStart={handleConnectionStart}
                    onConnectionEnd={(type) => handleConnectionEnd(block.id, type)}
                    isDragging={draggingBlockId === block.id}
                  />
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;

