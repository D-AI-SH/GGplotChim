import { BlockInstance, BlockType } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';

// 简单的模板引擎
function renderTemplate(template: string, params: Record<string, any>): string {
  let result = template;
  
  // 替换简单变量 {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : '';
  });
  
  // 处理条件语句 {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/g, (match, key, content) => {
    return params[key] ? content : '';
  });
  
  return result;
}

/**
 * 获取所有独立的积木链
 */
function getAllChains(blocks: BlockInstance[]): BlockInstance[][] {
  const chains: BlockInstance[][] = [];
  const visited = new Set<string>();
  
  // 找到所有起始积木（没有输入连接的积木）
  const startBlocks = blocks.filter(b => b.connections.input === null);
  
  // 为每个起始积木构建链
  startBlocks.forEach(startBlock => {
    if (visited.has(startBlock.id)) return;
    
    const chain: BlockInstance[] = [];
    let current: BlockInstance | undefined = startBlock;
    
    while (current) {
      chain.push(current);
      visited.add(current.id);
      
      // 获取第一个输出连接
      const nextId: string | undefined = current.connections.outputs[0];
      current = nextId ? blocks.find(b => b.id === nextId) : undefined;
    }
    
    if (chain.length > 0) {
      chains.push(chain);
    }
  });
  
  return chains;
}

/**
 * 按照连接顺序生成 ggplot2 代码
 */
export function generateRCode(blocks: BlockInstance[]): string {
  if (blocks.length === 0) {
    return '# 请添加积木开始创建图表\n# 提示：从左侧拖拽积木到画布，积木会自动连接';
  }
  
  const lines: string[] = [
    '# GGplotChim 生成的代码',
    '# 基于 ggplot2 的图层语法',
    'library(ggplot2)',
    ''
  ];
  
  // 获取所有积木链
  const chains = getAllChains(blocks);
  
  if (chains.length === 0) {
    lines.push('# 没有找到完整的积木链');
    lines.push('# 请确保积木已正确连接');
    return lines.join('\n');
  }
  
  // 为每个链生成代码
  chains.forEach((chain, chainIndex) => {
    if (chainIndex > 0) {
      lines.push('');
      lines.push('# -------------------');
      lines.push('');
    }
    
    lines.push(`# 图层链 ${chainIndex + 1}`);
    
    // 按顺序生成每个积木的代码
    const chainCode: string[] = [];
    
    chain.forEach((block, index) => {
      const def = blockDefinitions.find(d => d.type === block.blockType);
      if (!def) return;
      
      const code = renderTemplate(def.rTemplate, block.params);
      
      if (index === 0) {
        // 第一个积木（通常是 ggplot() 或数据赋值）
        chainCode.push(code);
      } else {
        // 后续积木，使用 + 连接
        chainCode.push(`  ${code}`);
      }
    });
    
    // 组合代码，使用 + 运算符
    if (chainCode.length > 0) {
      lines.push(chainCode[0]);
      
      for (let i = 1; i < chainCode.length; i++) {
        const isLast = i === chainCode.length - 1;
        lines.push(`  +${chainCode[i]}${isLast ? '' : ''}`);
      }
    }
  });
  
  lines.push('');
  lines.push('# 运行上述代码即可显示图表');
  
  return lines.join('\n');
}

// 验证代码是否有效
export function validateBlocks(blocks: BlockInstance[]): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  // 检查是否有数据源
  const hasDataSource = blocks.some(b => b.blockType === BlockType.DATA_IMPORT);
  if (!hasDataSource && blocks.length > 0) {
    errors.push('缺少数据源，请添加"导入数据"积木');
  }
  
  // 检查是否有 ggplot 初始化
  const hasGgplotInit = blocks.some(b => b.blockType === BlockType.GGPLOT_INIT);
  const hasGeom = blocks.some(b => 
    b.blockType.toString().startsWith('GEOM_')
  );
  
  if (hasGeom && !hasGgplotInit) {
    errors.push('需要先添加"创建画布"积木');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

