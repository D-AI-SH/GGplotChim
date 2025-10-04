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
 * 4. 移除首尾空格
 */
export function normalizeRCode(code: string): string {
  return code
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
    .join('\n');
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

