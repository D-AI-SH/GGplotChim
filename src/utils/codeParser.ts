import { BlockInstance, BlockType } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';

/**
 * R代码解析器 - 将R代码反向解析为积木块
 * 这是一个简化版本，支持常见的ggplot2语句和基础R语句
 */

interface ParsedBlock {
  blockType: BlockType;
  params: Record<string, any>;
  order?: number;
}

/**
 * 解析单个函数调用，提取函数名和参数
 */
function parseFunctionCall(code: string): { name: string; args: string } | null {
  // 匹配函数调用格式: functionName(arguments)
  const match = code.trim().match(/^(\w+)\((.*)\)$/s);
  if (!match) return null;
  
  return {
    name: match[1],
    args: match[2]
  };
}

/**
 * 解析函数参数为键值对
 */
function parseArguments(argsString: string): Record<string, any> {
  const params: Record<string, any> = {};
  if (!argsString.trim()) return params;
  
  // 简单的参数解析 - 处理 name = value 格式
  // 这是一个简化版本，可能需要更复杂的解析器来处理嵌套等情况
  const argPairs = splitArguments(argsString);
  
  argPairs.forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex > 0) {
      const key = pair.substring(0, equalIndex).trim();
      let value = pair.substring(equalIndex + 1).trim();
      
      // 移除引号
      value = value.replace(/^["']|["']$/g, '');
      
      params[key] = value;
    } else {
      // 无名参数（位置参数）
      const trimmed = pair.trim().replace(/^["']|["']$/g, '');
      if (trimmed) {
        // 对于某些函数，第一个参数可能是特殊的（如data参数）
        if (!params['_positional']) {
          params['_positional'] = trimmed;
        }
      }
    }
  });
  
  return params;
}

/**
 * 智能分割参数 - 考虑括号和引号
 */
function splitArguments(argsString: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];
    const prevChar = i > 0 ? argsString[i - 1] : '';
    
    // 处理引号
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
        quoteChar = '';
      }
    }
    
    // 处理括号深度
    if (!inQuote) {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }
    }
    
    // 在顶层且不在引号内遇到逗号时分割
    if (char === ',' && depth === 0 && !inQuote) {
      args.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    args.push(current);
  }
  
  return args;
}

/**
 * 根据函数名和参数匹配积木类型
 */
function matchBlockType(functionName: string, params: Record<string, any>): BlockType | null {
  // 直接映射常见函数名到BlockType
  const functionToBlockType: Record<string, BlockType> = {
    'library': BlockType.LIBRARY,
    'print': BlockType.PRINT,
    'ggplot': BlockType.GGPLOT_INIT,
    'aes': BlockType.AES,
    'geom_point': BlockType.GEOM_POINT,
    'geom_line': BlockType.GEOM_LINE,
    'geom_bar': BlockType.GEOM_BAR,
    'geom_col': BlockType.GEOM_COL,
    'geom_histogram': BlockType.GEOM_HISTOGRAM,
    'geom_boxplot': BlockType.GEOM_BOXPLOT,
    'geom_smooth': BlockType.GEOM_SMOOTH,
    'geom_text': BlockType.GEOM_TEXT,
    'geom_area': BlockType.GEOM_AREA,
    'scale_x_continuous': BlockType.SCALE_X_CONTINUOUS,
    'scale_y_continuous': BlockType.SCALE_Y_CONTINUOUS,
    'scale_color_manual': BlockType.SCALE_COLOR_MANUAL,
    'scale_fill_manual': BlockType.SCALE_FILL_MANUAL,
    'scale_color_brewer': BlockType.SCALE_COLOR_BREWER,
    'scale_fill_gradient': BlockType.SCALE_FILL_GRADIENT,
    'coord_flip': BlockType.COORD_FLIP,
    'coord_cartesian': BlockType.COORD_CARTESIAN,
    'coord_polar': BlockType.COORD_POLAR,
    'facet_wrap': BlockType.FACET_WRAP,
    'facet_grid': BlockType.FACET_GRID,
    'stat_summary': BlockType.STAT_SUMMARY,
    'stat_smooth': BlockType.STAT_SMOOTH,
    'labs': BlockType.LABS,
    'ggtitle': BlockType.GGTITLE,
    'xlab': BlockType.XLAB,
    'ylab': BlockType.YLAB,
    'theme_minimal': BlockType.THEME_MINIMAL,
    'theme_classic': BlockType.THEME_CLASSIC,
    'theme_bw': BlockType.THEME_BW,
    'theme_gray': BlockType.THEME_GRAY,
    'theme_light': BlockType.THEME_LIGHT,
    'theme_dark': BlockType.THEME_DARK,
    'theme_void': BlockType.THEME_VOID,
    'theme': BlockType.THEME,
  };
  
  return functionToBlockType[functionName] || null;
}

/**
 * 规范化参数名称 - 将解析的参数映射到积木定义的参数名
 */
function normalizeParams(blockType: BlockType, parsedParams: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  const blockDef = blockDefinitions.find(b => b.type === blockType);
  
  if (!blockDef) return parsedParams;
  
  // 特殊处理某些积木类型
  if (blockType === BlockType.LIBRARY && parsedParams._positional) {
    normalized.package = parsedParams._positional;
  } else if (blockType === BlockType.PRINT && parsedParams._positional) {
    // print() 函数的第一个参数是 value
    normalized.value = parsedParams._positional;
  } else if (blockType === BlockType.GGPLOT_INIT && parsedParams._positional) {
    normalized.data = parsedParams._positional;
  } else if (blockType === BlockType.DATA_IMPORT) {
    // 从赋值语句中提取
    normalized.source = parsedParams.source || parsedParams._positional || 'iris';
  } else {
    // 其他积木：直接复制参数
    Object.keys(parsedParams).forEach(key => {
      if (key !== '_positional') {
        normalized[key] = parsedParams[key];
      }
    });
    
    // 如果有位置参数且积木有特定的第一参数
    if (parsedParams._positional && blockDef.params.length > 0) {
      const firstParam = blockDef.params[0];
      if (!normalized[firstParam.name]) {
        normalized[firstParam.name] = parsedParams._positional;
      }
    }
  }
  
  return normalized;
}

/**
 * 解析单行代码为积木
 */
function parseCodeLine(line: string): ParsedBlock | null {
  const trimmed = line.trim();
  
  // 跳过注释和空行
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  
  // 解析 for 循环 (例如: for (i in 1:10) {)
  const forMatch = trimmed.match(/^for\s*\(\s*(\w+)\s+in\s+(.+?)\)\s*\{?$/);
  if (forMatch) {
    return {
      blockType: BlockType.FOR_LOOP,
      params: {
        var: forMatch[1],
        range: forMatch[2]
      }
    };
  }
  
  // 解析 if 语句 (例如: if (x > 0) {)
  const ifMatch = trimmed.match(/^if\s*\((.+?)\)\s*\{?$/);
  if (ifMatch) {
    return {
      blockType: BlockType.IF_STATEMENT,
      params: {
        condition: ifMatch[1]
      }
    };
  }
  
  // 跳过结束大括号
  if (trimmed === '}') {
    return null;
  }
  
  // 解析赋值语句 (例如: data <- iris)
  if (trimmed.includes('<-')) {
    const parts = trimmed.split('<-').map(p => p.trim());
    if (parts.length === 2) {
      const varName = parts[0];
      const value = parts[1];
      
      // 检查是否是数据导入
      if (varName === 'data') {
        return {
          blockType: BlockType.DATA_IMPORT,
          params: { source: value }
        };
      }
      
      // 一般赋值
      return {
        blockType: BlockType.ASSIGN,
        params: { variable: varName, value: value }
      };
    }
  }
  
  // 解析函数调用
  const funcCall = parseFunctionCall(trimmed);
  if (funcCall) {
    const blockType = matchBlockType(funcCall.name, {});
    if (blockType) {
      const parsedParams = parseArguments(funcCall.args);
      const normalizedParams = normalizeParams(blockType, parsedParams);
      
      return {
        blockType,
        params: normalizedParams
      };
    }
    
    // 如果是未知的函数调用，使用 FUNCTION_CALL 积木而不是 CUSTOM_CODE
    return {
      blockType: BlockType.FUNCTION_CALL,
      params: {
        function_name: funcCall.name,
        args: funcCall.args
      }
    };
  }
  
  // 无法识别的代码 - 创建自定义代码块（只用于真正无法识别的语句）
  return {
    blockType: BlockType.CUSTOM_CODE,
    params: { code: trimmed }
  };
}

/**
 * 分割ggplot链式调用
 * 例如: ggplot(data) + geom_point() + theme_minimal()
 */
function splitGgplotChain(code: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';
    
    // 处理引号
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
        quoteChar = '';
      }
    }
    
    // 处理括号深度
    if (!inQuote) {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }
    }
    
    // 在顶层且不在引号内遇到 + 时分割
    if (char === '+' && depth === 0 && !inQuote) {
      // 确保不是在数字中的 + (例如 1+2)
      const trimmedCurrent = current.trim();
      if (trimmedCurrent) {
        parts.push(trimmedCurrent);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

/**
 * 主解析函数：将R代码转换为积木块实例
 */
export function parseRCodeToBlocks(code: string): BlockInstance[] {
  const blocks: BlockInstance[] = [];
  let blockIdCounter = 1;
  let currentY = 100; // 全局Y坐标追踪器
  
  // 按行分割代码
  const lines = code.split('\n');
  let currentChainBlocks: BlockInstance[] = [];
  let inChain = false;
  let chainBuffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过注释、空行和 library 语句（自动生成的，不需要解析）
    if (!line || line.startsWith('#') || line.startsWith('library(')) {
      continue;
    }
    
    // 检测是否是ggplot链的开始
    if (line.includes('ggplot(')) {
      inChain = true;
      chainBuffer = line;
      
      // 检查是否链在同一行继续
      if (line.includes('+')) {
        continue; // 继续收集
      } else if (!line.endsWith('+')) {
        // 单行完整语句
        inChain = false;
      } else {
        continue; // 链在下一行继续
      }
    } else if (inChain) {
      // 收集链的后续部分
      chainBuffer += '\n' + line;
      
      if (!line.endsWith('+')) {
        inChain = false; // 链结束
      } else {
        continue; // 继续收集
      }
    }
    
    // 处理收集的链或单行语句
    if (!inChain && chainBuffer) {
      // 解析ggplot链
      const chainParts = splitGgplotChain(chainBuffer);
      const chainStartX = 100;
      const chainStartY = currentY;
      currentChainBlocks = []; // 清空临时链数组
      
      chainParts.forEach((part, index) => {
        const parsed = parseCodeLine(part);
        if (parsed) {
          const blockId = `block-${blockIdCounter++}`;
          const prevBlockId = index > 0 ? currentChainBlocks[index - 1].id : null;
          
          const blockInstance: BlockInstance = {
            id: blockId,
            blockType: parsed.blockType,
            position: { 
              x: chainStartX, 
              y: chainStartY + index * 100  // 垂直排列，每个积木间隔100px
            },
            params: parsed.params,
            connections: {
              input: prevBlockId,  // 正确引用前一个积木的ID
              output: null         // 暂时为空，在下一次迭代中设置
            },
            order: index
          };
          
          // 设置前一个块的输出连接指向当前积木
          if (index > 0 && currentChainBlocks.length > 0) {
            currentChainBlocks[currentChainBlocks.length - 1].connections.output = blockId;
          }
          
          currentChainBlocks.push(blockInstance);
        }
      });
      
      blocks.push(...currentChainBlocks);
      currentY += currentChainBlocks.length * 100 + 50; // 更新全局Y坐标
      currentChainBlocks = [];
      chainBuffer = '';
    } else if (!inChain && !chainBuffer) {
      // 处理独立的单行语句
      const parsed = parseCodeLine(line);
      if (parsed) {
        const blockInstance: BlockInstance = {
          id: `block-${blockIdCounter++}`,
          blockType: parsed.blockType,
          position: { 
            x: 100, 
            y: currentY
          },
          params: parsed.params,
          connections: {
            input: null,
            output: null
          },
          order: 0
        };
        
        blocks.push(blockInstance);
        currentY += 100; // 为下一个独立积木预留空间
      }
    }
  }
  
  // 处理可能未完成的链
  if (chainBuffer) {
    const chainParts = splitGgplotChain(chainBuffer);
    const chainStartX = 100;
    const chainStartY = currentY;
    currentChainBlocks = []; // 清空临时链数组
    
    chainParts.forEach((part, index) => {
      const parsed = parseCodeLine(part);
      if (parsed) {
        const blockId = `block-${blockIdCounter++}`;
        const prevBlockId = index > 0 ? currentChainBlocks[index - 1].id : null;
        
        const blockInstance: BlockInstance = {
          id: blockId,
          blockType: parsed.blockType,
          position: { 
            x: chainStartX, 
            y: chainStartY + index * 100  // 垂直排列
          },
          params: parsed.params,
          connections: {
            input: prevBlockId,  // 正确引用前一个积木的ID
            output: null
          },
          order: index
        };
        
        // 设置前一个块的输出连接指向当前积木
        if (index > 0 && currentChainBlocks.length > 0) {
          currentChainBlocks[currentChainBlocks.length - 1].connections.output = blockId;
        }
        
        currentChainBlocks.push(blockInstance);
      }
    });
    
    blocks.push(...currentChainBlocks);
  }
  
  return blocks;
}

/**
 * 验证解析结果是否有效
 */
export function validateParsedBlocks(blocks: BlockInstance[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (blocks.length === 0) {
    return { valid: true, errors: [] };
  }
  
  // 检查ID唯一性
  const ids = new Set<string>();
  blocks.forEach(block => {
    if (ids.has(block.id)) {
      errors.push(`重复的积木ID: ${block.id}`);
    }
    ids.add(block.id);
  });
  
  // 检查连接有效性
  blocks.forEach(block => {
    if (block.connections.input) {
      const inputBlock = blocks.find(b => b.id === block.connections.input);
      if (!inputBlock) {
        errors.push(`积木 ${block.id} 的输入连接无效`);
      }
    }
    
    if (block.connections.output) {
      const outputBlock = blocks.find(b => b.id === block.connections.output);
      if (!outputBlock) {
        errors.push(`积木 ${block.id} 的输出连接无效`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

