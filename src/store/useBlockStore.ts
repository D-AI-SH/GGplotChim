import { create } from 'zustand';
import { BlockInstance, Dataset } from '../types/blocks';

interface BlockStore {
  // 积木实例
  blocks: BlockInstance[];
  
  // 当前数据集
  currentDataset: Dataset | null;
  
  // 生成的 R 代码
  generatedCode: string;
  
  // 图表预览 URL
  plotUrl: string | null;
  
  // 选中的积木
  selectedBlockId: string | null;
  
  // 多选的积木ID列表
  selectedBlockIds: string[];
  
  // R 代码运行状态
  isRunning: boolean;
  runError: string | null;
  isWebRInitialized: boolean;
  
  // 双向同步控制
  syncSource: 'blocks' | 'code' | null; // 当前同步源，防止循环更新
  
  // Actions
  addBlock: (block: BlockInstance) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<BlockInstance>) => void;
  updateBlocks: (blocks: BlockInstance[]) => void;
  updateBlockParams: (blockId: string, params: Record<string, any>) => void;
  setSelectedBlock: (blockId: string | null) => void;
  setSelectedBlocks: (blockIds: string[]) => void;
  toggleBlockSelection: (blockId: string) => void;
  clearSelection: () => void;
  setDataset: (dataset: Dataset | null) => void;
  setGeneratedCode: (code: string) => void;
  updateCodeAndSync: (code: string) => void; // 更新代码并同步到积木
  setSyncSource: (source: 'blocks' | 'code' | null) => void;
  setPlotUrl: (url: string | null) => void;
  setIsRunning: (isRunning: boolean) => void;
  setRunError: (error: string | null) => void;
  setIsWebRInitialized: (initialized: boolean) => void;
  clearAll: () => void;
}

export const useBlockStore = create<BlockStore>((set) => ({
  blocks: [],
  currentDataset: null,
  generatedCode: '',
  plotUrl: null,
  selectedBlockId: null,
  selectedBlockIds: [],
  isRunning: false,
  runError: null,
  isWebRInitialized: false,
  syncSource: null,
  
  addBlock: (block) => set((state) => ({
    blocks: [...state.blocks, block]
  })),
  
  removeBlock: (blockId) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== blockId),
    selectedBlockIds: state.selectedBlockIds.filter(id => id !== blockId)
  })),
  
  updateBlock: (blockId, updates) => set((state) => ({
    blocks: state.blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    )
  })),
  
  updateBlocks: (blocks) => set({ blocks }),
  
  updateBlockParams: (blockId, params) => set((state) => ({
    blocks: state.blocks.map(b =>
      b.id === blockId ? { ...b, params: { ...b.params, ...params } } : b
    )
  })),
  
  setSelectedBlock: (blockId) => set({ 
    selectedBlockId: blockId,
    selectedBlockIds: blockId ? [blockId] : []
  }),
  
  setSelectedBlocks: (blockIds) => set({ 
    selectedBlockIds: blockIds,
    selectedBlockId: blockIds.length === 1 ? blockIds[0] : null
  }),
  
  toggleBlockSelection: (blockId) => set((state) => {
    const isSelected = state.selectedBlockIds.includes(blockId);
    const newSelectedIds = isSelected
      ? state.selectedBlockIds.filter(id => id !== blockId)
      : [...state.selectedBlockIds, blockId];
    return {
      selectedBlockIds: newSelectedIds,
      selectedBlockId: newSelectedIds.length === 1 ? newSelectedIds[0] : null
    };
  }),
  
  clearSelection: () => set({ 
    selectedBlockIds: [],
    selectedBlockId: null
  }),
  
  setDataset: (dataset) => set({ currentDataset: dataset }),
  
  setGeneratedCode: (code) => set({ generatedCode: code }),
  
  updateCodeAndSync: (code) => set((state) => {
    // 防止循环更新：如果当前同步源是积木块，则不执行代码到积木的同步
    if (state.syncSource === 'blocks') {
      return { generatedCode: code, syncSource: null };
    }
    
    // 导入代码解析器
    const { parseRCodeToBlocks } = require('../utils/codeParser');
    
    try {
      // 解析代码为积木块
      const parsedBlocks = parseRCodeToBlocks(code);
      
      // 尝试匹配现有积木，保留位置、ID和连接
      const existingBlocks = state.blocks;
      const mergedBlocks: BlockInstance[] = [];
      const usedExistingIds = new Set<string>();
      
      parsedBlocks.forEach((newBlock: BlockInstance, index: number) => {
        // 查找最佳匹配的现有积木
        let bestMatch: BlockInstance | undefined;
        let bestScore = 0;
        
        existingBlocks.forEach((existing) => {
          if (usedExistingIds.has(existing.id)) return;
          
          let score = 0;
          
          // 类型匹配最重要
          if (existing.blockType === newBlock.blockType) {
            score += 100;
            
            // 参数相似度
            const existingParams = JSON.stringify(existing.params);
            const newParams = JSON.stringify(newBlock.params);
            if (existingParams === newParams) {
              score += 50;
            } else {
              // 部分匹配
              Object.keys(newBlock.params).forEach((key: string) => {
                if (existing.params[key] === newBlock.params[key]) {
                  score += 5;
                }
              });
            }
            
            // 位置相似度（顺序）
            const existingIndex = existingBlocks.indexOf(existing);
            const positionDiff = Math.abs(existingIndex - index);
            score -= positionDiff;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = existing;
          }
        });
        
        if (bestMatch && bestScore >= 100) {
          // 找到匹配的积木 - 保留ID、位置和连接，更新参数
          usedExistingIds.add(bestMatch.id);
          mergedBlocks.push({
            ...bestMatch,
            params: { ...bestMatch.params, ...newBlock.params }
          });
        } else {
          // 没有匹配 - 创建新积木
          mergedBlocks.push(newBlock);
        }
      });
      
      return {
        generatedCode: code,
        blocks: mergedBlocks,
        syncSource: 'code' // 标记同步源为代码
      };
    } catch (error) {
      console.error('代码解析错误:', error);
      // 解析失败时只更新代码，不改变积木
      return { generatedCode: code };
    }
  }),
  
  setSyncSource: (source) => set({ syncSource: source }),
  
  setPlotUrl: (url) => set({ plotUrl: url }),
  
  setIsRunning: (isRunning) => set({ isRunning }),
  
  setRunError: (error) => set({ runError: error }),
  
  setIsWebRInitialized: (initialized) => set({ isWebRInitialized: initialized }),
  
  clearAll: () => set({
    blocks: [],
    currentDataset: null,
    generatedCode: '',
    plotUrl: null,
    selectedBlockId: null,
    selectedBlockIds: [],
    isRunning: false,
    runError: null
  })
}));

