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
 */
export function normalizeRCode(code: string): string {
  let normalized = code
    .split('\n')
    .map(line => line.trim())
    // 过滤注释和空行
    .filter(line => {
      if (!line) return false;
      if (line.startsWith('#')) return false;
      return true;
    })
    // 统一空格
    .map(line => line.replace(/\s+/g, ' '))
    // 统一运算符周围的空格：确保 = 周围有空格
    .map(line => {
      // 在赋值和参数中添加空格：x=y → x = y
      // 但要避免处理字符串内部和注释
      return line
        .replace(/([a-zA-Z0-9_.])\s*=\s*([a-zA-Z0-9_."(])/g, '$1 = $2')
        .replace(/,\s*/g, ', '); // 逗号后统一加空格
    })
    .join('\n');
  
  // 合并 ggplot2 管道操作符的多行为单行
  normalized = mergeGgplotPipeLines(normalized);
  
  // 规范化常见函数的参数形式
  normalized = normalizeFunctionCalls(normalized);
  
  return normalized;
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
  // 规范化 ggsave 函数
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
  
  return code;
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

