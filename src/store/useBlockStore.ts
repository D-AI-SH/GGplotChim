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
  
  // Actions
  addBlock: (block: BlockInstance) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<BlockInstance>) => void;
  updateBlockParams: (blockId: string, params: Record<string, any>) => void;
  setSelectedBlock: (blockId: string | null) => void;
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
  
  addBlock: (block) => set((state) => ({
    blocks: [...state.blocks, block]
  })),
  
  removeBlock: (blockId) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== blockId)
  })),
  
  updateBlock: (blockId, updates) => set((state) => ({
    blocks: state.blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    )
  })),
  
  updateBlockParams: (blockId, params) => set((state) => ({
    blocks: state.blocks.map(b =>
      b.id === blockId ? { ...b, params: { ...b.params, ...params } } : b
    )
  })),
  
  setSelectedBlock: (blockId) => set({ selectedBlockId: blockId }),
  
  setDataset: (dataset) => set({ currentDataset: dataset }),
  
  setGeneratedCode: (code) => set({ generatedCode: code }),
  
  setPlotUrl: (url) => set({ plotUrl: url }),
  
  clearAll: () => set({
    blocks: [],
    currentDataset: null,
    generatedCode: '',
    plotUrl: null,
    selectedBlockId: null
  })
}));

