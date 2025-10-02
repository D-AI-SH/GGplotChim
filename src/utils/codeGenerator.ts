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

export function generateRCode(blocks: BlockInstance[]): string {
  if (blocks.length === 0) {
    return '# 请添加积木开始创建图表\n';
  }
  
  const lines: string[] = [
    '# GGplotChim 生成的代码',
    'library(ggplot2)',
    'library(dplyr)',
    ''
  ];
  
  // 按类型分组处理积木
  const dataBlocks = blocks.filter(b => 
    b.blockType === BlockType.DATA_IMPORT || 
    b.blockType.toString().startsWith('DATA_')
  );
  
  const plotBlocks = blocks.filter(b => 
    !dataBlocks.includes(b)
  );
  
  // 生成数据处理代码
  dataBlocks.forEach(block => {
    const def = blockDefinitions.find(d => d.type === block.blockType);
    if (def) {
      const code = renderTemplate(def.rTemplate, block.params);
      lines.push(code);
    }
  });
  
  if (dataBlocks.length > 0) {
    lines.push('');
  }
  
  // 生成绘图代码
  if (plotBlocks.length > 0) {
    lines.push('# 创建图表');
    lines.push('plot <- data %>%');
    
    plotBlocks.forEach((block, index) => {
      const def = blockDefinitions.find(d => d.type === block.blockType);
      if (def) {
        const code = renderTemplate(def.rTemplate, block.params);
        const isLast = index === plotBlocks.length - 1;
        const connector = isLast ? '' : ' +';
        lines.push(`  ${code}${connector}`);
      }
    });
    
    lines.push('');
    lines.push('# 显示图表');
    lines.push('print(plot)');
  }
  
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

