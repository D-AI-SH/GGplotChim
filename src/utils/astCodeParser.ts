import { BlockInstance, BlockType } from '../types/blocks';
import { blockDefinitions } from '../data/blockDefinitions';

/**
 * 基于WebR AST的R代码解析器
 * 使用R原生的parse()函数生成抽象语法树，更准确可靠
 */

/**
 * 检测两个积木是否重叠
 */
function blocksOverlap(block1: BlockInstance, block2: BlockInstance): boolean {
  const height1 = estimateBlockHeight(block1);
  const height2 = estimateBlockHeight(block2);
  const width = 280; // 假设积木宽度为 280px
  
  const x1 = block1.position.x;
  const y1 = block1.position.y;
  const x2 = block2.position.x;
  const y2 = block2.position.y;
  
  // 检测矩形是否重叠
  const horizontalOverlap = Math.abs(x1 - x2) < width;
  const verticalOverlap = Math.abs(y1 - y2) < Math.max(height1, height2);
  
  return horizontalOverlap && verticalOverlap;
}

/**
 * 调整布局以避免重叠
 */
function adjustLayoutToAvoidOverlaps(blocks: BlockInstance[]): void {
  console.log(`  🔍 检查 ${blocks.length} 个积木是否有重叠...`);
  
  // 按 Y 坐标排序
  const sortedBlocks = [...blocks].sort((a, b) => a.position.y - b.position.y);
  
  let adjusted = 0;
  for (let i = 1; i < sortedBlocks.length; i++) {
    const currentBlock = sortedBlocks[i];
    const prevBlock = sortedBlocks[i - 1];
    
    // 只检查同一列的积木（X 坐标相近）
    if (Math.abs(currentBlock.position.x - prevBlock.position.x) < 50) {
      const prevHeight = estimateBlockHeight(prevBlock);
      const minY = prevBlock.position.y + prevHeight + 40; // 40px 间距
      
      if (currentBlock.position.y < minY) {
        const oldY = currentBlock.position.y;
        currentBlock.position.y = minY;
        adjusted++;
        console.log(`  ⬇️ 调整积木 ${currentBlock.id} Y坐标: ${oldY} -> ${minY} (避免与 ${prevBlock.id} 重叠)`);
      }
    }
  }
  
  console.log(`  ✅ 布局调整完成，共调整了 ${adjusted} 个积木的位置`);
}

/**
 * 估算积木的实际高度（像素）
 * 根据积木类型和参数数量来估算
 */
function estimateBlockHeight(block: BlockInstance): number {
  const baseHeight = 80; // 增加基础高度
  const headerHeight = 50; // 标题栏高度
  const paramHeight = 45; // 增加每个参数行的高度，考虑到标签和输入框
  const paddingHeight = 30; // 增加内边距
  
  // 计算有值的参数数量
  let paramCount = Object.keys(block.params).filter(key => {
    const value = block.params[key];
    return value !== undefined && value !== null && value !== '';
  }).length;
  
  // 如果没有参数，也要预留一些空间
  if (paramCount === 0) {
    paramCount = 1;
  }
  
  // 某些积木类型有特殊的高度需求
  let extraHeight = 0;
  switch (block.blockType) {
    case BlockType.GGPLOT_INIT:
      extraHeight = 30; // ggplot 积木通常更高
      break;
    case BlockType.GEOM_BAR:
    case BlockType.GEOM_POINT:
    case BlockType.GEOM_LINE:
    case BlockType.GEOM_BOXPLOT:
    case BlockType.GEOM_HISTOGRAM:
      extraHeight = 20; // geom 积木稍高
      break;
    case BlockType.THEME:
    case BlockType.THEME_MINIMAL:
    case BlockType.THEME_CLASSIC:
      extraHeight = 15;
      break;
  }
  
  // 对于参数很多的积木，额外增加高度
  if (paramCount > 5) {
    extraHeight += (paramCount - 5) * 10;
  }
  
  const totalHeight = baseHeight + headerHeight + (paramCount * paramHeight) + paddingHeight + extraHeight;
  console.log(`  📐 估算积木 ${block.id} (${block.blockType}) 高度: 参数=${paramCount}, 总高度=${totalHeight}px`);
  return totalHeight;
}

interface ASTNode {
  type: string;
  value?: any;
  children?: ASTNode[];
  name?: string;
  args?: ASTNode[];
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
}

/**
 * 使用WebR解析R代码为AST
 */
export async function parseRCodeWithWebR(code: string, webR: any): Promise<any> {
  try {
    console.log('🔬 [parseRCodeWithWebR] 开始执行R代码解析...');
    
    // 使用R的原生parse函数
    const result = await webR.evalR(`
      tryCatch({
        # 大幅增加递归深度限制，确保能处理复杂代码
        old_options <- options(
          expressions = 50000,  # 从默认5000增加到50000
          nwarnings = 10000
        )
        on.exit(options(old_options), add = TRUE)
        
        # 解析代码
        parsed <- parse(text = ${JSON.stringify(code)})
        
        # 完整的AST转换 - 使用尾递归优化
        ast_to_list <- function(expr) {
          if (is.null(expr)) {
            return(NULL)
          }
          
          # 基础类型
          if (is.atomic(expr)) {
            if (length(expr) == 1) {
              return(list(
                type = "literal",
                value = as.character(expr),
                class = class(expr)[1]
              ))
            } else {
              # 向量
              return(list(
                type = "vector",
                values = as.character(expr),
                class = class(expr)[1],
                length = length(expr)
              ))
            }
          }
          
          # 符号/变量名
          if (is.symbol(expr)) {
            return(list(
              type = "symbol",
              name = as.character(expr)
            ))
          }
          
          # 调用表达式
          if (is.call(expr)) {
            func_name <- tryCatch(
              as.character(expr[[1]]),
              error = function(e) "unknown"
            )
            
            args_list <- list()
            arg_names <- names(expr)
            
            # 提取所有参数
            if (length(expr) > 1) {
              for (i in 2:length(expr)) {
                arg_name <- if (!is.null(arg_names) && i <= length(arg_names) && !is.na(arg_names[i]) && arg_names[i] != "") {
                  arg_names[i]
                } else {
                  paste0("_pos_", i - 1)
                }
                
                # 递归处理参数
                args_list[[arg_name]] <- ast_to_list(expr[[i]])
              }
            }
            
            return(list(
              type = "call",
              function_name = func_name,
              arguments = args_list
            ))
          }
          
          # Pairlist (用于函数参数)
          if (is.pairlist(expr)) {
            return(list(
              type = "pairlist",
              items = lapply(as.list(expr), ast_to_list)
            ))
          }
          
          # 其他表达式类型
          return(list(
            type = "expression",
            class = paste(class(expr), collapse = ","),
            deparse = paste(deparse(expr), collapse = " ")
          ))
        }
        
        # 转换所有表达式
        result <- lapply(parsed, ast_to_list)
        
        # 返回JSON
        jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
      }, error = function(e) {
        # 返回错误信息
        jsonlite::toJSON(list(
          error = TRUE,
          message = as.character(e$message)
        ), auto_unbox = TRUE)
      })
    `);
    
    console.log('🔬 [parseRCodeWithWebR] R代码执行完成，开始解析结果...');
    
    // 获取结果
    const jsonStr = await result.toJs();
    console.log('🔬 [parseRCodeWithWebR] 原始JSON字符串类型:', typeof jsonStr);
    console.log('🔬 [parseRCodeWithWebR] jsonStr.values:', jsonStr.values);
    console.log('🔬 [parseRCodeWithWebR] JSON内容 (前500字符):', jsonStr.values[0]?.substring(0, 500));
    
    const astData = JSON.parse(jsonStr.values[0]);
    console.log('🔬 [parseRCodeWithWebR] 解析后的AST数据类型:', typeof astData, Array.isArray(astData) ? '(数组)' : '');
    
    return astData;
  } catch (error) {
    console.error('❌ [parseRCodeWithWebR] WebR解析错误:', error);
    console.error('❌ [parseRCodeWithWebR] 错误堆栈:', error instanceof Error ? error.stack : '');
    throw error;
  }
}

/**
 * 展开ggplot链式调用（+ 操作符）为积木数组
 */
function flattenGgplotChain(node: any, blockIdCounter: { value: number }): BlockInstance[] {
  if (!node || node.type !== 'call') {
    return [];
  }
  
  // 如果不是 + 操作符，直接转换为单个积木
  if (node.function_name !== '+') {
    const block = astNodeToBlock(node, blockIdCounter);
    return block ? [block] : [];
  }
  
  // 递归展开左右两边
  const leftBlocks = flattenGgplotChain(node.arguments._pos_1, blockIdCounter);
  const rightBlocks = flattenGgplotChain(node.arguments._pos_2, blockIdCounter);
  
  return [...leftBlocks, ...rightBlocks];
}

/**
 * 展开代码块（{ ... }）中的语句为积木数组
 * 用于处理 for 循环体、if 语句体等
 */
function flattenCodeBlock(node: any, blockIdCounter: { value: number }): BlockInstance[] {
  if (!node) {
    return [];
  }
  
  console.log('  📦 [flattenCodeBlock] 解析代码块，类型:', node.type, '函数名:', node.function_name);
  
  // 🔧 特殊处理：for 循环（需要递归展开）
  if (node.type === 'call' && node.function_name === 'for') {
    console.log('  🔄 [flattenCodeBlock] 检测到嵌套 for 循环');
    const forBlock = astNodeToBlock(node, blockIdCounter);
    if (!forBlock) return [];
    
    forBlock.children = { body: [] };
    const allBlocks: BlockInstance[] = [forBlock];
    
    // 展开循环体
    const loopBody = node.arguments?._pos_3;
    if (loopBody) {
      const bodyBlocks = flattenCodeBlock(loopBody, blockIdCounter);
      
      // 🔍 只将直接子积木添加到 children.body（不包括孙积木）
      for (const bodyBlock of bodyBlocks) {
        // 如果这个积木没有父积木，说明它是直接子积木
        if (!bodyBlock.parentId) {
          bodyBlock.parentId = forBlock.id;
          bodyBlock.slotName = 'body';
          forBlock.children!.body.push(bodyBlock.id);
        }
      }
      
      console.log(`  ✅ [flattenCodeBlock] 嵌套 for 循环包含 ${forBlock.children!.body.length} 个直接子积木，共 ${bodyBlocks.length} 个积木（含孙积木）`);
      
      // 🔧 返回 for 积木和所有子孙积木
      allBlocks.push(...bodyBlocks);
    }
    
    return allBlocks;
  }
  
  // 🔧 特殊处理：if 语句（需要递归展开）
  if (node.type === 'call' && node.function_name === 'if') {
    console.log('  ❓ [flattenCodeBlock] 检测到嵌套 if 语句');
    console.log('  ❓ [flattenCodeBlock] if 节点参数:', Object.keys(node.arguments || {}));
    
    const ifBlock = astNodeToBlock(node, blockIdCounter);
    if (!ifBlock) return [];
    
    ifBlock.children = { then: [], else: [] };
    const allBlocks: BlockInstance[] = [ifBlock];
    
    // 展开 then 分支
    const thenBody = node.arguments?._pos_2;
    if (thenBody) {
      console.log(`  ✅ [flattenCodeBlock] 开始展开 then 分支，类型: ${thenBody.type}, 函数名: ${thenBody.function_name}`);
      const thenBlocks = flattenCodeBlock(thenBody, blockIdCounter);
      
      // 🔍 只将直接子积木添加到 children.then
      for (const thenBlock of thenBlocks) {
        if (!thenBlock.parentId) {
          thenBlock.parentId = ifBlock.id;
          thenBlock.slotName = 'then';
          ifBlock.children!.then.push(thenBlock.id);
        }
      }
      
      console.log(`  ✅ [flattenCodeBlock] 嵌套 if-then 分支包含 ${ifBlock.children!.then.length} 个直接子积木，共 ${thenBlocks.length} 个积木（含孙积木）`);
      allBlocks.push(...thenBlocks);
    }
    
    // 展开 else 分支
    const elseBody = node.arguments?._pos_3;
    if (elseBody) {
      console.log(`  ❎ [flattenCodeBlock] 开始展开 else 分支，类型: ${elseBody.type}, 函数名: ${elseBody.function_name}`);
      const elseBlocks = flattenCodeBlock(elseBody, blockIdCounter);
      
      // 🔍 只将直接子积木添加到 children.else
      for (const elseBlock of elseBlocks) {
        if (!elseBlock.parentId) {
          elseBlock.parentId = ifBlock.id;
          elseBlock.slotName = 'else';
          ifBlock.children!.else.push(elseBlock.id);
        }
      }
      
      console.log(`  ❎ [flattenCodeBlock] 嵌套 if-else 分支包含 ${ifBlock.children!.else.length} 个直接子积木，共 ${elseBlocks.length} 个积木（含孙积木）`);
      allBlocks.push(...elseBlocks);
    } else {
      console.log(`  ❎ [flattenCodeBlock] if 语句没有 else 分支`);
    }
    
    // 🔧 返回 if 积木和所有子孙积木
    console.log(`  ✅ [flattenCodeBlock] if 语句展开完成，返回 ${allBlocks.length} 个积木`);
    return allBlocks;
  }
  
  // 如果是单个表达式（不是代码块），直接转换
  if (node.type !== 'call' || node.function_name !== '{') {
    const block = astNodeToBlock(node, blockIdCounter);
    return block ? [block] : [];
  }
  
  // 如果是代码块 {...}，展开所有语句
  const blocks: BlockInstance[] = [];
  const args = node.arguments || {};
  
  // 遍历所有位置参数（_pos_1, _pos_2, ...）
  let i = 1;
  while (args[`_pos_${i}`]) {
    const statement = args[`_pos_${i}`];
    console.log(`  📝 [flattenCodeBlock] 处理语句 ${i}:`, statement.type, statement.function_name);
    
    // 递归处理可能的嵌套容器（for/if）
    const statementBlocks = flattenCodeBlock(statement, blockIdCounter);
    blocks.push(...statementBlocks);
    console.log(`  ✅ [flattenCodeBlock] 语句 ${i} 生成了 ${statementBlocks.length} 个积木`);
    
    i++;
  }
  
  console.log(`  ✅ [flattenCodeBlock] 代码块展开完成，共 ${blocks.length} 个积木`);
  return blocks;
}

/**
 * 将AST节点转换为积木块
 */
function astNodeToBlock(node: any, blockIdCounter: { value: number }): BlockInstance | null {
  console.log('  🔄 [astNodeToBlock] 输入节点:', node);
  
  if (!node || node.error) {
    console.log('  ⚠️ [astNodeToBlock] 节点为空或有错误');
    return null;
  }
  
  console.log('  📋 [astNodeToBlock] 节点类型:', node.type);
  
  // 处理调用表达式
  if (node.type === 'call') {
    let funcName = node.function_name;
    const args = node.arguments || {};
    
    // 🔧 处理 :: 操作符（函数名是数组的情况，如 ['::', 'ggplot2', 'annotate']）
    if (Array.isArray(funcName) && funcName.length === 3 && funcName[0] === '::') {
      funcName = `${funcName[1]}::${funcName[2]}`;
      console.log('  🔧 [astNodeToBlock] 转换 :: 操作符函数名:', funcName);
    } else if (Array.isArray(funcName)) {
      // 其他数组情况，记录警告
      console.warn('  ⚠️ [astNodeToBlock] 函数名是数组:', funcName);
      funcName = String(funcName);
    }
    
    console.log('  📞 [astNodeToBlock] 函数调用:', funcName);
    
    // ⛓️ 特殊处理：ggplot链式调用 (+ 操作符) - 跳过，留待主函数处理
    if (funcName === '+') {
      console.log('  ⛓️ [astNodeToBlock] 检测到 + 操作符，返回null让主函数处理');
      return null;
    }
    
    // 🔧 特殊处理：赋值语句 (<- 操作符)
    // 包括普通赋值和索引赋值 ([<-, [[<-, $<-)
    if (funcName === '<-' || funcName === '=' || funcName === '[<-' || funcName === '[[<-' || funcName === '$<-') {
      console.log(`  ✏️ [astNodeToBlock] 检测到赋值语句 (${funcName})`);
      console.log(`  📊 [astNodeToBlock] args._pos_1:`, JSON.stringify(args._pos_1, null, 2));
      console.log(`  📊 [astNodeToBlock] args._pos_2:`, JSON.stringify(args._pos_2, null, 2));
      if (args._pos_3) {
        console.log(`  📊 [astNodeToBlock] args._pos_3:`, JSON.stringify(args._pos_3, null, 2));
      }
      
      const varName = extractValue(args._pos_1);
      const value = funcName.includes('[') || funcName === '$<-' 
        ? extractValue(args._pos_3)  // 索引赋值：args._pos_2是索引，args._pos_3是值
        : extractValue(args._pos_2); // 普通赋值
      
      // 对于索引赋值，重新构建完整的左侧表达式
      let fullVarName = varName;
      if (funcName === '[<-' && args._pos_2) {
        const index = extractValue(args._pos_2);
        fullVarName = `${varName}[${index}]`;
      } else if (funcName === '[[<-' && args._pos_2) {
        const index = extractValue(args._pos_2);
        fullVarName = `${varName}[[${index}]]`;
      } else if (funcName === '$<-' && args._pos_2) {
        const field = extractValue(args._pos_2);
        fullVarName = `${varName}$${field}`;
      }
      
      console.log(`  📝 [astNodeToBlock] 赋值: ${fullVarName} <- ${value}`);
      
      // 检查是否是数据导入（变量名为 'data'）
      if (varName === 'data') {
        console.log('  💾 [astNodeToBlock] 检测到数据导入语句');
        return {
          id: `block-${blockIdCounter.value++}`,
          blockType: BlockType.DATA_IMPORT,
          position: { x: 100, y: 100 },
          params: {
            source: value
          },
          connections: { input: null, output: null },
          order: 0
        };
      }
      
      // 一般赋值语句
      console.log('  ✅ [astNodeToBlock] 创建 ASSIGN 积木');
      return {
        id: `block-${blockIdCounter.value++}`,
        blockType: BlockType.ASSIGN,
        position: { x: 100, y: 100 },
        params: {
          variable: fullVarName,
          value: value
        },
        connections: { input: null, output: null },
        order: 0
      };
    }
    
    // 🔧 特殊处理：for 循环
    if (funcName === 'for') {
      console.log('  🔄 [astNodeToBlock] 检测到 for 循环');
      const loopVar = extractValue(args._pos_1);
      const loopRange = extractValue(args._pos_2);
      // 注意：循环体 (args._pos_3) 在主解析函数中被展开处理
      
      console.log(`  📝 [astNodeToBlock] for循环: for(${loopVar} in ${loopRange})`);
      
      return {
        id: `block-${blockIdCounter.value++}`,
        blockType: BlockType.FOR_LOOP,
        position: { x: 100, y: 100 },
        params: {
          var: loopVar,
          range: loopRange
        },
        connections: { input: null, output: null },
        order: 0
      };
    }
    
    // 🔧 特殊处理：if 语句
    if (funcName === 'if') {
      console.log('  ❓ [astNodeToBlock] 检测到 if 语句');
      const condition = extractValue(args._pos_1);
      
      console.log(`  📝 [astNodeToBlock] if(${condition})`);
      
      return {
        id: `block-${blockIdCounter.value++}`,
        blockType: BlockType.IF_STATEMENT,
        position: { x: 100, y: 100 },
        params: {
          condition: condition
        },
        connections: { input: null, output: null },
        order: 0
      };
    }
    
    console.log('  📦 [astNodeToBlock] 参数:', JSON.stringify(args, null, 2));
    
    // 映射函数名到BlockType
    const blockType = matchBlockType(funcName);
    console.log('  🎯 [astNodeToBlock] 匹配到的BlockType:', blockType);
    
    if (!blockType) {
      // 未知函数，创建通用函数调用块
      console.log('  ⚠️ [astNodeToBlock] 未知函数，创建FUNCTION_CALL积木');
      
      // 🔧 将AST参数转换为R代码字符串，而不是JSON
      const argStrings: string[] = [];
      for (const [key, value] of Object.entries(args)) {
        const argValue = extractValue(value as any);
        if (key.startsWith('_pos_')) {
          // 位置参数
          argStrings.push(argValue);
        } else {
          // 命名参数
          argStrings.push(`${key} = ${argValue}`);
        }
      }
      const argsString = argStrings.join(', ');
      
      return {
        id: `block-${blockIdCounter.value++}`,
        blockType: BlockType.FUNCTION_CALL,
        position: { x: 100, y: 100 },
        params: {
          function_name: funcName,
          args: argsString
        },
        connections: { input: null, output: null },
        order: 0
      };
    }
    
    // 提取参数
    const params = extractParams(blockType, args);
    console.log('  ✅ [astNodeToBlock] 提取的参数:', params);
    
    return {
      id: `block-${blockIdCounter.value++}`,
      blockType,
      position: { x: 100, y: 100 },
      params,
      connections: { input: null, output: null },
      order: 0
    };
  }
  
  console.log('  ❌ [astNodeToBlock] 不是call类型，无法转换');
  return null;
}

/**
 * 从AST参数中提取积木参数
 */
function extractParams(blockType: BlockType, astArgs: any): Record<string, any> {
  const params: Record<string, any> = {};
  
  // 🔧 特殊处理：theme() 函数需要将所有参数组合成一个 custom 字符串
  if (blockType === BlockType.THEME) {
    const argStrings: string[] = [];
    for (const [key, value] of Object.entries(astArgs)) {
      if (!value) continue;
      const argValue = extractValue(value as any);
      if (key.startsWith('_pos_')) {
        argStrings.push(argValue);
      } else {
        argStrings.push(`${key} = ${argValue}`);
      }
    }
    params.custom = argStrings.join(', ');
    return params;
  }
  
  for (const [key, value] of Object.entries(astArgs)) {
    if (!value) continue;
    
    const argValue = value as any;
    
    // 处理位置参数
    if (key.startsWith('_pos_')) {
      const posIndex = parseInt(key.replace('_pos_', ''));
      
      // 根据blockType决定位置参数的含义
      // 特定函数的第一个参数映射
      if (blockType === BlockType.LIBRARY && posIndex === 1) {
        params.package = extractValue(argValue);
      } else if (blockType === BlockType.GGPLOT_INIT && posIndex === 1) {
        params.data = extractValue(argValue);
      } else if (blockType === BlockType.PRINT && posIndex === 1) {
        params.value = extractValue(argValue);
      } 
      // geom_* 函数的第一个参数通常是 mapping (aes) 或 data
      else if (posIndex === 1 && (
        blockType === BlockType.GEOM_POINT ||
        blockType === BlockType.GEOM_LINE ||
        blockType === BlockType.GEOM_BAR ||
        blockType === BlockType.GEOM_COL ||
        blockType === BlockType.GEOM_HISTOGRAM ||
        blockType === BlockType.GEOM_BOXPLOT ||
        blockType === BlockType.GEOM_SMOOTH ||
        blockType === BlockType.GEOM_TEXT ||
        blockType === BlockType.GEOM_AREA ||
        blockType === BlockType.GEOM_SEGMENT
      )) {
        // 对于 geom_segment，第一个参数可能是 data 或 mapping
        if (argValue.type === 'call' && argValue.function_name === 'aes') {
          params.mapping = extractValue(argValue);
        } else {
          params.data = extractValue(argValue);
        }
      }
      // annotate 函数的第一个参数是 geom 类型（字符串）
      else if (blockType === BlockType.ANNOTATE && posIndex === 1) {
        params.geom = extractValue(argValue);
      }
      // ggsave 函数的第一个参数是 plot 对象
      else if (blockType === BlockType.GGSAVE && posIndex === 1) {
        params.plot = extractValue(argValue);
      }
      // ylim 函数的参数是两个数值（最小值和最大值）
      else if (blockType === BlockType.YLIM) {
        if (posIndex === 1) {
          params.min = extractValue(argValue);
        } else if (posIndex === 2) {
          params.max = extractValue(argValue);
        }
      }
      // gather 函数的参数处理
      else if (blockType === BlockType.GATHER) {
        if (posIndex === 1) {
          params.key = extractValue(argValue);
        } else if (posIndex === 2) {
          params.value = extractValue(argValue);
        }
      }
      // unit 函数的参数
      else if (blockType === BlockType.UNIT) {
        if (posIndex === 1) {
          params.values = extractValue(argValue);
        } else if (posIndex === 2) {
          params.units = extractValue(argValue);
        }
      }
      // 其他位置参数暂时忽略（可以根据需要扩展）
    } else {
      // 命名参数
      params[key] = extractValue(argValue);
    }
  }
  
  return params;
}

/**
 * 从AST节点提取值
 * 将AST节点转换为R代码字符串
 */
function extractValue(node: any): string {
  if (!node) return '';
  
  if (node.type === 'literal') {
    const value = node.value || '';
    const literalClass = node.class;
    
    // 🔧 特殊处理：NA 在R中是一个特殊的逻辑常量，值为 "NA"
    if (value === 'NA' || value === 'NA_integer_' || value === 'NA_real_' || value === 'NA_character_' || value === 'NA_complex_') {
      return value === 'NA' || !value ? 'NA' : value;
    }
    
    // 根据字面量类型决定是否添加引号
    if (literalClass === 'character') {
      // 字符串需要添加引号（使用双引号）
      // 但要避免为空字符串添加引号后变成 ""
      return value ? `"${value}"` : '""';
    } else if (literalClass === 'logical') {
      // 逻辑值保持大写（TRUE/FALSE）
      // NA 也是逻辑类型，但已经在上面处理了
      return value || 'NA';
    } else if (value === 'NULL' || value === 'NaN' || value === 'Inf' || value === '-Inf') {
      // 其他特殊值保持原样
      return value;
    } else if (!value && literalClass === 'logical') {
      // 空值且是逻辑类型 -> NA
      return 'NA';
    } else {
      // 数值类型直接返回
      return value || '0';
    }
  }
  
  if (node.type === 'symbol') {
    return node.name || '';
  }
  
  if (node.type === 'call') {
    const funcName = node.function_name || '';
    const args = node.arguments || {};
    
    // 🔧 特殊处理：R中的中缀运算符
    // 这些运算符在AST中被解析为函数调用，但应该还原为中缀形式
    const infixOperators = [
      ':', '+', '-', '*', '/', '^', '%%', '%/%',  // 算术运算符
      '==', '!=', '<', '>', '<=', '>=',           // 比较运算符
      '&', '|', '&&', '||',                       // 逻辑运算符
      '%>%', '%in%', '%*%',                       // 特殊中缀运算符
      '$', '[', '[[',                             // 索引运算符
      '::', ':::', '@',                           // 命名空间和slot访问运算符
    ];
    
    if (infixOperators.includes(funcName)) {
      // 对于中缀运算符，使用中缀形式
      const argValues: string[] = [];
      
      // 收集位置参数
      for (const [key, value] of Object.entries(args)) {
        if (key.startsWith('_pos_')) {
          argValues.push(extractValue(value));
        }
      }
      
      // 特殊处理不同的中缀运算符
      if (funcName === '$' && argValues.length === 2) {
        return `${argValues[0]}$${argValues[1]}`;
      } else if (funcName === '@' && argValues.length === 2) {
        // S4对象的slot访问
        return `${argValues[0]}@${argValues[1]}`;
      } else if (funcName === '[' && argValues.length >= 2) {
        // data[1] or data[1, 2]
        return `${argValues[0]}[${argValues.slice(1).join(', ')}]`;
      } else if (funcName === '[[' && argValues.length >= 2) {
        // data[[1]]
        return `${argValues[0]}[[${argValues.slice(1).join(', ')}]]`;
      } else if (argValues.length === 2) {
        // 标准二元中缀运算符
        // 特殊处理：某些运算符不需要空格
        if (funcName === ':' || funcName === '::' || funcName === ':::') {
          return `${argValues[0]}${funcName}${argValues[1]}`;
        }
        // 其他运算符在两侧添加空格
        return `${argValues[0]} ${funcName} ${argValues[1]}`;
      } else if (argValues.length === 1 && (funcName === '+' || funcName === '-')) {
        // 一元运算符
        return `${funcName}${argValues[0]}`;
      }
    }
    
    // 普通函数调用：构建参数列表
    const argStrings: string[] = [];
    for (const [key, value] of Object.entries(args)) {
      const argValue = extractValue(value);
      if (key.startsWith('_pos_')) {
        // 位置参数
        argStrings.push(argValue);
      } else {
        // 命名参数
        argStrings.push(`${key} = ${argValue}`);
      }
    }
    
    return `${funcName}(${argStrings.join(', ')})`;
  }
  
  if (node.type === 'expression' && node.deparse) {
    // 使用R的deparse结果
    return node.deparse;
  }
  
  // 🚨 未处理的节点类型 - 记录警告并尝试最佳猜测
  console.warn('⚠️ [extractValue] 遇到未处理的节点类型:', node.type, node);
  
  // 如果节点有 deparse 属性，优先使用它
  if (node.deparse) {
    console.log('✅ [extractValue] 使用deparse:', node.deparse);
    return node.deparse;
  }
  
  // 最后的fallback：返回value
  if (node.value !== undefined && node.value !== null) {
    console.log('✅ [extractValue] 使用value:', node.value);
    return String(node.value);
  }
  
  // 🚨 绝对不能返回JSON！这会导致代码完全错误
  // 作为最后的手段，返回一个占位符，让用户知道这里有问题
  console.error('❌ [extractValue] 无法处理节点类型:', node.type);
  console.error('❌ [extractValue] 节点内容:', JSON.stringify(node, null, 2));
  return '<UNPARSEABLE_EXPRESSION>';
}

/**
 * 匹配函数名到BlockType
 */
function matchBlockType(functionName: string): BlockType | null {
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
    'geom_segment': BlockType.GEOM_SEGMENT,
    'scale_x_continuous': BlockType.SCALE_X_CONTINUOUS,
    'scale_y_continuous': BlockType.SCALE_Y_CONTINUOUS,
    'scale_color_manual': BlockType.SCALE_COLOR_MANUAL,
    'scale_fill_manual': BlockType.SCALE_FILL_MANUAL,
    'scale_color_brewer': BlockType.SCALE_COLOR_BREWER,
    'scale_fill_gradient': BlockType.SCALE_FILL_GRADIENT,
    'scale_fill_viridis': BlockType.SCALE_FILL_VIRIDIS,
    'coord_flip': BlockType.COORD_FLIP,
    'coord_cartesian': BlockType.COORD_CARTESIAN,
    'coord_polar': BlockType.COORD_POLAR,
    'ylim': BlockType.YLIM,
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
    'ggsave': BlockType.GGSAVE,
    'annotate': BlockType.ANNOTATE,
    'ggplot2::annotate': BlockType.ANNOTATE,
    'gather': BlockType.GATHER,
    'arrange': BlockType.ARRANGE,
    'mutate': BlockType.MUTATE,
    'summarize': BlockType.SUMMARIZE,
    'group_by': BlockType.GROUP_BY,
    'rowwise': BlockType.ROWWISE,
    'unit': BlockType.UNIT,
    'element_blank': BlockType.ELEMENT_BLANK,
  };
  
  return functionToBlockType[functionName] || null;
}

/**
 * 主解析函数：使用WebR AST将R代码转换为积木块
 */
export async function parseRCodeToBlocksWithAST(
  code: string,
  webR: any
): Promise<BlockInstance[]> {
  const blocks: BlockInstance[] = [];
  const blockIdCounter = { value: 1 };
  
  console.log('🔍 [AST解析器] 开始解析代码...');
  console.log('📝 [AST解析器] 输入代码长度:', code.length, '字符');
  console.log('📝 [AST解析器] 代码内容:\n', code);
  
  try {
    // 首先检查是否需要安装jsonlite
    console.log('📦 [AST解析器] 检查jsonlite包...');
    
    // 检查 jsonlite 是否已安装
    const checkResult = await webR.evalR('require("jsonlite", quietly = TRUE)');
    const isInstalled = await checkResult.toBoolean();
    
    if (!isInstalled) {
      console.log('📥 [AST解析器] 正在安装jsonlite包...');
      await webR.installPackages(['jsonlite']);
      await webR.evalR('library(jsonlite)');
      console.log('✅ [AST解析器] jsonlite包安装完成');
    } else {
      console.log('✅ [AST解析器] jsonlite包已存在');
    }
    
    // 解析代码为AST
    console.log('🌳 [AST解析器] 开始解析AST...');
    const ast = await parseRCodeWithWebR(code, webR);
    
    console.log('🌳 [AST解析器] AST解析结果:', JSON.stringify(ast, null, 2));
    
    if (ast.error) {
      console.error('❌ [AST解析器] AST解析错误:', ast.message);
      return blocks;
    }
    
    if (!Array.isArray(ast)) {
      console.error('❌ [AST解析器] AST不是数组:', typeof ast);
      return blocks;
    }
    
    console.log(`📊 [AST解析器] 成功解析，共 ${ast.length} 个AST节点`);
    
    // 🚀 首先添加 START 积木（程序入口）
    const startBlock: BlockInstance = {
      id: `block-${blockIdCounter.value++}`,
      blockType: BlockType.START,
      position: { x: 100, y: 100 },
      params: {},
      connections: { input: null, output: null },
      order: 0
    };
    blocks.push(startBlock);
    console.log('🚀 [AST解析器] 自动添加 START 积木:', startBlock.id);
    
    // 遍历AST并转换为积木
    // 使用两列布局：左侧普通积木（实线连接），右侧 ggplot 链（虚线连接）
    const LEFT_COLUMN_X = 100;   // 左列 X 坐标
    const RIGHT_COLUMN_X = 600;  // 右列 X 坐标（ggplot 链）
    const INITIAL_Y = 100;       // 初始 Y 坐标
    const VERTICAL_SPACING = 40; // 积木之间的垂直间距
    
    // START 积木占用第一个位置
    const startBlockHeight = estimateBlockHeight(startBlock);
    let leftColumnY = INITIAL_Y + startBlockHeight + VERTICAL_SPACING;  // 左列当前 Y 位置（从START之后开始）
    let rightColumnY = INITIAL_Y; // 右列当前 Y 位置
    
    for (let i = 0; i < ast.length; i++) {
      const node = ast[i];
      console.log(`\n🔧 [AST解析器] 处理节点 ${i + 1}/${ast.length}:`, JSON.stringify(node, null, 2));
      
      // 检查是否是赋值语句中包含 ggplot 链式调用（如: p <- ggplot(...) + geom_*()）
      let ggplotChainNode = null;
      if (node.type === 'call' && node.function_name === '<-' && node.arguments?._pos_2) {
        const rightSide = node.arguments._pos_2;
        if (rightSide.type === 'call' && rightSide.function_name === '+') {
          console.log('🎯 [AST解析器] 检测到赋值语句中的 ggplot 链式调用');
          ggplotChainNode = rightSide;
        }
      }
      // 或者直接是 ggplot 链式调用
      else if (node.type === 'call' && node.function_name === '+') {
        console.log('🎯 [AST解析器] 检测到直接的 ggplot 链式调用');
        ggplotChainNode = node;
      }
      
      if (ggplotChainNode) {
        console.log('⛓️ [AST解析器] 展开 ggplot 链式调用');
        const chainBlocks = flattenGgplotChain(ggplotChainNode, blockIdCounter);
        
        // 💡 新布局：第一个积木（ggplot）在左列，其余图层在右列
        if (chainBlocks.length > 0) {
          // 第一个积木（ggplot 主函数）放在左列
          const firstBlock = chainBlocks[0];
          firstBlock.position.x = LEFT_COLUMN_X;
          firstBlock.position.y = leftColumnY;
          firstBlock.order = 0;
          
          // 设置虚线连接到右列的图层
          if (chainBlocks.length > 1) {
            firstBlock.ggplotConnections = chainBlocks.slice(1).map(b => b.id);
            console.log(`🔗 [AST] ggplot 主积木 ${firstBlock.id} (${firstBlock.blockType}) 设置虚线连接到:`, firstBlock.ggplotConnections);
          }
          
          blocks.push(firstBlock);
          const firstBlockHeight = estimateBlockHeight(firstBlock);
          leftColumnY += firstBlockHeight + VERTICAL_SPACING;
          console.log(`  📏 ggplot 主积木 ${firstBlock.id} 在左列，位置: (${firstBlock.position.x}, ${firstBlock.position.y}), 高度: ${firstBlockHeight}px`);
          
          // 其余图层（geom_*, theme_* 等）放在右列
          if (chainBlocks.length > 1) {
            // ⭐ 右列起始位置：取右列当前位置和 ggplot 主积木位置的较大值
            const layersStartY = Math.max(rightColumnY, firstBlock.position.y);
            let layerY = layersStartY;
            
            for (let i = 1; i < chainBlocks.length; i++) {
              const layerBlock = chainBlocks[i];
              layerBlock.position.x = RIGHT_COLUMN_X;
              layerBlock.position.y = layerY;
              layerBlock.order = i;
              
              blocks.push(layerBlock);
              
              const layerHeight = estimateBlockHeight(layerBlock);
              layerY += layerHeight + VERTICAL_SPACING;
              console.log(`  📏 图层积木 ${layerBlock.id} (${layerBlock.blockType}) 在右列，位置: (${layerBlock.position.x}, ${layerBlock.position.y}), 高度: ${layerHeight}px`);
            }
            
            rightColumnY = layerY + 30; // 更新右列位置
            console.log(`✅ [AST解析器] 链式调用解析完成：ggplot在左列，${chainBlocks.length - 1}个图层在右列，右列下一个位置: ${rightColumnY}px`);
          }
        }
      }
      // 🔄 特殊处理：for 循环（需要展开循环体）
      else if (node.type === 'call' && node.function_name === 'for') {
        console.log('🔄 [AST解析器] 检测到 for 循环，展开循环体');
        
        // 创建 for 循环控制积木
        const forBlock = astNodeToBlock(node, blockIdCounter);
        if (forBlock) {
          forBlock.position.x = LEFT_COLUMN_X;
          forBlock.position.y = leftColumnY;
          
          // 🔧 初始化 children 对象
          forBlock.children = { body: [] };
          
          blocks.push(forBlock);
          
          const forBlockHeight = estimateBlockHeight(forBlock);
          leftColumnY += forBlockHeight + VERTICAL_SPACING;
          console.log(`  📏 for 循环积木 ${forBlock.id} 位置: (${forBlock.position.x}, ${forBlock.position.y}), 高度: ${forBlockHeight}px`);
          
          // 展开循环体
          const loopBody = node.arguments?._pos_3;
          if (loopBody) {
            console.log('  📦 [AST解析器] 开始展开 for 循环体');
            const bodyBlocks = flattenCodeBlock(loopBody, blockIdCounter);
            
            console.log(`  📦 [AST解析器] 循环体包含 ${bodyBlocks.length} 个积木`);
            
            // 将循环体内的积木添加到容器内
            for (const bodyBlock of bodyBlocks) {
              // 🔍 只将直接子积木添加到 children.body（不包括孙积木）
              if (!bodyBlock.parentId) {
                bodyBlock.parentId = forBlock.id;
                bodyBlock.slotName = 'body';
                forBlock.children!.body.push(bodyBlock.id);
              }
              
              // 📌 所有积木（包括孙积木）都要添加到 blocks 数组中
              
              // 位置设置为相对于父积木的偏移（在渲染时会被调整）
              bodyBlock.position.x = LEFT_COLUMN_X + 30; // 缩进
              bodyBlock.position.y = leftColumnY;
              
              blocks.push(bodyBlock);
              
              const bodyBlockHeight = estimateBlockHeight(bodyBlock);
              leftColumnY += bodyBlockHeight + VERTICAL_SPACING;
              console.log(`  📏 循环体积木 ${bodyBlock.id} (${bodyBlock.blockType}) 位置: (${bodyBlock.position.x}, ${bodyBlock.position.y}), 高度: ${bodyBlockHeight}px, 父积木: ${bodyBlock.parentId || '无'}`);
            }
            
            console.log(`✅ [AST解析器] for 循环 ${forBlock.id} 包含 ${forBlock.children!.body.length} 个直接子积木（共 ${bodyBlocks.length} 个积木含孙积木）:`, forBlock.children!.body);
          }
        }
      }
      // ❓ 特殊处理：if 语句（需要展开 then 和 else 分支）
      else if (node.type === 'call' && node.function_name === 'if') {
        console.log('❓ [AST解析器] 检测到 if 语句，展开 then/else 分支');
        
        // 创建 if 控制积木
        const ifBlock = astNodeToBlock(node, blockIdCounter);
        if (ifBlock) {
          ifBlock.position.x = LEFT_COLUMN_X;
          ifBlock.position.y = leftColumnY;
          
          // 🔧 初始化 children 对象
          ifBlock.children = { then: [], else: [] };
          
          blocks.push(ifBlock);
          
          const ifBlockHeight = estimateBlockHeight(ifBlock);
          leftColumnY += ifBlockHeight + VERTICAL_SPACING;
          console.log(`  📏 if 语句积木 ${ifBlock.id} 位置: (${ifBlock.position.x}, ${ifBlock.position.y}), 高度: ${ifBlockHeight}px`);
          
          // 展开 then 分支 (_pos_2)
          const thenBody = node.arguments?._pos_2;
          if (thenBody) {
            console.log('  ✅ [AST解析器] 开始展开 if-then 分支');
            const thenBlocks = flattenCodeBlock(thenBody, blockIdCounter);
            
            console.log(`  ✅ [AST解析器] then 分支包含 ${thenBlocks.length} 个积木`);
            
            // 将 then 分支内的积木添加到容器内
            for (const thenBlock of thenBlocks) {
              // 🔍 只将直接子积木添加到 children.then（不包括孙积木）
              if (!thenBlock.parentId) {
                thenBlock.parentId = ifBlock.id;
                thenBlock.slotName = 'then';
                ifBlock.children!.then.push(thenBlock.id);
              }
              
              // 📌 所有积木（包括孙积木）都要添加到 blocks 数组中
              
              // 位置设置为相对于父积木的偏移（在渲染时会被调整）
              thenBlock.position.x = LEFT_COLUMN_X + 30; // 缩进
              thenBlock.position.y = leftColumnY;
              
              blocks.push(thenBlock);
              
              const thenBlockHeight = estimateBlockHeight(thenBlock);
              leftColumnY += thenBlockHeight + VERTICAL_SPACING;
              console.log(`  📏 then 分支积木 ${thenBlock.id} (${thenBlock.blockType}) 位置: (${thenBlock.position.x}, ${thenBlock.position.y}), 高度: ${thenBlockHeight}px, 父积木: ${thenBlock.parentId || '无'}`);
            }
            
            console.log(`✅ [AST解析器] if-then 分支 ${ifBlock.id} 包含 ${ifBlock.children!.then.length} 个直接子积木（共 ${thenBlocks.length} 个积木含孙积木）:`, ifBlock.children!.then);
          }
          
          // 展开 else 分支 (_pos_3)，如果存在
          const elseBody = node.arguments?._pos_3;
          if (elseBody) {
            console.log('  ❎ [AST解析器] 开始展开 if-else 分支');
            const elseBlocks = flattenCodeBlock(elseBody, blockIdCounter);
            
            console.log(`  ❎ [AST解析器] else 分支包含 ${elseBlocks.length} 个积木`);
            
            // 将 else 分支内的积木添加到容器内
            for (const elseBlock of elseBlocks) {
              // 🔍 只将直接子积木添加到 children.else（不包括孙积木）
              if (!elseBlock.parentId) {
                elseBlock.parentId = ifBlock.id;
                elseBlock.slotName = 'else';
                ifBlock.children!.else.push(elseBlock.id);
              }
              
              // 📌 所有积木（包括孙积木）都要添加到 blocks 数组中
              
              // 位置设置为相对于父积木的偏移（在渲染时会被调整）
              elseBlock.position.x = LEFT_COLUMN_X + 30; // 缩进
              elseBlock.position.y = leftColumnY;
              
              blocks.push(elseBlock);
              
              const elseBlockHeight = estimateBlockHeight(elseBlock);
              leftColumnY += elseBlockHeight + VERTICAL_SPACING;
              console.log(`  📏 else 分支积木 ${elseBlock.id} (${elseBlock.blockType}) 位置: (${elseBlock.position.x}, ${elseBlock.position.y}), 高度: ${elseBlockHeight}px, 父积木: ${elseBlock.parentId || '无'}`);
            }
            
            console.log(`✅ [AST解析器] if-else 分支 ${ifBlock.id} 包含 ${ifBlock.children!.else.length} 个直接子积木（共 ${elseBlocks.length} 个积木含孙积木）:`, ifBlock.children!.else);
          }
        }
      }
      else {
        // 普通单个积木放在左列
        const block = astNodeToBlock(node, blockIdCounter);
        if (block) {
          block.position.x = LEFT_COLUMN_X;
          block.position.y = leftColumnY;
          blocks.push(block);
          console.log(`✅ [AST解析器] 成功创建积木:`, block.blockType, '参数:', block.params);
          
          // 根据积木的实际高度动态调整间距
          const blockHeight = estimateBlockHeight(block);
          leftColumnY += blockHeight + VERTICAL_SPACING;
          console.log(`  📏 积木 ${block.id} 位置: (${block.position.x}, ${block.position.y}), 高度: ${blockHeight}px, 左列下一个位置: ${leftColumnY}px`);
        } else {
          console.warn(`⚠️ [AST解析器] 节点 ${i + 1} 无法转换为积木`);
        }
      }
    }
    
    // 🔗 设置实线连接（执行顺序）
    console.log(`\n🔗 [AST解析器] 设置实线连接（执行顺序）...`);
    
    // 先标记哪些积木是 ggplot 链的一部分
    const ggplotChainBlockIds = new Set<string>();
    const ggplotChainFirstBlocks = new Set<string>();
    
    blocks.forEach(block => {
      if (block.ggplotConnections && block.ggplotConnections.length > 0) {
        // 这是链的第一个积木
        ggplotChainFirstBlocks.add(block.id);
        // 标记链中的所有积木（包括第一个）
        ggplotChainBlockIds.add(block.id);
        block.ggplotConnections.forEach(connId => {
          ggplotChainBlockIds.add(connId);
        });
      }
    });
    
    console.log(`  📍 ggplot链的第一个积木: [${Array.from(ggplotChainFirstBlocks).join(', ')}]`);
    console.log(`  📍 ggplot链的所有积木: [${Array.from(ggplotChainBlockIds).join(', ')}]`);
    
    // 构建执行顺序连接：
    // 1. 普通积木之间用实线连接
    // 2. 普通积木可以连接到 ggplot 链的第一个积木
    // 3. ggplot 链的第一个积木可以连接到下一个普通积木或下一个链
    // 4. ggplot 链内部的积木（非首）不参与实线连接
    
    let lastExecutableBlock: BlockInstance | null = null;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // 🚫 跳过子积木（它们通过 children 属性嵌套在父积木内部，不应参与顶层的执行顺序连接）
      if (block.parentId !== undefined) {
        console.log(`  ⏭️ 跳过子积木: ${block.id} (${block.blockType})，父积木: ${block.parentId}`);
        continue;
      }
      
      const isChainFirst = ggplotChainFirstBlocks.has(block.id);
      const isInChain = ggplotChainBlockIds.has(block.id);
      const isChainMember = isInChain && !isChainFirst;
      
      if (isChainMember) {
        // 这是链中的非首积木，跳过（不参与执行顺序的实线连接）
        console.log(`  ⏭️ 跳过链中积木: ${block.id} (${block.blockType})`);
        continue;
      }
      
      // 这是普通积木或链的第一个积木，应该参与执行顺序
      if (lastExecutableBlock) {
        block.connections.input = lastExecutableBlock.id;
        lastExecutableBlock.connections.output = block.id;
        console.log(`  ➡️ 实线连接（执行顺序）: ${lastExecutableBlock.id} (${lastExecutableBlock.blockType}) -> ${block.id} (${block.blockType})`);
      }
      
      lastExecutableBlock = block;
    }
    
    // 🎨 最后调整布局，确保没有重叠
    console.log(`\n🎨 [AST解析器] 调整布局以避免重叠...`);
    adjustLayoutToAvoidOverlaps(blocks);
    
    console.log(`\n🎉 [AST解析器] 解析完成！共创建 ${blocks.length} 个积木块`);
    return blocks;
  } catch (error) {
    console.error('❌ [AST解析器] 解析失败:', error);
    console.error('❌ [AST解析器] 错误堆栈:', error instanceof Error ? error.stack : '');
    return blocks;
  }
}

/**
 * 验证解析结果
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

