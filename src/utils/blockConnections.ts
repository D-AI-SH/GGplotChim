import { BlockInstance } from '../types/blocks';

/**
 * 连接两个积木
 * @param sourceBlock 源积木（上游）
 * @param targetBlock 目标积木（下游）
 */
export const connectBlocks = (
  sourceBlock: BlockInstance,
  targetBlock: BlockInstance
): { source: BlockInstance; target: BlockInstance } => {
  // 更新源积木的输出连接
  const updatedSource: BlockInstance = {
    ...sourceBlock,
    connections: {
      ...sourceBlock.connections,
      outputs: [...sourceBlock.connections.outputs, targetBlock.id]
    }
  };

  // 更新目标积木的输入连接和顺序
  const updatedTarget: BlockInstance = {
    ...targetBlock,
    connections: {
      ...targetBlock.connections,
      input: sourceBlock.id
    },
    order: sourceBlock.order + 1
  };

  return { source: updatedSource, target: updatedTarget };
};

/**
 * 断开两个积木的连接
 * @param sourceBlock 源积木
 * @param targetBlock 目标积木
 */
export const disconnectBlocks = (
  sourceBlock: BlockInstance,
  targetBlock: BlockInstance
): { source: BlockInstance; target: BlockInstance } => {
  // 从源积木的输出列表中移除目标积木
  const updatedSource: BlockInstance = {
    ...sourceBlock,
    connections: {
      ...sourceBlock.connections,
      outputs: sourceBlock.connections.outputs.filter(id => id !== targetBlock.id)
    }
  };

  // 清除目标积木的输入连接，并重置顺序
  const updatedTarget: BlockInstance = {
    ...targetBlock,
    connections: {
      ...targetBlock.connections,
      input: null
    },
    order: 0
  };

  return { source: updatedSource, target: updatedTarget };
};

/**
 * 获取积木链（按顺序排列）
 * @param blocks 所有积木
 * @param startBlockId 起始积木 ID
 */
export const getBlockChain = (
  blocks: BlockInstance[],
  startBlockId: string
): BlockInstance[] => {
  const chain: BlockInstance[] = [];
  const blockMap = new Map(blocks.map(b => [b.id, b]));
  
  let currentBlock = blockMap.get(startBlockId);
  
  while (currentBlock) {
    chain.push(currentBlock);
    
    // 获取第一个输出连接（假设每个积木只有一个主输出）
    const nextBlockId = currentBlock.connections.outputs[0];
    currentBlock = nextBlockId ? blockMap.get(nextBlockId) : undefined;
  }
  
  return chain;
};

/**
 * 获取所有独立的积木链
 * @param blocks 所有积木
 */
export const getAllChains = (blocks: BlockInstance[]): BlockInstance[][] => {
  // 找到所有起始积木（没有输入连接的积木）
  const startBlocks = blocks.filter(b => b.connections.input === null);
  
  // 为每个起始积木构建链
  return startBlocks.map(startBlock => getBlockChain(blocks, startBlock.id));
};

/**
 * 更新整个链的顺序
 * @param blocks 所有积木
 * @param startBlockId 起始积木 ID
 */
export const updateChainOrder = (
  blocks: BlockInstance[],
  startBlockId: string
): BlockInstance[] => {
  const blockMap = new Map(blocks.map(b => [b.id, b]));
  const updatedBlocks = [...blocks];
  
  let currentBlock = blockMap.get(startBlockId);
  let order = 0;
  
  while (currentBlock) {
    const index = updatedBlocks.findIndex(b => b.id === currentBlock!.id);
    if (index !== -1) {
      updatedBlocks[index] = {
        ...updatedBlocks[index],
        order
      };
    }
    
    order++;
    const nextBlockId = currentBlock.connections.outputs[0];
    currentBlock = nextBlockId ? blockMap.get(nextBlockId) : undefined;
  }
  
  return updatedBlocks;
};

/**
 * 检查两个积木是否可以连接
 * @param sourceBlock 源积木
 * @param targetBlock 目标积木
 */
export const canConnect = (
  sourceBlock: BlockInstance,
  targetBlock: BlockInstance
): boolean => {
  // 不能连接自己
  if (sourceBlock.id === targetBlock.id) return false;
  
  // 目标积木不能已经有输入连接
  if (targetBlock.connections.input !== null) return false;
  
  // 不能形成环路（检查目标是否是源的上游）
  if (isUpstream(targetBlock, sourceBlock)) return false;
  
  return true;
};

/**
 * 检查一个积木是否是另一个积木的上游
 * @param potentialUpstream 可能的上游积木
 * @param block 当前积木
 */
const isUpstream = (
  potentialUpstream: BlockInstance,
  block: BlockInstance
): boolean => {
  // 通过遍历输出链检查是否会形成环路
  const visited = new Set<string>();
  const queue = [potentialUpstream];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    
    if (current.id === block.id) return true;
    
    // 这里需要完整的积木列表，暂时简化处理
    // 实际使用时需要传入完整的 blocks 列表
  }
  
  return false;
};

/**
 * 计算两个积木之间的距离
 * @param block1 积木1
 * @param block2 积木2
 */
export const getBlockDistance = (
  block1: BlockInstance,
  block2: BlockInstance
): number => {
  const dx = block1.position.x - block2.position.x;
  const dy = block1.position.y - block2.position.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 查找最近的可连接积木
 * @param targetBlock 目标积木
 * @param allBlocks 所有积木
 * @param maxDistance 最大距离阈值
 */
export const findNearestConnectable = (
  targetBlock: BlockInstance,
  allBlocks: BlockInstance[],
  maxDistance: number = 100
): BlockInstance | null => {
  let nearest: BlockInstance | null = null;
  let minDistance = maxDistance;
  
  for (const block of allBlocks) {
    if (!canConnect(block, targetBlock)) continue;
    
    const distance = getBlockDistance(block, targetBlock);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = block;
    }
  }
  
  return nearest;
};

