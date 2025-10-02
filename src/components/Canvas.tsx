import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { BlockDefinition, BlockInstance } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';
import BlockNode from './BlockNode';
import { generateRCode } from '../utils/codeGenerator';
import { connectBlocks, findNearestConnectable, updateChainOrder, findRootBlock } from '../utils/blockConnections';

interface CanvasProps {}

const SNAP_DISTANCE = 50; // 自动吸附距离（像素）
const BLOCK_HEIGHT = 80; // 积木的大致高度，用于计算连接点位置

const Canvas = forwardRef<any, CanvasProps>((props, ref) => {
  const { blocks, addBlock, removeBlock, updateBlock, updateBlocks, setSelectedBlock, setGeneratedCode, selectedBlockIds, setSelectedBlocks, toggleBlockSelection, clearSelection } = useBlockStore();
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [nearestSnapTarget, setNearestSnapTarget] = useState<{ blockId: string; type: 'input' | 'output' } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ blockId: string; type: 'input' | 'output' } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const updateThrottle = 16; // 约 60fps
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 框选相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  
  // 更新生成的代码
  useEffect(() => {
    const code = generateRCode(blocks);
    setGeneratedCode(code);
  }, [blocks, setGeneratedCode]);
  
  // 从积木板拖入积木 - 立即创建积木实例
  const handleBlockDragStart = useCallback((definition: BlockDefinition, e: React.MouseEvent) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - 100); // 居中显示
    const y = Math.max(0, e.clientY - rect.top - 20);
    
    // 立即创建积木实例
    const newBlock: BlockInstance = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockType: definition.type,
      position: { x, y },
      params: definition.params.reduce((acc, param) => {
        acc[param.name] = param.defaultValue;
        return acc;
      }, {} as Record<string, any>),
      connections: {
        input: null,
        output: null
      },
      order: 0
    };
    
    addBlock(newBlock);
    
    // 立即进入拖拽状态
    setDraggingBlockId(newBlock.id);
    setDragOffset({ x: 100, y: 20 }); // 鼠标相对于积木的偏移
    setSelectedBlock(newBlock.id);
  }, [addBlock, setSelectedBlock]);
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleBlockDragStart
  }));
  
  // 处理从积木板拖放的积木（保留用于兼容）
  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    // 现在不需要额外处理，因为已经通过handleBlockDragStart处理
  }, []);
  
  
  const handleBlockClick = useCallback((blockId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+点击，切换选中状态
      toggleBlockSelection(blockId);
    } else {
      // 普通点击，只选中当前积木
      setSelectedBlock(blockId);
    }
  }, [setSelectedBlock, toggleBlockSelection]);
  
  // 开始框选
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // 只有在点击空白区域且不是右键时才开始框选
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    
    if (!e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
  }, [clearSelection]);
  
  // 框选移动
  const handleSelectionMove = useCallback((e: MouseEvent) => {
    if (!isSelecting || !selectionStart || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionEnd({ x, y });
    
    // 计算选择框范围
    const minX = Math.min(selectionStart.x, x);
    const maxX = Math.max(selectionStart.x, x);
    const minY = Math.min(selectionStart.y, y);
    const maxY = Math.max(selectionStart.y, y);
    
    // 检查哪些积木在选择框内
    const selectedIds: string[] = [];
    blocks.forEach(block => {
      const blockElement = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
      if (!blockElement) return;
      
      const blockRect = blockElement.getBoundingClientRect();
      const canvasRect = canvasRef.current!.getBoundingClientRect();
      
      const blockX = blockRect.left - canvasRect.left;
      const blockY = blockRect.top - canvasRect.top;
      const blockRight = blockX + blockRect.width;
      const blockBottom = blockY + blockRect.height;
      
      // 检查积木是否与选择框相交
      if (blockRight >= minX && blockX <= maxX && blockBottom >= minY && blockY <= maxY) {
        selectedIds.push(block.id);
      }
    });
    
    setSelectedBlocks(selectedIds);
  }, [isSelecting, selectionStart, blocks, setSelectedBlocks]);
  
  // 结束框选
  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);
  
  // 开始拖动已存在的积木
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // 如果点击的积木不在选中列表中，则只选中它
    if (!selectedBlockIds.includes(blockId)) {
      if (e.ctrlKey || e.metaKey) {
        toggleBlockSelection(blockId);
      } else {
        setSelectedBlock(blockId);
      }
    }
    
    setDraggingBlockId(blockId);
    setDragOffset({
      x: e.clientX - rect.left - block.position.x,
      y: e.clientY - rect.top - block.position.y
    });
  }, [blocks, setSelectedBlock, selectedBlockIds, toggleBlockSelection]);
  
  // 计算两个连接点之间的距离
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // 查找最近的可吸附积木
  const findNearestSnapTarget = (draggingBlock: BlockInstance, newX: number, newY: number) => {
    let nearest: { blockId: string; type: 'input' | 'output'; distance: number } | null = null;
    
    // 获取拖动积木的输出点和输入点位置
    const draggingOutputY = newY + BLOCK_HEIGHT;
    const draggingInputY = newY;
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return null;
    
    const draggingElement = document.querySelector(`[data-block-id="${draggingBlockId}"]`) as HTMLElement;
    const draggingWidth = draggingElement?.querySelector('.block-node')?.getBoundingClientRect().width || 200;
    const draggingCenterX = newX + draggingWidth / 2;
    
    blocks.forEach(block => {
      if (block.id === draggingBlockId) return;
      
      const blockElement = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
      if (!blockElement) return;
      
      const blockWidth = blockElement.querySelector('.block-node')?.getBoundingClientRect().width || 200;
      const blockCenterX = block.position.x + blockWidth / 2;
      
      // 检查拖动积木的输出点 -> 目标积木的输入点
      if (draggingBlock.connections.output !== block.id && !block.connections.input) {
        // 拖动积木还未连接到目标积木，且目标积木的输入点空闲
        const targetInputY = block.position.y;
        const distance = calculateDistance(draggingCenterX, draggingOutputY, blockCenterX, targetInputY);
        
        if (distance < SNAP_DISTANCE && (!nearest || distance < nearest.distance)) {
          nearest = { blockId: block.id, type: 'input', distance };
        }
      }
      
      // 检查目标积木的输出点 -> 拖动积木的输入点
      if (block.connections.output !== draggingBlockId && !draggingBlock.connections.input) {
        // 目标积木还未连接到拖动积木，且拖动积木的输入点空闲
        const targetOutputY = block.position.y + BLOCK_HEIGHT;
        const distance = calculateDistance(blockCenterX, targetOutputY, draggingCenterX, draggingInputY);
        
        if (distance < SNAP_DISTANCE && (!nearest || distance < nearest.distance)) {
          nearest = { blockId: block.id, type: 'output', distance };
        }
      }
    });
    
    return nearest;
  };

  // 拖动积木（支持批量拖拽）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingBlockId || !dragOffset) return;
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    
    const draggingBlock = blocks.find(b => b.id === draggingBlockId);
    if (!draggingBlock) return;
    
    // 计算位移
    const deltaX = x - draggingBlock.position.x;
    const deltaY = y - draggingBlock.position.y;
    
    // 查找最近的可吸附积木
    const snapTarget = findNearestSnapTarget(draggingBlock, x, y);
    setNearestSnapTarget(snapTarget);
    
    // 使用节流优化性能，约 60fps
    const now = Date.now();
    if (now - lastUpdateTime.current >= updateThrottle) {
      lastUpdateTime.current = now;
      
      // 如果有多个选中的积木，批量移动
      if (selectedBlockIds.length > 1 && selectedBlockIds.includes(draggingBlockId)) {
        const updatedBlocks = blocks.map(block => {
          if (selectedBlockIds.includes(block.id)) {
            return {
              ...block,
              position: {
                x: Math.max(0, block.position.x + deltaX),
                y: Math.max(0, block.position.y + deltaY)
              }
            };
          }
          return block;
        });
        updateBlocks(updatedBlocks);
      } else {
        // 单个积木移动
        updateBlock(draggingBlockId, {
          position: { x, y }
        });
      }
    }
  }, [draggingBlockId, dragOffset, blocks, updateBlock, updateBlocks, updateThrottle, selectedBlockIds]);
  
  // 结束拖动积木
  const handleMouseUp = useCallback(() => {
    if (draggingBlockId && nearestSnapTarget) {
      // 如果有吸附目标，执行自动连接
      const draggingBlock = blocks.find(b => b.id === draggingBlockId);
      const targetBlock = blocks.find(b => b.id === nearestSnapTarget.blockId);
      
      if (draggingBlock && targetBlock) {
        let source: BlockInstance, target: BlockInstance;
        
        // 根据吸附类型确定连接方向
        if (nearestSnapTarget.type === 'input') {
          // 拖动积木的输出连接到目标积木的输入
          ({ source, target } = connectBlocks(draggingBlock, targetBlock));
        } else {
          // 目标积木的输出连接到拖动积木的输入
          ({ source, target } = connectBlocks(targetBlock, draggingBlock));
        }
        
        // 更新连接的两个积木
        const blocksWithConnection = blocks.map(b => {
          if (b.id === source.id) return source;
          if (b.id === target.id) return target;
          return b;
        });
        
        // 更新整个链的顺序
        const rootBlockId = findRootBlock(blocksWithConnection, source.id);
        const updatedBlocks = updateChainOrder(blocksWithConnection, rootBlockId);
        
        // 一次性批量更新所有积木
        updateBlocks(updatedBlocks);
      }
    }
    
    if (draggingBlockId) {
      setDraggingBlockId(null);
      setDragOffset(null);
      setNearestSnapTarget(null);
    }
  }, [draggingBlockId, nearestSnapTarget, blocks, updateBlocks]);
  
  // 保存旧连接，以便在未连接到新目标时恢复
  const [oldConnection, setOldConnection] = useState<{ sourceId: string; targetId: string } | null>(null);
  
  // 开始连接
  const handleConnectionStart = useCallback((blockId: string, type: 'input' | 'output') => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // 记录旧连接并断开
    if (type === 'output' && block.connections.output) {
      // 从输出点拉线，记录旧的输出连接
      const oldTargetId = block.connections.output;
      setOldConnection({ sourceId: blockId, targetId: oldTargetId });
      
      // 立即断开旧连接
      const targetBlock = blocks.find(b => b.id === oldTargetId);
      if (targetBlock) {
        const updatedSource = { ...block, connections: { ...block.connections, output: null } };
        const updatedTarget = { ...targetBlock, connections: { ...targetBlock.connections, input: null }, order: 0 };
        
        updateBlock(updatedSource.id, updatedSource);
        updateBlock(updatedTarget.id, updatedTarget);
      }
    } else if (type === 'input' && block.connections.input) {
      // 从输入点拉线，记录旧的输入连接
      const oldSourceId = block.connections.input;
      setOldConnection({ sourceId: oldSourceId, targetId: blockId });
      
      // 立即断开旧连接
      const sourceBlock = blocks.find(b => b.id === oldSourceId);
      if (sourceBlock) {
        const updatedSource = { ...sourceBlock, connections: { ...sourceBlock.connections, output: null } };
        const updatedTarget = { ...block, connections: { ...block.connections, input: null }, order: 0 };
        
        updateBlock(updatedSource.id, updatedSource);
        updateBlock(updatedTarget.id, updatedTarget);
      }
    }
    
    setConnectingFrom({ blockId, type });
  }, [blocks, updateBlock]);
  
  // 完成连接
  const handleConnectionEnd = useCallback((targetBlockId: string, targetType: 'input' | 'output') => {
    if (!connectingFrom) return;
    
    const sourceBlock = blocks.find(b => b.id === connectingFrom.blockId);
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    
    if (!sourceBlock || !targetBlock || sourceBlock.id === targetBlock.id) {
      setConnectingFrom(null);
      setOldConnection(null);
      return;
    }
    
    // 只允许 output -> input 的连接
    if (connectingFrom.type === 'output' && targetType === 'input') {
      const { source, target } = connectBlocks(sourceBlock, targetBlock);
      
      // 首先更新连接的两个积木
      const blocksWithConnection = blocks.map(b => {
        if (b.id === source.id) return source;
        if (b.id === target.id) return target;
        return b;
      });
      
      // 然后更新整个链的顺序
      const rootBlockId = findRootBlock(blocksWithConnection, source.id);
      const updatedBlocks = updateChainOrder(blocksWithConnection, rootBlockId);
      
      // 一次性批量更新所有积木
      updateBlocks(updatedBlocks);
      
      // 成功连接，清除旧连接记录
      setOldConnection(null);
    } else if (connectingFrom.type === 'input' && targetType === 'output') {
      const { source, target } = connectBlocks(targetBlock, sourceBlock);
      
      // 首先更新连接的两个积木
      const blocksWithConnection = blocks.map(b => {
        if (b.id === source.id) return source;
        if (b.id === target.id) return target;
        return b;
      });
      
      // 然后更新整个链的顺序
      const rootBlockId = findRootBlock(blocksWithConnection, source.id);
      const updatedBlocks = updateChainOrder(blocksWithConnection, rootBlockId);
      
      // 一次性批量更新所有积木
      updateBlocks(updatedBlocks);
      
      // 成功连接，清除旧连接记录
      setOldConnection(null);
    }
    
    setConnectingFrom(null);
    setMousePos(null);
  }, [connectingFrom, blocks, updateBlocks]);
  
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
  
  // 添加框选事件监听
  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleSelectionMove);
      window.addEventListener('mouseup', handleSelectionEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleSelectionMove);
        window.removeEventListener('mouseup', handleSelectionEnd);
      };
    }
  }, [isSelecting, handleSelectionMove, handleSelectionEnd]);
  
  // 追踪鼠标位置（用于连接预览）
  useEffect(() => {
    if (connectingFrom) {
      const handleMouseMoveForConnection = (e: MouseEvent) => {
        const canvas = document.querySelector('.canvas-content') as HTMLElement;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      };
      
      const handleMouseUpForConnection = () => {
        // 松手时如果没有连接到新的积木，保持断开状态（不恢复旧连接）
        setConnectingFrom(null);
        setMousePos(null);
        setOldConnection(null); // 清除旧连接记录，确认断开
      };
      
      window.addEventListener('mousemove', handleMouseMoveForConnection);
      window.addEventListener('mouseup', handleMouseUpForConnection);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMoveForConnection);
        window.removeEventListener('mouseup', handleMouseUpForConnection);
      };
    }
  }, [connectingFrom]);
  
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
            output: null
          }
        };
        updateBlock(sourceBlock.id, updatedSource);
      }
    }
    
    // 如果有输出连接，断开下游积木
    if (blockToDelete.connections.output) {
      const targetBlock = blocks.find(b => b.id === blockToDelete.connections.output);
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
    }
    
    removeBlock(blockId);
    setSelectedBlock(null);
  }, [blocks, removeBlock, setSelectedBlock, updateBlock]);
  
  // 查找链的根积木
  const findRootBlock = (allBlocks: BlockInstance[], blockId: string): string => {
    const block = allBlocks.find(b => b.id === blockId);
    if (!block || !block.connections.input) return blockId;
    return findRootBlock(allBlocks, block.connections.input);
  };
  
  // 基于 block.position 直接计算连接点位置（用于拖拽中的积木）
  const getConnectionPointFromPosition = (blockId: string, type: 'input' | 'output'): { x: number; y: number } | null => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return null;
    
    // 尝试从 DOM 获取实际尺寸（用于更准确的计算）
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
    let blockWidth = 220;  // 默认宽度
    let blockHeight = 80;   // 默认高度
    
    if (blockElement) {
      const rect = blockElement.getBoundingClientRect();
      const canvas = document.querySelector('.canvas-content') as HTMLElement;
      
      if (canvas) {
        // 获取画布缩放比例
        const transform = canvas.style.transform;
        let scale = 1;
        
        if (transform) {
          const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
          if (scaleMatch) scale = parseFloat(scaleMatch[1]);
        }
        
        // 将屏幕尺寸转换为画布坐标系尺寸
        blockWidth = rect.width / scale;
        blockHeight = rect.height / scale;
      }
    }
    
    if (type === 'input') {
      return {
        x: block.position.x + blockWidth / 2,
        y: block.position.y
      };
    } else {
      return {
        x: block.position.x + blockWidth / 2,
        y: block.position.y + blockHeight
      };
    }
  };

  // 获取连接点的实际位置（SVG坐标系）
  const getConnectionPoint = (blockId: string, type: 'input' | 'output'): { x: number; y: number } | null => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return null;
    
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
    if (!blockElement) return null;
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return null;
    
    const blockRect = blockElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // 获取画布的当前变换（缩放和平移）
    const transform = canvas.style.transform;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    
    if (transform) {
      const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
      const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      
      if (scaleMatch) scale = parseFloat(scaleMatch[1]);
      if (translateMatch) {
        translateX = parseFloat(translateMatch[1]);
        translateY = parseFloat(translateMatch[2]);
      }
    }
    
    // 计算相对于画布的位置（考虑变换）
    const relativeX = (blockRect.left - canvasRect.left - translateX) / scale;
    const relativeY = (blockRect.top - canvasRect.top - translateY) / scale;
    
    if (type === 'input') {
      // 输入点在积木顶部中心
      return {
        x: relativeX + blockRect.width / (2 * scale),
        y: relativeY
      };
    } else {
      // 输出点在积木底部中心
      return {
        x: relativeX + blockRect.width / (2 * scale),
        y: relativeY + blockRect.height / scale
      };
    }
  };
  
  // 绘制连接线
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    // 渲染现有连接
    blocks.forEach(block => {
      if (block.connections.output) {
        const targetBlock = blocks.find(b => b.id === block.connections.output);
        if (!targetBlock) return;
        
        const definition = blockDefinitions.find(d => d.type === block.blockType);
        const color = definition?.color || '#666';
        
        // 获取实际的连接点位置
        const startPoint = getConnectionPoint(block.id, 'output');
        const endPoint = getConnectionPoint(targetBlock.id, 'input');
        
        if (!startPoint || !endPoint) return;
        
        const startX = startPoint.x;
        const startY = startPoint.y;
        const endX = endPoint.x;
        const endY = endPoint.y;
        
        // 计算贝塞尔曲线的控制点
        const controlOffset = Math.abs(endY - startY) * 0.5;
        const cp1X = startX;
        const cp1Y = startY + controlOffset;
        const cp2X = endX;
        const cp2Y = endY - controlOffset;
        
        const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        
        connections.push(
          <path
            key={`${block.id}-${block.connections.output}`}
            d={pathD}
            stroke={color}
            strokeWidth="2"
            fill="none"
            className="connection-line"
          />
        );
      }
    });
    
    // 添加吸附预览提示
    if (nearestSnapTarget && draggingBlockId) {
      const draggingBlock = blocks.find(b => b.id === draggingBlockId);
      const targetBlock = blocks.find(b => b.id === nearestSnapTarget.blockId);
      
      if (draggingBlock && targetBlock) {
        const definition = blockDefinitions.find(d => d.type === draggingBlock.blockType);
        const color = definition?.color || '#4f46e5';
        
        // 根据吸附类型确定连接点
        // 对于拖拽中的积木使用 position 计算，对于静态积木使用 DOM 计算
        let startPoint, endPoint;
        if (nearestSnapTarget.type === 'input') {
          // 拖动积木的输出 -> 目标积木的输入
          startPoint = getConnectionPointFromPosition(draggingBlockId, 'output');
          endPoint = getConnectionPoint(nearestSnapTarget.blockId, 'input');
        } else {
          // 目标积木的输出 -> 拖动积木的输入
          startPoint = getConnectionPoint(nearestSnapTarget.blockId, 'output');
          endPoint = getConnectionPointFromPosition(draggingBlockId, 'input');
        }
        
        if (startPoint && endPoint) {
          const startX = startPoint.x;
          const startY = startPoint.y;
          const endX = endPoint.x;
          const endY = endPoint.y;
          
          const controlOffset = Math.abs(endY - startY) * 0.5;
          const cp1X = startX;
          const cp1Y = startY + controlOffset;
          const cp2X = endX;
          const cp2Y = endY - controlOffset;
          
          const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
          
          connections.push(
            <g key="snap-preview">
              {/* 吸附预览线 */}
              <path
                id="snap-preview-path"
                d={pathD}
                stroke={color}
                strokeWidth="3"
                strokeDasharray="8,4"
                fill="none"
                opacity="0.8"
                className="snap-preview-line"
              />
              {/* 在连接线上滑动的高亮圆圈 */}
              <circle
                r="10"
                fill={color}
                opacity="0.6"
                className="snap-target-highlight"
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={pathD}
                />
              </circle>
              {/* 起点和终点的静态圆圈 */}
              <circle
                cx={startX}
                cy={startY}
                r="6"
                fill={color}
                opacity="0.5"
              />
              <circle
                cx={endX}
                cy={endY}
                r="6"
                fill={color}
                opacity="0.5"
              />
            </g>
          );
        }
      }
    }
    
    // 添加连接预览线
    if (connectingFrom && mousePos) {
      const sourceBlock = blocks.find(b => b.id === connectingFrom.blockId);
      if (sourceBlock) {
        const definition = blockDefinitions.find(d => d.type === sourceBlock.blockType);
        const color = definition?.color || '#4f46e5';
        
        // 获取起点的实际位置
        const startPoint = getConnectionPoint(connectingFrom.blockId, connectingFrom.type);
        if (!startPoint) return connections;
        
        const startX = startPoint.x;
        const startY = startPoint.y;
        const endX = mousePos.x;
        const endY = mousePos.y;
        
        const controlOffset = Math.abs(endY - startY) * 0.5;
        const cp1X = startX;
        const cp1Y = startY + (connectingFrom.type === 'output' ? controlOffset : -controlOffset);
        const cp2X = endX;
        const cp2Y = endY + (connectingFrom.type === 'output' ? -controlOffset : controlOffset);
        
        const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        
        connections.push(
          <g key="preview-connection">
            <path
              d={pathD}
              stroke={color}
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              opacity="0.6"
              className="connection-preview"
            />
            {/* 添加动态高亮圆圈 */}
            <circle r="8" fill={color} opacity="0.6">
              <animateMotion
                dur="1.5s"
                repeatCount="indefinite"
                path={pathD}
                calcMode="linear"
              />
            </circle>
          </g>
        );
      }
    }
    
    return connections;
  };
  
  return (
    <div className="canvas">
      <div className="canvas-header">
        <h2>画布</h2>
        <div className="canvas-info">
          已添加 {blocks.length} 个积木
        </div>
      </div>
      
      <div className="canvas-content" ref={canvasRef} onMouseDown={handleCanvasMouseDown}>
        {blocks.length === 0 ? (
          <div className="canvas-empty">
            <p>从左侧拖拽积木到这里开始创建图表</p>
            <p className="canvas-tip">💡 积木可以通过上下连接点进行组合</p>
          </div>
        ) : (
          <div className="canvas-blocks">
            {/* 积木层 */}
            {blocks.map(block => {
              const definition = blockDefinitions.find(d => d.type === block.blockType);
              return definition ? (
                <div 
                  key={block.id} 
                  data-block-id={block.id}
                  className="block-container"
                  style={{
                    left: `${block.position.x}px`,
                    top: `${block.position.y}px`,
                    zIndex: 1
                  }}
                >
                  <BlockNode
                    block={block}
                    definition={definition}
                    onClick={(e: React.MouseEvent) => handleBlockClick(block.id, e)}
                    onDelete={() => handleBlockDelete(block.id)}
                    onMouseDown={(e: React.MouseEvent) => handleBlockMouseDown(e, block.id)}
                    onConnectionStart={handleConnectionStart}
                    onConnectionEnd={handleConnectionEnd}
                    isDragging={draggingBlockId === block.id}
                    isSelected={selectedBlockIds.includes(block.id)}
                  />
                </div>
              ) : null;
            })}
            
            {/* SVG 层用于绘制连接线, 置于顶层 */}
            <svg className="connection-layer" style={{ zIndex: 10 }}>
              {renderConnections()}
            </svg>

            {/* 绘制选择框 */}
            {isSelecting && selectionStart && selectionEnd && (
              <div
                className="selection-box"
                style={{
                  position: 'absolute',
                  left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
                  top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
                  width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
                  height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
                  border: '2px dashed #4f46e5',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 1000
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

