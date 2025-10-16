import React, { useCallback, useEffect, useLayoutEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { BlockDefinition, BlockInstance } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';
import BlockNode from './BlockNode';
import BlockEditor from './BlockEditor';
import { generateRCode } from '../utils/codeGenerator';
import { connectBlocks, findNearestConnectable, updateChainOrder, findRootBlock } from '../utils/blockConnections';

interface CanvasProps {}

const SNAP_DISTANCE = 50; // 自动吸附距离（像素）
const BLOCK_HEIGHT = 80; // 积木的大致高度，用于计算连接点位置

const Canvas = forwardRef<any, CanvasProps>((props, ref) => {
  const { blocks, addBlock, removeBlock, updateBlock, updateBlocks, setSelectedBlock, setGeneratedCode, selectedBlockIds, setSelectedBlocks, toggleBlockSelection, clearSelection, setSyncSource, editingBlockId, setEditingBlockId } = useBlockStore();
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [nearestSnapTarget, setNearestSnapTarget] = useState<{ blockId: string; type: 'input' | 'output' } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ blockId: string; type: 'input' | 'output' | 'bodyInput' | 'bodyOutput'; isGgplotConnection?: boolean } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const updateThrottle = 16; // 约 60fps
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDraggingStarted, setIsDraggingStarted] = useState(false);
  
  // 框选相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  
  // 连接线渲染状态 - 存储计算好的连接线 JSX 元素
  const [connectionElements, setConnectionElements] = useState<JSX.Element[]>([]);
  
  // 拖拽到插槽的视觉反馈
  const [dropTarget, setDropTarget] = useState<{ containerId: string; slotName: string; insertIndex: number } | null>(null);
  
  // 更新生成的代码
  useEffect(() => {
    const { syncSource } = useBlockStore.getState();
    
    // 如果同步源是代码编辑器，不重新生成代码（避免覆盖用户编辑）
    if (syncSource === 'code') {
      // 重置同步源，为下次更新做准备
      const timer = setTimeout(() => {
        setSyncSource(null);
      }, 100);
      return () => clearTimeout(timer);
    }
    
    // 标记同步源为积木块，防止代码编辑器反向同步
    setSyncSource('blocks');
    const code = generateRCode(blocks);
    setGeneratedCode(code);
    
    // 短暂延迟后重置同步源
    const timer = setTimeout(() => {
      setSyncSource(null);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [blocks, setGeneratedCode, setSyncSource]);
  
  // 在 DOM 更新后重新计算连接线
  useLayoutEffect(() => {
    // 使用 requestAnimationFrame 确保在浏览器下一帧绘制之前执行
    const rafId = requestAnimationFrame(() => {
      const newConnections = renderConnections();
      setConnectionElements(newConnections);
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [blocks, draggingBlockId]); // 当积木或拖拽状态变化时重新计算
  
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
    // 如果刚拖拽过，不处理点击事件
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+点击，切换选中状态
      toggleBlockSelection(blockId);
    } else {
      // 普通点击，只选中当前积木
      setSelectedBlock(blockId);
    }
  }, [setSelectedBlock, toggleBlockSelection, hasDragged]);
  
  // 处理积木双击事件
  const handleBlockDoubleClick = useCallback((blockId: string) => {
    console.log('✅ Canvas收到双击事件，积木ID:', blockId);
    
    // 清除拖拽定时器，防止双击时触发拖拽
    if (dragStartTimeoutRef.current) {
      clearTimeout(dragStartTimeoutRef.current);
      dragStartTimeoutRef.current = null;
    }
    
    // 取消任何正在进行的拖拽
    setDraggingBlockId(null);
    setDragOffset(null);
    setHasDragged(false);
    setIsDraggingStarted(false);
    
    // 打开编辑器
    setEditingBlockId(blockId);
  }, [setEditingBlockId]);

  // 处理按钮组切换
  const handleButtonToggle = useCallback((blockId: string, paramName: string, buttonId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const currentValue = block.params[paramName] || [];
    const isSelected = Array.isArray(currentValue) && currentValue.includes(buttonId);
    
    let newValue;
    if (isSelected) {
      // 取消选择
      newValue = currentValue.filter((id: string) => id !== buttonId);
    } else {
      // 添加选择
      newValue = [...currentValue, buttonId];
    }

    updateBlock(blockId, {
      params: {
        ...block.params,
        [paramName]: newValue
      }
    });
  }, [blocks, updateBlock]);
  
  // 处理拖放到容器插槽
  const handleDropToSlot = useCallback((containerBlockId: string, slotName: string, draggedBlockId: string, insertIndex?: number) => {
    const containerBlock = blocks.find(b => b.id === containerBlockId);
    const draggedBlock = blocks.find(b => b.id === draggedBlockId);
    
    if (!containerBlock || !draggedBlock) return;
    
    // 防止将容器拖入自己
    if (containerBlockId === draggedBlockId) return;
    
    // 断开原有的连接（如果有）
    if (draggedBlock.connections?.input) {
      const inputBlock = blocks.find(b => b.id === draggedBlock.connections.input);
      if (inputBlock) {
        updateBlock(inputBlock.id, {
          connections: { ...inputBlock.connections, output: null }
        });
      }
    }
    if (draggedBlock.connections?.output) {
      const outputBlock = blocks.find(b => b.id === draggedBlock.connections.output);
      if (outputBlock) {
        updateBlock(outputBlock.id, {
          connections: { ...outputBlock.connections, input: null }
        });
      }
    }
    
    // 如果积木之前在其他容器中，从那个容器移除
    if (draggedBlock.parentId) {
      const oldParent = blocks.find(b => b.id === draggedBlock.parentId);
      if (oldParent && oldParent.children && draggedBlock.slotName) {
        const oldSlotChildren = oldParent.children[draggedBlock.slotName] || [];
        updateBlock(oldParent.id, {
          children: {
            ...oldParent.children,
            [draggedBlock.slotName]: oldSlotChildren.filter(id => id !== draggedBlockId)
          }
        });
      }
    }
    
    // 更新拖拽积木的父级信息，清除连接和位置
    updateBlock(draggedBlockId, {
      parentId: containerBlockId,
      slotName: slotName,
      connections: {
        input: null,
        output: null
      },
      position: { x: 0, y: 0 } // 清除位置，因为容器内的积木不需要独立定位
    });
    
    // 更新容器积木的子积木列表
    const currentChildren = containerBlock.children || {};
    const slotChildren = currentChildren[slotName] || [];
    
    // 如果已经在这个插槽中，移除旧位置
    const filteredChildren = slotChildren.filter(id => id !== draggedBlockId);
    
    // 在指定位置插入
    let newChildren: string[];
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= filteredChildren.length) {
      newChildren = [
        ...filteredChildren.slice(0, insertIndex),
        draggedBlockId,
        ...filteredChildren.slice(insertIndex)
      ];
    } else {
      // 默认添加到末尾
      newChildren = [...filteredChildren, draggedBlockId];
    }
    
    updateBlock(containerBlockId, {
      children: {
        ...currentChildren,
        [slotName]: newChildren
      }
    });
  }, [blocks, updateBlock]);
  
  // 开始框选
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // 只有在点击空白区域且不是右键时才开始框选
    if (e.button !== 0) return;
    
    // 检查是否点击在积木、连接线或其他元素上
    const target = e.target as HTMLElement;
    const isClickOnBlock = target.closest('.block-container') || 
                          target.closest('.block-node') || 
                          target.closest('.connection-layer') ||
                          target.closest('.selection-box');
    
    console.log('Canvas mousedown:', { target, isClickOnBlock, className: target.className });
    
    if (isClickOnBlock) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;
    
    console.log('Canvas mousedown - starting selection:', { x, y });
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    setHasDragged(false); // 重置拖拽标记
    
    if (!e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
  }, [clearSelection]);
  
  // 框选移动
  const handleSelectionMove = useCallback((e: MouseEvent) => {
    if (!isSelecting || !selectionStart || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;
    
    // 检查是否有移动（超过5像素才算拖动）
    const deltaX = Math.abs(x - selectionStart.x);
    const deltaY = Math.abs(y - selectionStart.y);
    if (deltaX > 5 || deltaY > 5) {
      setHasDragged(true);
    }
    
    console.log('Selection move:', { x, y, deltaX, deltaY, isSelecting, selectionStart });
    setSelectionEnd({ x, y });
    
    // 只有在真正拖动时才更新选择
    if (deltaX > 5 || deltaY > 5) {
      // 计算选择框范围
      const minX = Math.min(selectionStart.x, x);
      const maxX = Math.max(selectionStart.x, x);
      const minY = Math.min(selectionStart.y, y);
      const maxY = Math.max(selectionStart.y, y);
      
      // 检查哪些积木在选择框内
      const selectedIds: string[] = [];
      blocks.forEach(block => {
        const blockX = block.position.x;
        const blockY = block.position.y;
        
        // 获取积木的实际尺寸
        const blockElement = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
        let blockWidth = 220;
        let blockHeight = 80;
        
        if (blockElement) {
          const blockNode = blockElement.querySelector('.block-node');
          if (blockNode) {
            const blockRect = blockNode.getBoundingClientRect();
            blockWidth = blockRect.width;
            blockHeight = blockRect.height;
          }
        }
        
        const blockRight = blockX + blockWidth;
        const blockBottom = blockY + blockHeight;
        
        // 检查积木是否与选择框相交
        if (blockRight >= minX && blockX <= maxX && blockBottom >= minY && blockY <= maxY) {
          selectedIds.push(block.id);
        }
      });
      
      setSelectedBlocks(selectedIds);
    }
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
    
    // 清除之前的延迟拖拽定时器
    if (dragStartTimeoutRef.current) {
      clearTimeout(dragStartTimeoutRef.current);
    }
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;
    
    // 仅在非 Ctrl 点击且积木不在选中列表中时才清除其他选择
    // Ctrl 点击的处理在 handleBlockClick 中进行
    if (!selectedBlockIds.includes(blockId) && !e.ctrlKey && !e.metaKey) {
      setSelectedBlock(blockId);
    }
    
    // 延迟启动拖拽（避免干扰双击）
    const startDrag = () => {
      setIsDraggingStarted(true);
      
      // 如果积木在容器中（有 parentId），需要将其提升到画布顶层进行拖拽
      if (block.parentId) {
        // 获取积木元素的实际位置（屏幕坐标）
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
        if (blockElement) {
          const blockRect = blockElement.getBoundingClientRect();
          
          // 转换为画布坐标系（考虑滚动）
          const newX = blockRect.left - rect.left + scrollLeft;
          const newY = blockRect.top - rect.top + scrollTop;
          
          // 设置拖拽偏移（基于鼠标相对于积木元素的位置）
          setDragOffset({
            x: e.clientX - blockRect.left,
            y: e.clientY - blockRect.top
          });
          
          // 立即设置拖拽状态
          setDraggingBlockId(blockId);
          setHasDragged(false);
          
          // 然后在下一帧中更新积木位置和从容器中移除
          requestAnimationFrame(() => {
            // 从父容器中移除
            const parentBlock = blocks.find(b => b.id === block.parentId);
            if (parentBlock && parentBlock.children && block.slotName) {
              const slotChildren = parentBlock.children[block.slotName] || [];
              updateBlock(parentBlock.id, {
                children: {
                  ...parentBlock.children,
                  [block.slotName]: slotChildren.filter(id => id !== blockId)
                }
              });
            }
            
            // 更新积木：移除 parentId 和 slotName，设置新的位置
            updateBlock(blockId, {
              parentId: undefined,
              slotName: undefined,
              position: { x: newX, y: newY }
            });
          });
        }
      } else {
        // 普通的顶层积木拖拽
        setDragOffset({
          x: e.clientX - rect.left - block.position.x,
          y: e.clientY - rect.top - block.position.y
        });
        
        setDraggingBlockId(blockId);
        setHasDragged(false);
      }
    };
    
    // 延迟300ms启动拖拽，给双击事件留出更宽松的时间窗口
    dragStartTimeoutRef.current = setTimeout(startDrag, 300);
  }, [blocks, setSelectedBlock, selectedBlockIds, updateBlock]);
  
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
    
    // 标记为已拖拽
    setHasDragged(true);
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    
    const draggingBlock = blocks.find(b => b.id === draggingBlockId);
    if (!draggingBlock) return;
    
    // 检查是否悬停在插槽上
    const targetElement = document.elementFromPoint(e.clientX, e.clientY);
    const slotDropZone = targetElement?.closest('.slot-drop-zone') as HTMLElement;
    
    if (slotDropZone) {
      const slotElement = slotDropZone.closest('.block-slot') as HTMLElement;
      const containerElement = slotElement?.closest('[data-block-id]') as HTMLElement;
      
      if (containerElement) {
        const containerBlockId = containerElement.getAttribute('data-block-id');
        const slotLabel = slotElement?.querySelector('.slot-label')?.textContent;
        
        if (!containerBlockId) return;
        
        const containerBlock = blocks.find(b => b.id === containerBlockId);
        if (containerBlock && containerBlockId !== draggingBlockId) {
          const def = blockDefinitions.find(d => d.type === containerBlock.blockType);
          const slot = def?.slots?.find(s => s.label === slotLabel);
          
          if (slot) {
            // 计算插入位置
            let insertIndex = 0;
            const slotChildren = slotDropZone.querySelector('.slot-children');
            
            if (slotChildren) {
              const childElements = Array.from(slotChildren.children) as HTMLElement[];
              const mouseY = e.clientY;
              
              for (let i = 0; i < childElements.length; i++) {
                const childRect = childElements[i].getBoundingClientRect();
                const childMiddle = childRect.top + childRect.height / 2;
                
                if (mouseY < childMiddle) {
                  insertIndex = i;
                  break;
                }
              }
              
              if (insertIndex === 0 && childElements.length > 0) {
                const firstChildRect = childElements[0].getBoundingClientRect();
                if (mouseY >= firstChildRect.top + firstChildRect.height / 2) {
                  insertIndex = childElements.length;
                }
              } else if (insertIndex === 0) {
                insertIndex = 0;
              }
            }
            
            setDropTarget({ containerId: containerBlockId, slotName: slot.name, insertIndex });
            setNearestSnapTarget(null);
          }
        }
      }
    } else {
      setDropTarget(null);
      // 查找最近的可吸附积木
      const snapTarget = findNearestSnapTarget(draggingBlock, x, y);
      setNearestSnapTarget(snapTarget);
    }
    
    // 计算位移
    const deltaX = x - draggingBlock.position.x;
    const deltaY = y - draggingBlock.position.y;
    
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
  }, [draggingBlockId, dragOffset, blocks, updateBlock, updateBlocks, updateThrottle, selectedBlockIds, blockDefinitions]);
  
  // 结束拖动积木
  const handleMouseUp = useCallback((e: MouseEvent) => {
    // 清除拖拽启动定时器
    if (dragStartTimeoutRef.current) {
      clearTimeout(dragStartTimeoutRef.current);
      dragStartTimeoutRef.current = null;
    }
    
    if (!draggingBlockId) {
      return;
    }
    
    // 检查是否放置到插槽上
    const targetElement = document.elementFromPoint(e.clientX, e.clientY);
    console.log('🎯 Drop target element:', targetElement, targetElement?.className);
    const slotDropZone = targetElement?.closest('.slot-drop-zone') as HTMLElement;
    console.log('📦 Slot drop zone:', slotDropZone);
    
    if (slotDropZone) {
      // 找到对应的容器和插槽
      const slotElement = slotDropZone.closest('.block-slot') as HTMLElement;
      const containerElement = slotElement?.closest('[data-block-id]') as HTMLElement;
      
      console.log('🔍 Found container:', containerElement?.getAttribute('data-block-id'));
      console.log('🔍 Found slot:', slotElement?.querySelector('.slot-label')?.textContent);
      
      if (containerElement) {
        const containerBlockId = containerElement.getAttribute('data-block-id');
        const slotLabel = slotElement?.querySelector('.slot-label')?.textContent;
        
        // 根据 label 找到对应的 slot name
        const containerBlock = blocks.find(b => b.id === containerBlockId);
        if (containerBlock) {
          const def = blockDefinitions.find(d => d.type === containerBlock.blockType);
          const slot = def?.slots?.find(s => s.label === slotLabel);
          
          console.log('✅ Dropping to slot:', slot?.name, 'in container:', containerBlockId);
          
          if (slot && containerBlockId) {
            // 计算插入位置：检查鼠标悬停在哪个子积木上
            let insertIndex: number | undefined = undefined;
            const slotChildren = slotDropZone.querySelector('.slot-children');
            
            if (slotChildren) {
              const childElements = Array.from(slotChildren.children) as HTMLElement[];
              const mouseY = e.clientY;
              
              // 找到应该插入的位置
              for (let i = 0; i < childElements.length; i++) {
                const childRect = childElements[i].getBoundingClientRect();
                const childMiddle = childRect.top + childRect.height / 2;
                
                if (mouseY < childMiddle) {
                  insertIndex = i;
                  break;
                }
              }
              
              // 如果没有找到插入位置，说明应该插入到末尾
              if (insertIndex === undefined) {
                insertIndex = childElements.length;
              }
            }
            
            handleDropToSlot(containerBlockId, slot.name, draggingBlockId, insertIndex);
            
            // 清除拖拽状态
            setDraggingBlockId(null);
            setDragOffset(null);
            setNearestSnapTarget(null);
            setDropTarget(null);
            return; // 早返回，不执行后续的连接逻辑
          }
        }
      }
    }
    
    // 如果没有放置到插槽，检查是否有吸附目标
    if (nearestSnapTarget) {
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
    
    // 清除拖拽状态
    setDraggingBlockId(null);
    setDragOffset(null);
    setNearestSnapTarget(null);
    setDropTarget(null);
  }, [draggingBlockId, nearestSnapTarget, blocks, updateBlocks, handleDropToSlot, blockDefinitions]);
  
  // 保存旧连接，以便在未连接到新目标时恢复
  const [oldConnection, setOldConnection] = useState<{ sourceId: string; targetId: string } | null>(null);
  
  // 开始连接
  const handleConnectionStart = useCallback((blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput', e?: React.MouseEvent) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // 检测是否按住 Shift 键（创建虚线 ggplot 连接）
    const isGgplotConnection = e?.shiftKey || false;
    
    if (isGgplotConnection) {
      // Shift+拖拽：创建 ggplot 虚线连接（不断开任何现有连接）
      console.log('🔗 [Canvas] Shift+拖拽：准备创建 ggplot 虚线连接');
      setConnectingFrom({ blockId, type, isGgplotConnection: true });
      return;
    }
    
    // 普通拖拽：创建实线连接（执行顺序）或虚线引用（bodyInput/bodyOutput）
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
    } else if (type === 'bodyInput' && block.connections.bodyInput) {
      // 从 bodyInput 点拉线，断开旧连接
      updateBlock(blockId, {
        connections: { ...block.connections, bodyInput: null }
      });
    } else if (type === 'bodyOutput' && block.connections.bodyOutput) {
      // 从 bodyOutput 点拉线，断开旧连接
      updateBlock(blockId, {
        connections: { ...block.connections, bodyOutput: null }
      });
    }
    
    setConnectingFrom({ blockId, type, isGgplotConnection: false });
  }, [blocks, updateBlock]);
  
  // 完成连接
  const handleConnectionEnd = useCallback((targetBlockId: string, targetType: 'input' | 'output' | 'bodyInput' | 'bodyOutput') => {
    if (!connectingFrom) return;
    
    const sourceBlock = blocks.find(b => b.id === connectingFrom.blockId);
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    
    if (!sourceBlock || !targetBlock || sourceBlock.id === targetBlock.id) {
      setConnectingFrom(null);
      setOldConnection(null);
      return;
    }
    
    // 🔗 处理 ggplot 虚线连接（Shift+拖拽）
    if (connectingFrom.isGgplotConnection) {
      console.log('✅ [Canvas] 创建 ggplot 虚线连接:', sourceBlock.id, '->', targetBlock.id);
      
      // 更新源积木的 ggplotConnections
      const updatedSourceBlock = {
        ...sourceBlock,
        ggplotConnections: [...(sourceBlock.ggplotConnections || []), targetBlock.id]
      };
      
      updateBlock(sourceBlock.id, updatedSourceBlock);
      setConnectingFrom(null);
      setMousePos(null);
      return;
    }
    
    // 🔵 处理 bodyInput 和 bodyOutput 连接（虚线引用）
    if (connectingFrom.type === 'bodyInput') {
      // bodyInput 指向循环体的第一个积木
      console.log('✅ [Canvas] 连接 bodyInput:', sourceBlock.id, '->', targetBlock.id);
      updateBlock(sourceBlock.id, {
        connections: { ...sourceBlock.connections, bodyInput: targetBlock.id }
      });
      setConnectingFrom(null);
      setOldConnection(null);
      setMousePos(null);
      return;
    }
    
    if (connectingFrom.type === 'bodyOutput') {
      // bodyOutput 指向循环体的最后一个积木
      console.log('✅ [Canvas] 连接 bodyOutput:', sourceBlock.id, '->', targetBlock.id);
      updateBlock(sourceBlock.id, {
        connections: { ...sourceBlock.connections, bodyOutput: targetBlock.id }
      });
      setConnectingFrom(null);
      setOldConnection(null);
      setMousePos(null);
      return;
    }
    
    // 🔴 处理实线连接（执行顺序）
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
  }, [connectingFrom, blocks, updateBlocks, updateBlock]);
  
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
    
    // 如果积木在容器内（有 parentId），从父容器的 children 中移除
    if (blockToDelete.parentId) {
      const parentBlock = blocks.find(b => b.id === blockToDelete.parentId);
      if (parentBlock && parentBlock.children) {
        const updatedChildren = { ...parentBlock.children };
        // 遍历所有插槽
        Object.keys(updatedChildren).forEach(slotName => {
          updatedChildren[slotName] = updatedChildren[slotName].filter(childId => childId !== blockId);
        });
        updateBlock(parentBlock.id, { children: updatedChildren });
      }
    }
    
    // 如果积木本身是容器并且有子积木，将子积木的 parentId 清除（让它们成为独立积木）
    if (blockToDelete.children) {
      Object.values(blockToDelete.children).flat().forEach(childId => {
        const childBlock = blocks.find(b => b.id === childId);
        if (childBlock) {
          updateBlock(childId, { parentId: undefined });
        }
      });
    }
    
    removeBlock(blockId);
    setSelectedBlock(null);
  }, [blocks, removeBlock, setSelectedBlock, updateBlock]);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 键取消选择
      if (e.key === 'Escape') {
        clearSelection();
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
      
      // Ctrl+A 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allBlockIds = blocks.map(b => b.id);
        setSelectedBlocks(allBlockIds);
      }
      
      // Delete 键删除选中的积木
      if (e.key === 'Delete' && selectedBlockIds.length > 0) {
        e.preventDefault();
        selectedBlockIds.forEach(blockId => {
          handleBlockDelete(blockId);
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, blocks, setSelectedBlocks, selectedBlockIds, handleBlockDelete]);
  
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
  const getConnectionPoint = (blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput'): { x: number; y: number } | null => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return null;
    
    // 找到积木的实际 .block-node 元素（更精确的选择）
    // 直接找到所有的 .block-node 元素，通过 data-block-id 过滤
    const allBlockNodes = document.querySelectorAll('.block-node');
    let blockElement: HTMLElement | null = null;
    
    // 遍历所有 .block-node 元素，找到 data-block-id 匹配的那个
    for (let i = 0; i < allBlockNodes.length; i++) {
      const element = allBlockNodes[i] as HTMLElement;
      if (element.getAttribute('data-block-id') === blockId) {
        blockElement = element;
        break;
      }
    }
    
    if (!blockElement) {
      // 检查这个积木是否应该被渲染
      const shouldBeRendered = !block.parentId; // 只有顶层积木会被 Canvas 渲染
      console.warn(`无法找到积木元素: ${blockId}`, {
        blockData: block,
        shouldBeRendered,
        parentId: block.parentId,
        hasOutputConnection: !!block.connections.output,
        totalBlockNodesInDOM: allBlockNodes.length,
        allBlockIdsInDOM: Array.from(allBlockNodes).map(el => (el as HTMLElement).getAttribute('data-block-id')).slice(0, 20) // 只显示前20个避免日志过长
      });
      return null;
    }
    
    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvas) return null;
    
    // 检查元素是否可见（可能被折叠或隐藏）
    const blockRect = blockElement.getBoundingClientRect();
    
    // 如果元素的宽高为 0，可能是被隐藏了
    if (blockRect.width === 0 || blockRect.height === 0) {
      console.warn(`积木元素被隐藏或折叠: ${blockId}`, blockRect);
      // 尝试使用备用方案：从父元素或位置数据估算
      return null;
    }
    
    const canvasRect = canvas.getBoundingClientRect();
    
    // 获取画布的滚动位置
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;
    
    // 计算相对于画布内容区的位置（考虑滚动）
    const relativeX = blockRect.left - canvasRect.left + scrollLeft;
    const relativeY = blockRect.top - canvasRect.top + scrollTop;
    
    if (type === 'input') {
      // 输入点在积木顶部中心
      return {
        x: relativeX + blockRect.width / 2,
        y: relativeY
      };
    } else if (type === 'output') {
      // 输出点在积木底部中心
      return {
        x: relativeX + blockRect.width / 2,
        y: relativeY + blockRect.height
      };
    } else if (type === 'bodyInput') {
      // bodyInput 点在插槽顶部（试图找到实际的连接点元素）
      const bodyInputElement = blockElement.querySelector('.connection-body-input') as HTMLElement;
      if (bodyInputElement) {
        const pointRect = bodyInputElement.getBoundingClientRect();
        return {
          x: pointRect.left - canvasRect.left + scrollLeft + pointRect.width / 2,
          y: pointRect.top - canvasRect.top + scrollTop + pointRect.height / 2
        };
      }
      // 备用方案：估算位置
      return {
        x: relativeX + blockRect.width / 2,
        y: relativeY + 60 // 估算的插槽顶部位置
      };
    } else if (type === 'bodyOutput') {
      // bodyOutput 点在插槽底部
      const bodyOutputElement = blockElement.querySelector('.connection-body-output') as HTMLElement;
      if (bodyOutputElement) {
        const pointRect = bodyOutputElement.getBoundingClientRect();
        return {
          x: pointRect.left - canvasRect.left + scrollLeft + pointRect.width / 2,
          y: pointRect.top - canvasRect.top + scrollTop + pointRect.height / 2
        };
      }
      // 备用方案：估算位置
      return {
        x: relativeX + blockRect.width / 2,
        y: relativeY + blockRect.height - 20 // 估算的插槽底部位置
      };
    }
    
    return null;
  };
  
  // 计算SVG画布所需的最小尺寸
  const calculateCanvasSize = (): { width: number; height: number } => {
    const canvasContent = document.querySelector('.canvas-content') as HTMLElement;
    if (!canvasContent) return { width: 2000, height: 2000 };

    // 获取所有积木元素的边界
    const allBlockNodes = document.querySelectorAll('.block-node');
    let maxX = canvasContent.clientWidth;
    let maxY = canvasContent.clientHeight;

    allBlockNodes.forEach(node => {
      const rect = (node as HTMLElement).getBoundingClientRect();
      const canvasRect = canvasContent.getBoundingClientRect();
      const scrollLeft = canvasContent.scrollLeft;
      const scrollTop = canvasContent.scrollTop;

      const relativeX = rect.left - canvasRect.left + scrollLeft + rect.width;
      const relativeY = rect.top - canvasRect.top + scrollTop + rect.height;

      maxX = Math.max(maxX, relativeX);
      maxY = Math.max(maxY, relativeY);
    });

    // 添加一些额外的空间
    return { 
      width: Math.max(maxX + 200, canvasContent.clientWidth), 
      height: Math.max(maxY + 200, canvasContent.clientHeight) 
    };
  };

  // 绘制连接线
  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    // DEBUG: 检查所有积木的渲染状态
    const topLevelBlocks = blocks.filter(b => !b.parentId);
    const childBlocks = blocks.filter(b => b.parentId);
    const allDOMBlockIds = Array.from(document.querySelectorAll('.block-node'))
      .map(el => (el as HTMLElement).getAttribute('data-block-id'))
      .filter(id => id !== null);

    // 找出应该被渲染但在 DOM 中找不到的积木
    const missingBlocks = topLevelBlocks.filter(b => !allDOMBlockIds.includes(b.id));

    if (missingBlocks.length > 0 || childBlocks.length > 0) {
      console.log('[Canvas] 积木渲染统计:', {
        totalBlocks: blocks.length,
        topLevelBlocks: topLevelBlocks.length,
        topLevelBlockIds: topLevelBlocks.map(b => b.id),
        domBlockCount: allDOMBlockIds.length,
        missingBlocksCount: missingBlocks.length,
        missingBlockIds: missingBlocks.map(b => b.id),
        childBlocks: childBlocks.length,
        childBlockIds: childBlocks.map(b => b.id),
        childBlockParents: childBlocks.map(b => ({ id: b.id, parentId: b.parentId }))
      });
    }
    
    // 渲染实线连接（执行顺序）
    blocks.forEach(block => {
      if (block.connections.output) {
        const targetBlock = blocks.find(b => b.id === block.connections.output);
        if (!targetBlock) {
          console.warn(`连接目标积木不存在: ${block.connections.output}`);
          return;
        }
        
        const definition = blockDefinitions.find(d => d.type === block.blockType);
        const color = definition?.color || '#666';
        
        // 获取实际的连接点位置
        const startPoint = getConnectionPoint(block.id, 'output');
        const endPoint = getConnectionPoint(targetBlock.id, 'input');

        if (!startPoint || !endPoint) {
          console.warn(`无法获取连接点位置:`, {
            sourceBlock: block.id,
            targetBlock: targetBlock.id,
            startPoint,
            endPoint,
            sourceParentId: block.parentId,
            targetParentId: targetBlock.parentId
          });
          return;
        }

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
            key={`solid-${block.id}-${block.connections.output}`}
            d={pathD}
            stroke={color}
            strokeWidth="2"
            fill="none"
            className="connection-line connection-line-solid"
          />
        );
      }
      
      // 🔗 渲染虚线连接（ggplot + 关系）
      if (block.ggplotConnections && block.ggplotConnections.length > 0) {
        console.log(`[虚线渲染] 积木 ${block.id} (${block.blockType}) 有 ${block.ggplotConnections.length} 个虚线连接:`, block.ggplotConnections);
        const definition = blockDefinitions.find(d => d.type === block.blockType);
        const color = definition?.color || '#4f46e5';
        
        block.ggplotConnections.forEach(targetId => {
          const targetBlock = blocks.find(b => b.id === targetId);
          if (!targetBlock) {
            console.warn(`ggplot连接目标积木不存在: ${targetId}`);
            return;
          }
          
          // 获取实际的连接点位置
          const startPoint = getConnectionPoint(block.id, 'output');
          const endPoint = getConnectionPoint(targetBlock.id, 'input');

          console.log(`[虚线] 尝试连接 ${block.id} -> ${targetId}:`, { startPoint, endPoint });

          if (!startPoint || !endPoint) {
            console.warn(`❌ 无法获取ggplot连接点位置:`, {
              sourceBlock: block.id,
              targetBlock: targetBlock.id,
              startPoint,
              endPoint
            });
            return;
          }

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
              key={`dashed-${block.id}-${targetId}`}
              d={pathD}
              stroke={color}
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="none"
              className="connection-line connection-line-dashed"
              opacity="0.8"
            />
          );
        });
      }
      
      // 🔵 渲染 bodyInput 和 bodyOutput 虚线连接（引用关系）
      if (block.connections.bodyInput) {
        const targetBlock = blocks.find(b => b.id === block.connections.bodyInput);
        if (targetBlock) {
          const definition = blockDefinitions.find(d => d.type === block.blockType);
          const color = definition?.color || '#4f46e5';
          
          // 获取连接点位置
          const startPoint = getConnectionPoint(block.id, 'bodyInput');
          const endPoint = getConnectionPoint(targetBlock.id, 'input');
          
          if (startPoint && endPoint) {
            const pathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
            
            connections.push(
              <path
                key={`body-input-${block.id}`}
                d={pathD}
                stroke={color}
                strokeWidth="2"
                strokeDasharray="4,4"
                fill="none"
                className="connection-line connection-line-body-input"
                opacity="0.6"
              />
            );
          }
        }
      }
      
      if (block.connections.bodyOutput) {
        const targetBlock = blocks.find(b => b.id === block.connections.bodyOutput);
        if (targetBlock) {
          const definition = blockDefinitions.find(d => d.type === block.blockType);
          const color = definition?.color || '#4f46e5';
          
          // 获取连接点位置
          const startPoint = getConnectionPoint(targetBlock.id, 'output');
          const endPoint = getConnectionPoint(block.id, 'bodyOutput');
          
          if (startPoint && endPoint) {
            const pathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
            
            connections.push(
              <path
                key={`body-output-${block.id}`}
                d={pathD}
                stroke={color}
                strokeWidth="2"
                strokeDasharray="4,4"
                fill="none"
                className="connection-line connection-line-body-output"
                opacity="0.6"
              />
            );
          }
        }
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
        
        // 🔗 虚线预览（ggplot 连接）或实线预览（执行顺序）
        const isDashed = connectingFrom.isGgplotConnection;
        
        connections.push(
          <g key="preview-connection">
            <path
              d={pathD}
              stroke={color}
              strokeWidth="2"
              strokeDasharray={isDashed ? "8,4" : "5,5"}
              fill="none"
              opacity={isDashed ? "0.7" : "0.6"}
              className={isDashed ? "connection-preview-dashed" : "connection-preview"}
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
            {/* 如果是虚线连接，显示提示文字 */}
            {isDashed && (
              <text
                x={startX}
                y={startY - 15}
                fill={color}
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
              >
                ggplot +
              </text>
            )}
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
          {selectedBlockIds.length > 0 && (
            <span style={{ marginLeft: '1rem', color: '#4f46e5', fontWeight: 600 }}>
              | 已选中 {selectedBlockIds.length} 个
            </span>
          )}
        </div>
      </div>
      
      <div className="canvas-content" ref={canvasRef} onMouseDown={handleCanvasMouseDown}>
        {blocks.length === 0 ? (
          <div className="canvas-empty">
            <p>从左侧拖拽积木到这里开始创建图表</p>
            <p className="canvas-tip">💡 积木可以通过上下连接点进行组合</p>
            <p className="canvas-tip" style={{ marginTop: '0.5rem' }}>
              🖱️ 在空白区域拖动鼠标可以框选多个积木，批量移动
            </p>
          </div>
        ) : (
          <div className="canvas-blocks">
            {/* 积木层 - 只渲染顶层积木（没有父容器的积木）*/}
            {blocks.filter(block => !block.parentId).map(block => {
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
                    onDelete={handleBlockDelete}
                    onMouseDown={(e: React.MouseEvent) => {
                      // 从事件目标中找到最近的带有 data-block-id 的元素
                      const target = (e.target as HTMLElement).closest('[data-block-id]') as HTMLElement;
                      const blockId = target?.getAttribute('data-block-id');
                      if (blockId) {
                        handleBlockMouseDown(e, blockId);
                      }
                    }}
                    onConnectionStart={handleConnectionStart}
                    onConnectionEnd={handleConnectionEnd}
                    onDropToSlot={(slotName, draggedBlockId) => handleDropToSlot(block.id, slotName, draggedBlockId)}
                    isDragging={draggingBlockId === block.id}
                    isSelected={selectedBlockIds.includes(block.id)}
                    dropTarget={dropTarget}
                    onDoubleClick={handleBlockDoubleClick}
                    onButtonToggle={handleButtonToggle}
                  />
                </div>
              ) : null;
            })}
            
            {/* SVG 层用于绘制连接线, 置于顶层 */}
            <svg 
              className="connection-layer" 
              style={{ 
                zIndex: 10,
                width: `${calculateCanvasSize().width}px`,
                height: `${calculateCanvasSize().height}px`,
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            >
              {connectionElements}
            </svg>

            {/* 绘制选择框 - 只在拖拽时显示 */}
            {isSelecting && selectionStart && selectionEnd && (() => {
              const deltaX = Math.abs(selectionEnd.x - selectionStart.x);
              const deltaY = Math.abs(selectionEnd.y - selectionStart.y);
              const shouldShow = deltaX > 5 || deltaY > 5;
              console.log('Render selection box:', { isSelecting, selectionStart, selectionEnd, deltaX, deltaY, shouldShow });
              return shouldShow;
            })() && (
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
      
      {/* 积木编辑器 */}
      {editingBlockId && (
        <BlockEditor
          blockId={editingBlockId}
          onClose={() => setEditingBlockId(null)}
        />
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

