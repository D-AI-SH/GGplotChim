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
  setPlotUrl: (url: string | null) => void;
  clearAll: () => void;
}

export const useBlockStore = create<BlockStore>((set) => ({
  blocks: [],
  currentDataset: null,
  generatedCode: '',
  plotUrl: null,
  selectedBlockId: null,
  selectedBlockIds: [],
  
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
  
  setPlotUrl: (url) => set({ plotUrl: url }),
  
  clearAll: () => set({
    blocks: [],
    currentDataset: null,
    generatedCode: '',
    plotUrl: null,
    selectedBlockId: null,
    selectedBlockIds: []
  })
}));

