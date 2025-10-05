/**
 * 测试代码生成和解析的可逆性
 * 
 * 可逆性定义：
 * code → blocks → code' 
 * 其中 code 和 code' 应该在语义上等价
 */

import { BlockInstance } from '../types/blocks';
import { generateRCode } from './codeGenerator';
import { parseRCodeToBlocksWithAST } from './astCodeParser';

/**
 * 规范化R代码，用于比较
 * 1. 移除注释
 * 2. 移除空行
 * 3. 统一空格
 * 4. 统一运算符周围的空格
 * 5. 移除首尾空格
 * 6. 将常见函数的位置参数转换为命名参数（规范化形式）
 * 7. 统一 ggplot2 管道操作符的换行（合并为单行）
 * 8. 合并多行函数调用为单行
 */
export function normalizeRCode(code: string): string {
  // 🔧 第一步：移除所有注释（包括行内注释和整行注释）
  let normalized = removeComments(code);
  
  // 🔧 第二步：移除空行并trim
  normalized = normalized
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // 🔧 合并所有多行函数调用（包括普通函数和 ggplot 链）
  normalized = mergeContinuationLines(normalized);
  
  // 规范化常见函数的参数形式
  normalized = normalizeFunctionCalls(normalized);
  
  // 🔧 统一空格和引号
  normalized = normalizeWhitespaceAndQuotes(normalized);
  
  return normalized;
}

/**
 * 移除R代码中的所有注释（包括整行注释和行内注释）
 * 注意：需要正确处理字符串中的 # 字符（不是注释）
 */
function removeComments(code: string): string {
  let result = '';
  let inString = false;
  let stringChar = '';
  let escaped = false;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    
    // 处理转义字符
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escaped = true;
      result += char;
      continue;
    }
    
    // 处理字符串
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
      result += char;
      continue;
    }
    
    if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
      result += char;
      continue;
    }
    
    // 在字符串内部，直接添加（包括 # 字符）
    if (inString) {
      result += char;
      continue;
    }
    
    // 在字符串外部，检测注释
    if (char === '#') {
      // 跳过本行剩余内容（直到换行符）
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      // 保留换行符
      if (i < code.length && code[i] === '\n') {
        result += '\n';
      }
      continue;
    }
    
    // 普通字符
    result += char;
  }
  
  return result;
}

/**
 * 合并所有续行（包括普通函数调用和 ggplot 链）
 * 
 * 规则：
 * 1. 以 + 或 %>% 结尾的行：合并下一行（ggplot 链）
 * 2. 括号未闭合的行：合并下一行（多行函数调用）
 * 3. 以逗号结尾的行：合并下一行（函数参数跨行）
 * 
 * 例如：
 * data.frame(
 *   x = 1,
 *   y = 2
 * )
 * 
 * 变为：
 * data.frame(x = 1, y = 2)
 */
function mergeContinuationLines(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let currentLine = '';
  let openParens = 0;
  let openBrackets = 0;
  let openBraces = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (currentLine) {
      currentLine += ' ' + line;
    } else {
      currentLine = line;
    }
    
    // 计算括号平衡（忽略字符串内的括号）
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j - 1] : '';
      
      // 处理字符串
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      // 忽略字符串内的括号
      if (inString) continue;
      
      // 计算括号
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
    }
    
    // 检查是否需要继续合并下一行
    const needsContinuation = 
      currentLine.endsWith('+') ||       // ggplot 链
      currentLine.endsWith('%>%') ||     // 管道操作符
      currentLine.endsWith(',') ||       // 参数跨行
      openParens > 0 ||                  // 括号未闭合
      openBrackets > 0 ||                // 方括号未闭合
      openBraces > 0;                    // 花括号未闭合
    
    if (!needsContinuation) {
      // 完整的语句，添加到结果
      if (currentLine) {
        result.push(currentLine);
      }
      currentLine = '';
      openParens = 0;
      openBrackets = 0;
      openBraces = 0;
      inString = false;
      stringChar = '';
    }
  }
  
  // 添加最后一行（如果有）
  if (currentLine) {
    result.push(currentLine);
  }
  
  return result.join('\n');
}

/**
 * 合并 ggplot2 的管道操作符行
 * 将跨行的 ggplot 链式调用合并为单行
 * 
 * 例如：
 * p <- ggplot(data, aes(x = x)) +
 *   geom_point() +
 *   theme_minimal()
 * 
 * 变为：
 * p <- ggplot(data, aes(x = x)) + geom_point() + theme_minimal()
 * 
 * @deprecated 已被 mergeContinuationLines 替代
 */
function mergeGgplotPipeLines(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let currentLine = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (currentLine) {
      // 如果前一行以 + 或 %>% 结尾，合并当前行
      currentLine += ' ' + line;
    } else {
      currentLine = line;
    }
    
    // 检查当前行是否以管道操作符结尾
    if (currentLine.endsWith('+') || currentLine.endsWith('%>%')) {
      // 继续合并下一行
      continue;
    } else {
      // 完整的语句，添加到结果
      if (currentLine) {
        result.push(currentLine);
      }
      currentLine = '';
    }
  }
  
  // 添加最后一行（如果有）
  if (currentLine) {
    result.push(currentLine);
  }
  
  return result.join('\n');
}

/**
 * 规范化函数调用的参数
 * 将位置参数转换为命名参数（针对我们支持的常见函数）
 */
function normalizeFunctionCalls(code: string): string {
  // 1. 移除命名空间前缀（ggplot2::, dplyr:: 等）
  code = code.replace(/\b(ggplot2|dplyr|tidyr|tibble)::/g, '');
  
  // 2. 规范化 ggsave 函数
  // 可能的形式：
  // 1. ggsave(p, "output.png") - 两个位置参数
  // 2. ggsave(p, file = "output.png") - 混合参数
  // 3. ggsave(plot = p, file = "output.png") - 全命名参数
  // 4. ggsave("output.png") - 单个位置参数
  // 目标: 统一为全命名参数形式
  
  code = code.replace(
    /ggsave\(([^)]+)\)/g,
    (match, argsStr) => {
      // 解析所有参数
      const args = parseArguments(argsStr);
      
      if (args.length === 0) {
        return match;
      }
      
      // 规范化参数
      const normalizedArgs: string[] = [];
      
      for (let i = 0; i < args.length; i++) {
        const arg = args[i].trim();
        
        // 如果已经是命名参数，保持原样
        if (arg.includes('=')) {
          normalizedArgs.push(arg);
          continue;
        }
        
        // 位置参数需要转换为命名参数
        if (i === 0) {
          // 第一个位置参数：判断是 plot 还是 filename
          const isPlot = !arg.startsWith('"') && !arg.startsWith("'");
          if (isPlot) {
            normalizedArgs.push(`plot = ${arg}`);
          } else {
            normalizedArgs.push(`file = ${arg}`);
          }
        } else if (i === 1) {
          // 第二个位置参数：通常是 file
          normalizedArgs.push(`file = ${arg}`);
        } else {
          // 其他位置参数保持原样（不太常见）
          normalizedArgs.push(arg);
        }
      }
      
      return `ggsave(${normalizedArgs.join(', ')})`;
    }
  );
  
  // 3. 移除 geom_* 和 stat_* 函数中显式的 mapping = 参数名
  // 因为 aes() 参数如果是第一个或第二个（在 data 后），默认就是 mapping
  // 需要使用更智能的解析方式来处理嵌套括号
  code = normalizeGeomMappingParameter(code);
  
  // 4. 统一参数名：colour → color（R 语言中两者是同义词）
  code = normalizeParameterNames(code);
  
  return code;
}

/**
 * 统一参数名
 * R 语言中某些参数有多个同义写法，需要统一
 * 例如：colour 和 color 是同义词
 */
function normalizeParameterNames(code: string): string {
  // 统一 colour → color
  // 但要避免替换字符串内部的内容
  let result = '';
  let inString = false;
  let stringChar = '';
  let i = 0;
  
  while (i < code.length) {
    const char = code[i];
    
    // 处理字符串
    if ((char === '"' || char === "'") && (i === 0 || code[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      result += char;
      i++;
      continue;
    }
    
    // 在字符串内部，直接添加
    if (inString) {
      result += char;
      i++;
      continue;
    }
    
    // 在字符串外部，检查是否匹配 "colour"
    if (code.substring(i, i + 6) === 'colour') {
      // 检查前后是否是单词边界
      const prevChar = i > 0 ? code[i - 1] : '';
      const nextChar = i + 6 < code.length ? code[i + 6] : '';
      const isPrevBoundary = !prevChar || /[\s,()=]/.test(prevChar);
      const isNextBoundary = !nextChar || /[\s,()=]/.test(nextChar);
      
      if (isPrevBoundary && isNextBoundary) {
        result += 'color';
        i += 6;
        continue;
      }
    }
    
    result += char;
    i++;
  }
  
  return result;
}

/**
 * 规范化 geom_* 函数中的 mapping 参数
 * 移除显式的 mapping = ，因为它是默认参数
 */
function normalizeGeomMappingParameter(code: string): string {
  // 匹配 geom_* 或 stat_* 函数调用
  const geomPattern = /\b(geom_\w+|stat_\w+)\s*\(/g;
  let match;
  let result = '';
  let lastIndex = 0;
  
  while ((match = geomPattern.exec(code)) !== null) {
    const funcName = match[1];
    const startPos = match.index;
    const openParenPos = match.index + match[0].length - 1;
    
    // 添加函数名之前的内容
    result += code.substring(lastIndex, openParenPos + 1);
    
    // 找到对应的闭括号
    const closeParenPos = findMatchingParen(code, openParenPos);
    if (closeParenPos === -1) {
      // 如果找不到匹配的括号，保持原样
      lastIndex = openParenPos + 1;
      continue;
    }
    
    // 提取参数字符串
    const argsStr = code.substring(openParenPos + 1, closeParenPos);
    
    // 规范化参数
    const normalizedArgs = normalizeGeomArgs(argsStr);
    
    result += normalizedArgs;
    result += ')';
    
    lastIndex = closeParenPos + 1;
    geomPattern.lastIndex = lastIndex;
  }
  
  // 添加剩余内容
  result += code.substring(lastIndex);
  
  return result;
}

/**
 * 规范化 geom 函数的参数列表
 */
function normalizeGeomArgs(argsStr: string): string {
  if (!argsStr.trim()) {
    return argsStr;
  }
  
  // 解析参数
  const args = parseArguments(argsStr);
  const normalizedArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i].trim();
    
    // 移除 mapping = aes(...)
    if (arg.startsWith('mapping') && arg.includes('=')) {
      // 提取 aes(...) 部分，需要正确处理嵌套括号
      const equalPos = arg.indexOf('=');
      const valueStr = arg.substring(equalPos + 1).trim();
      
      // 如果值是 aes(...)，则只保留 aes(...) 部分
      if (valueStr.startsWith('aes')) {
        normalizedArgs.push(valueStr);
        continue;
      }
    }
    
    // 保留其他参数
    normalizedArgs.push(arg);
  }
  
  return normalizedArgs.join(', ');
}

/**
 * 找到匹配的闭括号位置
 */
function findMatchingParen(str: string, openPos: number): number {
  let depth = 1;
  let inString = false;
  let stringChar = '';
  
  for (let i = openPos + 1; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';
    
    // 处理字符串
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      continue;
    }
    
    if (inString) {
      continue;
    }
    
    // 处理括号
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  
  return -1; // 没有找到匹配的括号
}

/**
 * 统一空格和引号
 * 1. 移除括号内侧的空格：( x ) → (x)
 * 2. 移除逗号前的空格，确保逗号后有一个空格：x , y → x, y
 * 3. 统一运算符周围的空格：x*y → x * y, x=y → x = y
 * 4. 统一引号：单引号 → 双引号
 */
function normalizeWhitespaceAndQuotes(code: string): string {
  let result = '';
  let inString = false;
  let stringChar = '';
  let escaped = false;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';
    const nextChar = i < code.length - 1 ? code[i + 1] : '';
    
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escaped = true;
      result += char;
      continue;
    }
    
    // 处理字符串开始/结束
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
      result += '"'; // 统一使用双引号
      continue;
    }
    
    if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
      result += '"'; // 统一使用双引号
      continue;
    }
    
    // 在字符串内部，直接添加
    if (inString) {
      result += char;
      continue;
    }
    
    // === 在字符串外部，进行空格规范化 ===
    
    // 1. 移除括号/方括号内侧的空格
    if ((char === '(' || char === '[') && nextChar === ' ') {
      result += char;
      // 跳过后面的空格
      while (i < code.length - 1 && code[i + 1] === ' ') {
        i++;
      }
      continue;
    }
    
    if ((char === ')' || char === ']') && prevChar === ' ') {
      // 移除前面的空格
      while (result.length > 0 && result[result.length - 1] === ' ') {
        result = result.slice(0, -1);
      }
      result += char;
      continue;
    }
    
    // 2. 规范化逗号：移除逗号前的空格，确保逗号后有一个空格
    if (char === ',') {
      // 移除逗号前的空格
      while (result.length > 0 && result[result.length - 1] === ' ') {
        result = result.slice(0, -1);
      }
      result += ',';
      
      // 确保逗号后有且仅有一个空格
      if (nextChar === ' ') {
        result += ' ';
        // 跳过多余的空格
        while (i < code.length - 1 && code[i + 1] === ' ') {
          i++;
        }
      } else if (nextChar && nextChar !== ')' && nextChar !== ']' && nextChar !== '\n') {
        result += ' ';
      }
      continue;
    }
    
    // 3. 统一运算符周围的空格
    // 二元运算符：*, /, +, -
    if (char === '*' || char === '/' || char === '+') {
      // 移除运算符前的多余空格
      while (result.length > 0 && result[result.length - 1] === ' ') {
        result = result.slice(0, -1);
      }
      result += ' ' + char;
      
      // 确保运算符后有空格
      if (nextChar === ' ') {
        result += ' ';
        while (i < code.length - 1 && code[i + 1] === ' ') {
          i++;
        }
      } else if (nextChar && nextChar !== ' ' && nextChar !== '\n') {
        result += ' ';
      }
      continue;
    }
    
    // - 运算符需要特殊处理（可能是负号）
    if (char === '-') {
      // 检查是否是负号
      const isNegative = !prevChar || prevChar === '(' || prevChar === '[' || 
                        prevChar === ',' || prevChar === ' ' || prevChar === '=';
      
      if (isNegative) {
        // 作为负号，不加空格
        result += char;
      } else {
        // 作为减法运算符，加空格
        while (result.length > 0 && result[result.length - 1] === ' ') {
          result = result.slice(0, -1);
        }
        result += ' ' + char;
        
        if (nextChar === ' ') {
          result += ' ';
          while (i < code.length - 1 && code[i + 1] === ' ') {
            i++;
          }
        } else if (nextChar && nextChar !== ' ' && nextChar !== '\n') {
          result += ' ';
        }
      }
      continue;
    }
    
    // = 运算符（避免处理 ==, !=, <=, >=）
    if (char === '=') {
      const prevNonSpace = result.trimEnd().slice(-1);
      if (prevNonSpace !== '=' && prevNonSpace !== '<' && prevNonSpace !== '>' && prevNonSpace !== '!' &&
          nextChar !== '=') {
        // 移除 = 前的多余空格
        while (result.length > 0 && result[result.length - 1] === ' ') {
          result = result.slice(0, -1);
        }
        result += ' ' + char;
        
        // 确保 = 后有空格
        if (nextChar === ' ') {
          result += ' ';
          while (i < code.length - 1 && code[i + 1] === ' ') {
            i++;
          }
        } else if (nextChar && nextChar !== ' ' && nextChar !== '\n') {
          result += ' ';
        }
        continue;
      }
    }
    
    // 其他字符直接添加
    result += char;
  }
  
  return result;
}

/**
 * 解析函数参数列表（简单版本，处理逗号分隔的参数）
 * 注意：需要处理嵌套括号和引号
 */
function parseArguments(argsStr: string): string[] {
  const args: string[] = [];
  let currentArg = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    const prevChar = i > 0 ? argsStr[i - 1] : '';
    
    // 处理字符串
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      currentArg += char;
      continue;
    }
    
    if (inString) {
      currentArg += char;
      continue;
    }
    
    // 处理括号深度
    if (char === '(') {
      depth++;
      currentArg += char;
      continue;
    }
    
    if (char === ')') {
      depth--;
      currentArg += char;
      continue;
    }
    
    // 处理逗号分隔符
    if (char === ',' && depth === 0) {
      args.push(currentArg.trim());
      currentArg = '';
      continue;
    }
    
    currentArg += char;
  }
  
  // 添加最后一个参数
  if (currentArg.trim()) {
    args.push(currentArg.trim());
  }
  
  return args;
}

/**
 * 测试可逆性
 * 
 * @param originalCode 原始 R 代码
 * @param webR WebR 实例
 * @returns 测试结果
 */
export async function testReversibility(
  originalCode: string,
  webR: any
): Promise<{
  success: boolean;
  originalNormalized: string;
  generatedNormalized: string;
  blocks: BlockInstance[];
  diff?: string[];
}> {
  console.log('\n🧪 [可逆性测试] 开始测试...');
  console.log('📝 [可逆性测试] 原始代码:\n', originalCode);
  
  // 1. 解析：代码 → 积木
  console.log('\n⚙️ [可逆性测试] 步骤1: 解析代码 → 积木');
  const blocks = await parseRCodeToBlocksWithAST(originalCode, webR);
  console.log(`✅ [可逆性测试] 解析完成，共 ${blocks.length} 个积木`);
  
  // 输出积木结构
  console.log('\n📊 [可逆性测试] 积木结构:');
  blocks.forEach(block => {
    const connections = [];
    if (block.connections.input) connections.push(`input: ${block.connections.input}`);
    if (block.connections.output) connections.push(`output: ${block.connections.output}`);
    if (block.ggplotConnections && block.ggplotConnections.length > 0) {
      connections.push(`ggplot: [${block.ggplotConnections.join(', ')}]`);
    }
    console.log(`  - ${block.id} (${block.blockType}): ${connections.join(', ') || '无连接'}`);
  });
  
  // 2. 生成：积木 → 代码
  console.log('\n⚙️ [可逆性测试] 步骤2: 积木 → 生成代码');
  const generatedCode = generateRCode(blocks);
  console.log('✅ [可逆性测试] 代码生成完成');
  console.log('📝 [可逆性测试] 生成的代码:\n', generatedCode);
  
  // 3. 规范化
  console.log('\n⚙️ [可逆性测试] 步骤3: 规范化代码');
  const originalNormalized = normalizeRCode(originalCode);
  const generatedNormalized = normalizeRCode(generatedCode);
  
  console.log('📝 [可逆性测试] 规范化后的原始代码:\n', originalNormalized);
  console.log('📝 [可逆性测试] 规范化后的生成代码:\n', generatedNormalized);
  
  // 4. 比较
  console.log('\n⚙️ [可逆性测试] 步骤4: 比较代码');
  const success = originalNormalized === generatedNormalized;
  
  if (success) {
    console.log('✅ [可逆性测试] 测试通过！代码完全可逆');
  } else {
    console.log('❌ [可逆性测试] 测试失败！代码不可逆');
    
    // 计算差异
    const diff = computeDiff(originalNormalized, generatedNormalized);
    console.log('\n📋 [可逆性测试] 差异：');
    diff.forEach(line => console.log('  ' + line));
  }
  
  return {
    success,
    originalNormalized,
    generatedNormalized,
    blocks,
    diff: success ? undefined : computeDiff(originalNormalized, generatedNormalized)
  };
}

/**
 * 计算两个文本的差异（简单版本）
 */
function computeDiff(text1: string, text2: string): string[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const diff: string[] = [];
  
  const maxLen = Math.max(lines1.length, lines2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i] || '';
    const line2 = lines2[i] || '';
    
    if (line1 !== line2) {
      diff.push(`第 ${i + 1} 行不同:`);
      if (line1) diff.push(`  原始: ${line1}`);
      if (line2) diff.push(`  生成: ${line2}`);
    }
  }
  
  if (diff.length === 0 && lines1.length !== lines2.length) {
    diff.push(`行数不同: 原始 ${lines1.length} 行，生成 ${lines2.length} 行`);
  }
  
  return diff;
}

/**
 * 测试用例集合
 */
export const TEST_CASES = {
  // 测试1: 简单的 ggplot 链
  simpleGgplot: `library(ggplot2)
p <- ggplot(mtcars, aes(x=wt, y=mpg)) +
  geom_point() +
  theme_minimal()`,
  
  // 测试2: 带数据导入
  withDataImport: `library(ggplot2)
data <- read.csv("data.csv")
p <- ggplot(data, aes(x=x, y=y)) +
  geom_bar(stat="identity")
ggsave(p, "output.png")`,
  
  // 测试3: 多个语句
  multipleStatements: `library(ggplot2)
library(dplyr)
data <- read.csv("data.csv")
p <- ggplot(data, aes(x=x, y=y)) + geom_point()
print(p)`,
  
  // 测试4: 复杂的 ggplot 链
  complexGgplot: `library(ggplot2)
ggplot(iris, aes(x=Sepal.Length, y=Sepal.Width, color=Species)) +
  geom_point() +
  geom_smooth(method="lm") +
  labs(title="Iris Dataset", x="Sepal Length", y="Sepal Width") +
  theme_minimal()`,
};

/**
 * 运行所有测试用例
 */
export async function runAllTests(webR: any): Promise<void> {
  console.log('🚀 [可逆性测试] 开始运行所有测试用例...\n');
  
  const results: Array<{ name: string; success: boolean }> = [];
  
  for (const [name, code] of Object.entries(TEST_CASES)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 测试用例: ${name}`);
    console.log('='.repeat(60));
    
    try {
      const result = await testReversibility(code, webR);
      results.push({ name, success: result.success });
    } catch (error) {
      console.error(`❌ 测试 ${name} 失败:`, error);
      results.push({ name, success: false });
    }
  }
  
  // 汇总结果
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 测试汇总');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.success ? '通过' : '失败'}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`总计: ${passed}/${total} 通过 (${(passed / total * 100).toFixed(1)}%)`);
  console.log('='.repeat(60));
}

