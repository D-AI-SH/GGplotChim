import { BlockInstance, BlockType } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';

// 简单的模板引擎
function renderTemplate(template: string, params: Record<string, any>, childrenCode?: Record<string, string[]>): string {
  console.log('🔧 Template before processing:', JSON.stringify(template));
  let result = template;
  
  // 处理子积木循环 {{#each children.slotName}}...{{/each}}
  // 注意：必须在替换简单变量之前处理，否则 {{this}} 会被误替换
  result = result.replace(/\{\{#each\s+children\.(\w+)\}\}(.*?)\{\{\/each\}\}/gs, (match, slotName, itemTemplate) => {
    if (childrenCode && childrenCode[slotName]) {
      console.log('Processing slot:', slotName, 'with codes:', childrenCode[slotName]);
      console.log('Item template:', JSON.stringify(itemTemplate));
      const generated = childrenCode[slotName]
        .map(code => {
          // 为子代码的每一行添加缩进（跳过空行）
          const indentedCode = code.split('\n').map(line => line.trim() ? '  ' + line : line).join('\n');
          const replaced = itemTemplate.replace(/\{\{this\}\}/g, indentedCode);
          console.log('Generated line:', JSON.stringify(replaced));
          return replaced;
        })
        .join('\n');
      console.log('Final generated:', JSON.stringify(generated));
      return generated;
    }
    console.log('No children code for slot:', slotName);
    return '';
  });
  
  // ⚠️ 重要：必须先处理条件语句，再处理变量替换
  // 否则条件语句中的变量会被提前替换，导致条件判断失效
  
  // 🔧 处理嵌套条件语句的辅助函数（递归处理，从内向外）
  const processConditionals = (text: string, depth: number = 0): string => {
    const indent = '  '.repeat(depth);
    let hasNestedIf = false;
    
    // 检查是否还有嵌套的 {{#if}}
    const nestedIfCount = (text.match(/\{\{#if/g) || []).length;
    if (nestedIfCount > 0) {
      console.log(`${indent}🔍 [renderTemplate] 深度 ${depth}: 发现 ${nestedIfCount} 个条件语句`);
      hasNestedIf = true;
    }
    
    // 使用非贪婪匹配，找到最内层的 {{#if}}...{{/if}}
    const processed = text.replace(/\{\{#if\s+([\w.]+)\}\}((?:(?!\{\{#if)(?!\{\{\/if\}\}).)*)\{\{\/if\}\}/gs, (match, keyPath, content) => {
      console.log(`${indent}🔍 [renderTemplate] 深度 ${depth}: 处理条件 {{#if ${keyPath}}}`);
      console.log(`${indent}🔍 [renderTemplate] 条件内容: ${JSON.stringify(content)}`);
      
      // 支持嵌套属性访问（如 children.else.length）
      let value: any;
      if (keyPath.includes('.')) {
        const keys = keyPath.split('.');
        value = keys.reduce((obj: any, key: string) => obj?.[key], { ...params, children: childrenCode });
      } else {
        value = params[keyPath];
      }
      
      console.log(`${indent}🔍 [renderTemplate] 条件值: ${JSON.stringify(value)}`);
      
      // 对于数组类型，检查是否有非空元素
      let shouldInclude: boolean;
      if (Array.isArray(value)) {
        const nonEmptyElements = value.filter(v => v !== '' && v !== null && v !== undefined);
        shouldInclude = nonEmptyElements.length > 0;
        console.log(`${indent}🔍 [renderTemplate] 数组条件：原始长度=${value.length}, 非空元素=${nonEmptyElements.length}`);
      } else if (typeof value === 'number') {
        // 对于数字类型（如 length），判断是否 > 0
        shouldInclude = value > 0;
        console.log(`${indent}🔍 [renderTemplate] 数字条件：值=${value}, 结果=${shouldInclude}`);
      } else {
        shouldInclude = value !== undefined && value !== null && value !== '' && value !== false;
      }
      
      const result = shouldInclude ? content : '';
      console.log(`${indent}🔍 [renderTemplate] 条件结果 (${shouldInclude ? '真' : '假'}): ${JSON.stringify(result)}`);
      return result;
    });
    
    // 如果还有嵌套的条件语句，继续递归处理
    if (hasNestedIf && processed !== text) {
      console.log(`${indent}🔁 [renderTemplate] 深度 ${depth}: 递归处理更外层的条件`);
      return processConditionals(processed, depth + 1);
    }
    
    return processed;
  };
  
  // 递归处理所有条件语句（从内向外）
  result = processConditionals(result);
  
  // 替换简单变量 {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key] !== undefined ? String(params[key]) : '';
    console.log(`🔧 [renderTemplate] 替换变量 {{${key}}} -> ${value}`);
    return value;
  });
  
  console.log('✅ [renderTemplate] 处理完成:', result);
  
  return result;
}

/**
 * 获取所有独立的积木链（按执行顺序，input/output）
 */
function getAllChains(blocks: BlockInstance[]): BlockInstance[][] {
  const chains: BlockInstance[][] = [];
  const visited = new Set<string>();
  
  // 找到所有起始积木（没有输入连接且没有父积木的积木）
  const startBlocks = blocks.filter(b => 
    b.connections.input === null && !b.parentId
  );
  
  // 为每个起始积木构建链
  startBlocks.forEach(startBlock => {
    if (visited.has(startBlock.id)) return;
    
    const chain: BlockInstance[] = [];
    let current: BlockInstance | undefined = startBlock;
    
    while (current) {
      chain.push(current);
      visited.add(current.id);
      
      // 获取输出连接（现在只有一个输出）
      const nextId: string | null = current.connections.output;
      current = nextId ? blocks.find(b => b.id === nextId) : undefined;
    }
    
    if (chain.length > 0) {
      chains.push(chain);
    }
  });
  
  return chains;
}

/**
 * 获取所有 ggplot 链（虚线连接，使用 + 操作符）
 */
function getGgplotChains(blocks: BlockInstance[]): BlockInstance[][] {
  const chains: BlockInstance[][] = [];
  const visited = new Set<string>();
  
  // 找到所有 ggplot 链的起始积木（通常是 ggplot() 初始化）
  const startBlocks = blocks.filter(b => 
    b.ggplotConnections && b.ggplotConnections.length > 0 && !b.parentId
  );
  
  startBlocks.forEach(startBlock => {
    if (visited.has(startBlock.id)) return;
    
    const chain: BlockInstance[] = [startBlock];
    visited.add(startBlock.id);
    
    // 递归收集所有通过 ggplotConnections 连接的积木
    const collectGgplotConnections = (block: BlockInstance) => {
      if (block.ggplotConnections) {
        block.ggplotConnections.forEach(connId => {
          const connectedBlock = blocks.find(b => b.id === connId);
          if (connectedBlock && !visited.has(connectedBlock.id)) {
            chain.push(connectedBlock);
            visited.add(connectedBlock.id);
            collectGgplotConnections(connectedBlock);
          }
        });
      }
    };
    
    collectGgplotConnections(startBlock);
    
    if (chain.length > 1) {
      chains.push(chain);
    }
  });
  
  return chains;
}

/**
 * 按照连接顺序生成 ggplot2 代码
 * 
 * 核心逻辑：
 * 1. 实线连接（connections.output/input）= 执行顺序，代码逐行生成
 * 2. 虚线连接（ggplotConnections）= ggplot 的 + 逻辑，用 + 连接
 * 3. 只生成从"开始积木"连接的代码链
 */
export function generateRCode(blocks: BlockInstance[]): string {
  if (blocks.length === 0) {
    return '# 请添加积木开始创建图表\n# 提示：从左侧拖拽积木到画布，积木会自动连接';
  }
  
  const lines: string[] = [
    '# GGplotChim 生成的代码',
    '# 基于 ggplot2 的图层语法',
    ''
  ];
  
  // 递归生成积木代码（支持嵌套）
  const generateBlockCode = (block: BlockInstance): string => {
    const def = blockDefinitions.find(d => d.type === block.blockType);
    if (!def) return '';
    
    // 🚀 特殊处理：START 积木不生成任何代码
    if (block.blockType === BlockType.START) {
      return '';
    }
    
    // 如果是容器型积木，先生成子积木代码
    let childrenCode: Record<string, string[]> | undefined;
    if (def.isContainer && block.children) {
      childrenCode = {};
      Object.keys(block.children).forEach(slotName => {
        const childIds = block.children![slotName] || [];
        childrenCode![slotName] = childIds
          .map(childId => blocks.find(b => b.id === childId))
          .filter(Boolean)
          .map(childBlock => generateBlockCode(childBlock as BlockInstance));
      });
    }
    
    return renderTemplate(def.rTemplate, block.params, childrenCode);
  };
  
  // 🎯 核心改进：按实线连接（执行顺序）遍历，遇到有虚线连接的积木时展开 ggplot 链
  const visited = new Set<string>();
  
  // 🚀 查找开始积木（START）
  const startBlock = blocks.find(b => b.blockType === BlockType.START);
  
  if (!startBlock) {
    console.log('⚠️ [CodeGen] 未找到开始积木，不生成代码');
    lines.push('# ⚠️ 请添加"开始积木"作为程序入口');
    lines.push('# 只有连接到开始积木的积木才会生成代码');
    lines.push('');
    return lines.join('\n');
  }
  
  console.log('🚀 [CodeGen] 找到开始积木:', startBlock.id);
  
  // 从开始积木开始，只处理连接到它的链
  const startBlocks = [startBlock];
  
  console.log('📋 [CodeGen] 找到起始积木:', startBlocks.map(b => ({ id: b.id, type: b.blockType })));
  
  // 按执行顺序遍历每个链
  startBlocks.forEach((startBlock, chainIndex) => {
    if (visited.has(startBlock.id)) return;
    
    if (chainIndex > 0) {
      lines.push(''); // 链之间空行
    }
    
    let current: BlockInstance | undefined = startBlock;
    
    while (current) {
      if (visited.has(current.id)) {
        console.warn('⚠️ [CodeGen] 检测到循环引用，跳过积木:', current.id);
        break;
      }
      
      visited.add(current.id);
      
      // 跳过已经被嵌入到容器中的积木
      if (current.parentId) {
        console.log('⏭️ [CodeGen] 跳过容器内积木:', current.id);
        const nextId: string | null = current.connections.output;
        current = nextId ? blocks.find(b => b.id === nextId) : undefined;
        continue;
      }
      
      // 🔗 检查是否有虚线连接（ggplot 链）
      if (current.ggplotConnections && current.ggplotConnections.length > 0) {
        console.log('⛓️ [CodeGen] 积木有虚线连接，展开 ggplot 链:', current.id, current.ggplotConnections);
        
        // 生成 ggplot 链（第一个积木 + 所有虚线连接的积木）
        const chainCode: string[] = [];
        
        // 第一个积木（通常是 ggplot()）
        const firstCode = generateBlockCode(current);
        chainCode.push(firstCode);
        
        // 递归收集所有虚线连接的积木
        const collectGgplotLayers = (blockId: string) => {
          const block = blocks.find(b => b.id === blockId);
          if (!block) return;
          
          visited.add(block.id);
          const code = generateBlockCode(block);
          chainCode.push(code);
          
          // 继续递归收集
          if (block.ggplotConnections) {
            block.ggplotConnections.forEach(connId => {
              if (!visited.has(connId)) {
                collectGgplotLayers(connId);
              }
            });
          }
        };
        
        // 收集所有虚线连接的积木
        current.ggplotConnections.forEach(connId => {
          if (!visited.has(connId)) {
            collectGgplotLayers(connId);
          }
        });
        
        // 输出 ggplot 链，使用 + 连接，过滤掉空代码
        const nonEmptyChainCode = chainCode.filter(code => code.trim());
        console.log('✅ [CodeGen] 生成 ggplot 链，共', nonEmptyChainCode.length, '个积木（过滤后）');
        console.log(`🔍 [CodeGen] 当前积木 ${current.id} 的 assignedTo:`, current.assignedTo);
        if (nonEmptyChainCode.length > 0) {
          // 检查是否有变量赋值
          const assignment = current.assignedTo ? `${current.assignedTo} <- ` : '';
          console.log(`📝 [CodeGen] 变量赋值前缀: "${assignment}"`);
          // 第一行不加 +（可能有变量赋值）
          const firstLine = `${assignment}${nonEmptyChainCode[0]}${nonEmptyChainCode.length > 1 ? ' +' : ''}`;
          console.log(`📝 [CodeGen] 第一行代码: ${firstLine}`);
          lines.push(firstLine);
          // 后续行加缩进和 +
          for (let i = 1; i < nonEmptyChainCode.length; i++) {
            const isLast = i === nonEmptyChainCode.length - 1;
            lines.push(`  ${nonEmptyChainCode[i]}${isLast ? '' : ' +'}`);
          }
        }
      } else {
        // 普通积木，直接输出
        console.log('📝 [CodeGen] 生成普通积木代码:', current.id, current.blockType);
        const code = generateBlockCode(current);
        // 🚀 只有当代码非空时才添加到输出
        if (code.trim()) {
          lines.push(code);
        }
      }
      
      // 继续沿着实线连接（执行顺序）前进
      const nextId: string | null = current.connections.output;
      current = nextId ? blocks.find(b => b.id === nextId) : undefined;
    }
  });
  
  // 🚫 不生成未连接到开始积木的积木
  // 用户需求：手动连接构建代码时，不被链接的积木不进入代码
  const unconnectedBlocks = blocks.filter(b => !visited.has(b.id) && !b.parentId);
  if (unconnectedBlocks.length > 0) {
    console.log('🔍 [CodeGen] 发现未连接到开始积木的积木:', unconnectedBlocks.map(b => ({ id: b.id, type: b.blockType })));
    console.log('⏭️ [CodeGen] 这些积木不会生成代码');
  }
  
  lines.push('');
  
  // 清理生成的代码：移除多余的逗号和空格
  const cleanedLines = lines.map(line => {
    // 移除函数调用中的尾随逗号: func(arg, ) -> func(arg)
    line = line.replace(/,\s*\)/g, ')');
    // 移除空括号前的逗号: func(, ) -> func()
    line = line.replace(/\(\s*,\s*/g, '(');
    return line;
  });
  
  return cleanedLines.join('\n');
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

