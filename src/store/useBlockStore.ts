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
  isWebRReady: boolean; // WebR 是否完全就绪（初始化完成）
  webRInitProgress: string; // WebR 初始化进度描述
  
  // R 包管理
  selectedPackages: string[]; // 用户选择要安装的包
  installedPackages: string[]; // 已安装的包
  isInstallingPackages: boolean; // 是否正在安装包
  
  // 双向同步控制
  syncSource: 'blocks' | 'code' | null; // 当前同步源，防止循环更新
  
  // 开发者模式
  isDeveloperMode: boolean; // 是否启用开发者模式
  
  // 代码规范化
  enableCodeNormalization: boolean; // 是否启用代码规范化（默认 true）
  
  // 图片导出设置
  plotWidth: number; // 图片宽度（英寸）
  plotHeight: number; // 图片高度（英寸）
  plotDPI: number; // 图片 DPI
  
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
  updateCodeAndSync: (code: string) => Promise<void>; // 更新代码并同步到积木
  setSyncSource: (source: 'blocks' | 'code' | null) => void;
  setPlotUrl: (url: string | null) => void;
  setIsRunning: (isRunning: boolean) => void;
  setRunError: (error: string | null) => void;
  setIsWebRInitialized: (initialized: boolean) => void;
  setIsWebRReady: (ready: boolean) => void;
  setWebRInitProgress: (progress: string) => void;
  setIsDeveloperMode: (enabled: boolean) => void;
  setEnableCodeNormalization: (enabled: boolean) => void;
  setPlotSettings: (width: number, height: number, dpi: number) => void;
  setSelectedPackages: (packages: string[]) => void;
  setInstalledPackages: (packages: string[]) => void;
  setIsInstallingPackages: (isInstalling: boolean) => void;
  clearAll: () => void;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  blocks: [],
  currentDataset: null,
  generatedCode: '',
  plotUrl: null,
  selectedBlockId: null,
  selectedBlockIds: [],
  isRunning: false,
  runError: null,
  isWebRInitialized: false,
  isWebRReady: false,
  webRInitProgress: '准备初始化...',
  syncSource: null,
  isDeveloperMode: false,
  enableCodeNormalization: true, // 默认启用代码规范化
  plotWidth: 20, // 默认 20 英寸
  plotHeight: 20, // 默认 20 英寸
  plotDPI: 720, // 默认 720 DPI
  selectedPackages: ['ggplot2'], // 默认选择 ggplot2
  installedPackages: [],
  isInstallingPackages: false,
  
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
  
  updateCodeAndSync: async (code) => {
    console.log('\n🔄 [Store] updateCodeAndSync 被调用');
    console.log('📝 [Store] 用户编辑的代码长度:', code.length);
    console.log('📝 [Store] 用户编辑的代码前200字符:', code.substring(0, 200));
    
    // 保存原始代码，以便在禁用规范化时使用
    const originalCode = code;
    
    // 防止循环更新：如果当前同步源是积木块，则不执行代码到积木的同步
    const currentState = get();
    console.log('🔍 [Store] 当前同步源:', currentState.syncSource);
    console.log('🔍 [Store] 当前积木数量:', currentState.blocks.length);
    
    if (currentState.syncSource === 'blocks') {
      console.log('⏭️ [Store] 同步源是积木，跳过代码到积木的同步');
      set({ syncSource: null });
      return;
    }
    
    // 完全使用AST解析器解析代码（异步）
    const { parseRCodeToBlocksWithAST } = require('../utils/astCodeParser');
    const { webRRunner } = require('../core/rRunner/webRRunner');
    
    if (!webRRunner.isReady()) {
      console.warn('⚠️ [Store] WebR 尚未就绪，无法解析代码到积木');
      return;
    }
    
    const webR = webRRunner.getWebR();
    if (!webR) {
      console.warn('⚠️ [Store] 无法获取 WebR 实例');
      return;
    }
    
    console.log('🚀 [Store] 开始异步解析代码...');
    
    // 使用AST解析器异步解析代码
    try {
      const parsedBlocks: BlockInstance[] = await parseRCodeToBlocksWithAST(code, webR);
      console.log('\n✅ [Store] AST解析器返回结果，共', parsedBlocks.length, '个积木块');
      console.log('📊 [Store] 解析的积木块:', parsedBlocks.map(b => ({
        type: b.blockType,
        params: b.params
      })));
      
      // 获取当前状态
      const state = get();
      
      // 再次检查同步源，防止在异步期间用户已经修改了积木
      if (state.syncSource === 'blocks') {
        console.log('⏭️ [Store] 跳过更新：用户在异步期间已修改积木');
        return;
      }
      
      console.log('🔀 [Store] 开始合并积木...');
      
      // 尝试匹配现有积木，保留位置、ID和连接
      const existingBlocks = state.blocks;
      console.log('📦 [Store] 现有积木数量:', existingBlocks.length);
      
      const mergedBlocks: BlockInstance[] = [];
      const usedExistingIds = new Set<string>();
      
      // 第一步：匹配积木并建立 ID 映射
      const idMapping = new Map<string, string>(); // newId -> existingId
      
      parsedBlocks.forEach((newBlock: BlockInstance, index: number) => {
        // 查找最佳匹配的现有积木
        let bestMatch: BlockInstance | undefined;
        let bestScore = 0;
        
        existingBlocks.forEach((existing: BlockInstance) => {
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
          // 找到匹配的积木 - 记录 ID 映射
          console.log(`  ✅ [Store] 积木 ${index} 找到匹配:`, bestMatch.id, '分数:', bestScore);
          usedExistingIds.add(bestMatch.id);
          idMapping.set(newBlock.id, bestMatch.id);
          mergedBlocks.push({
            ...bestMatch,
            params: { ...bestMatch.params, ...newBlock.params }
          });
        } else {
          // 没有匹配 - 创建新积木（保持新ID）
          console.log(`  🆕 [Store] 积木 ${index} 无匹配，创建新积木:`, newBlock.blockType);
          mergedBlocks.push(newBlock);
        }
      });
      
      // 第二步：更新所有积木的连接，将临时 ID 映射到实际 ID
      console.log('🔗 [Store] 更新连接中的 ID 映射...');
      mergedBlocks.forEach((block, index) => {
        const parsedBlock = parsedBlocks[index];
        if (!parsedBlock) return;
        
        const updatedConnections = { ...parsedBlock.connections };
        
        // 映射 input 连接
        if (updatedConnections.input) {
          const mappedId = idMapping.get(updatedConnections.input);
          if (mappedId) {
            console.log(`    🔄 [Store] 映射 input: ${updatedConnections.input} -> ${mappedId}`);
            updatedConnections.input = mappedId;
          }
        }
        
        // 映射 output 连接
        if (updatedConnections.output) {
          const mappedId = idMapping.get(updatedConnections.output);
          if (mappedId) {
            console.log(`    🔄 [Store] 映射 output: ${updatedConnections.output} -> ${mappedId}`);
            updatedConnections.output = mappedId;
          }
        }
        
        // 映射 ggplotConnections 数组
        if (parsedBlock.ggplotConnections && parsedBlock.ggplotConnections.length > 0) {
          const updatedGgplotConnections = parsedBlock.ggplotConnections.map(connectionId => {
            const mappedId = idMapping.get(connectionId);
            if (mappedId) {
              console.log(`    🔄 [Store] 映射 ggplotConnections: ${connectionId} -> ${mappedId}`);
              return mappedId;
            }
            return connectionId;
          });
          block.ggplotConnections = updatedGgplotConnections;
        }
        
        // 更新积木的连接
        block.connections = updatedConnections;
      });
      
      console.log('🎯 [Store] 合并完成，最终积木数量:', mergedBlocks.length);
      
      // 检查是否启用代码规范化
      const currentState = get();
      const shouldNormalize = currentState.enableCodeNormalization;
      console.log('🔧 [Store] 代码规范化开关:', shouldNormalize ? '✅ 已启用' : '❌ 已禁用');
      
      if (shouldNormalize) {
        // 从积木块重新生成规范化的代码
        const { generateRCode } = require('../utils/codeGenerator');
        const regeneratedCode = generateRCode(mergedBlocks);
        console.log('🎨 [Store] 从积木块重新生成规范化代码');
        console.log('📝 [Store] 重新生成的代码长度:', regeneratedCode.length);
        console.log('📝 [Store] 重新生成的代码前200字符:', regeneratedCode.substring(0, 200));
        
        // 更新积木块和规范化后的代码
        set({
          blocks: mergedBlocks,
          generatedCode: regeneratedCode,
          syncSource: 'code'
        });
        
        console.log('✅ [Store] 积木块和规范化代码已更新到store\n');
      } else {
        // 不规范化，保持用户编辑的代码
        console.log('⏭️ [Store] 跳过代码规范化，保持用户编辑的代码');
        
        // 更新积木块，并保持用户的原始代码
        set({
          blocks: mergedBlocks,
          generatedCode: originalCode,
          syncSource: 'code'
        });
        
        console.log('✅ [Store] 积木块已更新到store（保持原代码）\n');
      }
    } catch (error: unknown) {
      console.error('❌ [Store] AST解析失败:', error);
      console.error('❌ [Store] 错误详情:', error instanceof Error ? error.message : String(error));
      // 解析失败时不更新积木，保持现有状态
    }
  },
  
  setSyncSource: (source) => set({ syncSource: source }),
  
  setPlotUrl: (url) => set({ plotUrl: url }),
  
  setIsRunning: (isRunning) => set({ isRunning }),
  
  setRunError: (error) => set({ runError: error }),
  
  setIsWebRInitialized: (initialized) => set({ isWebRInitialized: initialized }),
  
  setIsWebRReady: (ready) => set({ isWebRReady: ready }),
  
  setWebRInitProgress: (progress) => set({ webRInitProgress: progress }),
  
  setIsDeveloperMode: (enabled) => set({ isDeveloperMode: enabled }),
  
  setEnableCodeNormalization: (enabled) => set({ enableCodeNormalization: enabled }),
  
  setPlotSettings: (width, height, dpi) => set({ 
    plotWidth: width, 
    plotHeight: height, 
    plotDPI: dpi 
  }),
  
  setSelectedPackages: (packages) => set({ selectedPackages: packages }),
  
  setInstalledPackages: (packages) => set({ installedPackages: packages }),
  
  setIsInstallingPackages: (isInstalling) => set({ isInstallingPackages: isInstalling }),
  
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

