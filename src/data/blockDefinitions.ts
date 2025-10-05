import { BlockDefinition, BlockType, BlockCategory } from '../types/blocks';

// 积木定义库 - 按照 ggplot2 图层语法组织
export const blockDefinitions: BlockDefinition[] = [
  // ========== 0. R语言基础语句 (Base) ==========
  {
    id: 'start',
    type: BlockType.START,
    category: BlockCategory.BASE,
    label: '🚀 开始',
    description: '程序开始（主程序入口）',
    color: '#22c55e',
    params: [],
    rTemplate: '' // START积木不生成任何代码，只作为逻辑入口
  },
  
  {
    id: 'library',
    type: BlockType.LIBRARY,
    category: BlockCategory.BASE,
    label: 'library()',
    description: '加载R包',
    color: '#ef4444',
    params: [
      {
        name: 'package',
        type: 'text',
        label: '包名',
        defaultValue: 'ggplot2',
        required: true
      }
    ],
    rTemplate: 'library({{package}})'
  },
  
  {
    id: 'print',
    type: BlockType.PRINT,
    category: BlockCategory.BASE,
    label: 'print()',
    description: '打印输出',
    color: '#ef4444',
    params: [
      {
        name: 'value',
        type: 'text',
        label: '输出内容',
        defaultValue: 'data',
        required: true
      }
    ],
    rTemplate: 'print({{value}})'
  },
  
  {
    id: 'assign',
    type: BlockType.ASSIGN,
    category: BlockCategory.BASE,
    label: '<- 赋值',
    description: '变量赋值',
    color: '#ef4444',
    params: [
      {
        name: 'variable',
        type: 'text',
        label: '变量名',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'value',
        type: 'text',
        label: '赋值内容',
        defaultValue: '10',
        required: true
      }
    ],
    rTemplate: '{{#if variable}}{{variable}} <- {{/if}}{{value}}'
  },
  
  {
    id: 'for_loop',
    type: BlockType.FOR_LOOP,
    category: BlockCategory.BASE,
    label: 'for循环',
    description: 'for循环语句（C型容器）',
    color: '#ef4444',
    isContainer: true,
    params: [
      {
        name: 'var',
        type: 'text',
        label: '循环变量',
        defaultValue: 'i',
        required: true
      },
      {
        name: 'range',
        type: 'text',
        label: '遍历',
        defaultValue: '1:10',
        required: true
      }
    ],
    slots: [
      {
        name: 'body',
        label: '循环执行',
        allowMultiple: true
      }
    ],
    rTemplate: 'for ({{var}} in {{range}}) {\n{{#each children.body}}{{this}}{{/each}}\n}'
  },
  
  {
    id: 'if_statement',
    type: BlockType.IF_STATEMENT,
    category: BlockCategory.BASE,
    label: 'if语句',
    description: '条件判断语句（C型容器）',
    color: '#ef4444',
    isContainer: true,
    params: [
      {
        name: 'condition',
        type: 'text',
        label: '如果',
        defaultValue: 'x > 0',
        required: true
      }
    ],
    slots: [
      {
        name: 'then',
        label: '那么执行',
        allowMultiple: true
      },
      {
        name: 'else',
        label: '否则执行',
        allowMultiple: true
      }
    ],
    rTemplate: 'if ({{condition}}) {\n{{#each children.then}}{{this}}{{/each}}{{#if children.else.length}}\n} else {\n{{#each children.else}}{{this}}{{/each}}{{/if}}\n}'
  },
  
  {
    id: 'function_call',
    type: BlockType.FUNCTION_CALL,
    category: BlockCategory.BASE,
    label: '函数调用',
    description: '调用R函数',
    color: '#ef4444',
    params: [
      {
        name: 'function_name',
        type: 'text',
        label: '函数名',
        defaultValue: 'mean',
        required: true
      },
      {
        name: 'args',
        type: 'text',
        label: '函数参数',
        defaultValue: 'data$column',
        required: false
      }
    ],
    rTemplate: '{{function_name}}({{#if args}}{{args}}{{/if}})'
  },
  
  {
    id: 'comment',
    type: BlockType.COMMENT,
    category: BlockCategory.BASE,
    label: '# 注释',
    description: '代码注释',
    color: '#ef4444',
    params: [
      {
        name: 'text',
        type: 'text',
        label: '注释内容',
        defaultValue: '这是一行注释',
        required: true
      }
    ],
    rTemplate: '# {{text}}'
  },
  
  {
    id: 'custom_code',
    type: BlockType.CUSTOM_CODE,
    category: BlockCategory.BASE,
    label: '自定义代码',
    description: '自定义R代码片段',
    color: '#94a3b8',
    params: [
      {
        name: 'code',
        type: 'text',
        label: '代码内容',
        defaultValue: '',
        required: true
      }
    ],
    rTemplate: '{{code}}'
  },
  
  // ========== R基础函数 ==========
  {
    id: 'c_vector',
    type: BlockType.C_VECTOR,
    category: BlockCategory.BASE,
    label: 'c()',
    description: '创建向量',
    color: '#f59e0b',
    params: [
      {
        name: 'elements',
        type: 'text',
        label: '元素',
        defaultValue: '1, 2, 3',
        required: true
      }
    ],
    rTemplate: 'c({{elements}})'
  },
  
  {
    id: 'seq',
    type: BlockType.SEQ,
    category: BlockCategory.BASE,
    label: 'seq()',
    description: '生成序列',
    color: '#f59e0b',
    params: [
      {
        name: 'from',
        type: 'number',
        label: '从',
        defaultValue: 1,
        required: false
      },
      {
        name: 'to',
        type: 'number',
        label: '到',
        defaultValue: 10,
        required: false
      },
      {
        name: 'by',
        type: 'number',
        label: '步长',
        required: false
      },
      {
        name: 'length_out',
        type: 'number',
        label: '长度',
        required: false
      }
    ],
    rTemplate: 'seq({{#if from}}{{from}}{{/if}}{{#if to}}, {{to}}{{/if}}{{#if by}}, by={{by}}{{/if}}{{#if length_out}}, length.out={{length_out}}{{/if}})'
  },
  
  {
    id: 'rep',
    type: BlockType.REP,
    category: BlockCategory.BASE,
    label: 'rep()',
    description: '重复元素',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '元素',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'times',
        type: 'number',
        label: '重复次数',
        required: false
      },
      {
        name: 'each',
        type: 'number',
        label: '每个重复',
        required: false
      }
    ],
    rTemplate: 'rep({{x}}{{#if times}}, {{times}}{{/if}}{{#if each}}, each={{each}}{{/if}})'
  },
  
  {
    id: 'paste',
    type: BlockType.PASTE,
    category: BlockCategory.BASE,
    label: 'paste()',
    description: '字符串连接',
    color: '#f59e0b',
    params: [
      {
        name: 'elements',
        type: 'text',
        label: '元素',
        defaultValue: '"Hello", "World"',
        required: true
      },
      {
        name: 'sep',
        type: 'text',
        label: '分隔符',
        defaultValue: ' ',
        required: false
      }
    ],
    rTemplate: 'paste({{elements}}{{#if sep}}, sep={{sep}}{{/if}})'
  },
  
  {
    id: 'factor',
    type: BlockType.FACTOR,
    category: BlockCategory.BASE,
    label: 'factor()',
    description: '创建因子',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'levels',
        type: 'text',
        label: '水平',
        required: false
      },
      {
        name: 'labels',
        type: 'text',
        label: '标签',
        required: false
      }
    ],
    rTemplate: 'factor({{x}}{{#if levels}}, levels={{levels}}{{/if}}{{#if labels}}, labels={{labels}}{{/if}})'
  },
  
  {
    id: 'as_factor',
    type: BlockType.AS_FACTOR,
    category: BlockCategory.BASE,
    label: 'as.factor()',
    description: '转换为因子',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      }
    ],
    rTemplate: 'as.factor({{x}})'
  },
  
  {
    id: 'ifelse',
    type: BlockType.IFELSE,
    category: BlockCategory.BASE,
    label: 'ifelse()',
    description: '条件表达式',
    color: '#f59e0b',
    params: [
      {
        name: 'test',
        type: 'text',
        label: '条件',
        defaultValue: 'x > 0',
        required: true
      },
      {
        name: 'yes',
        type: 'text',
        label: '真值',
        defaultValue: '1',
        required: true
      },
      {
        name: 'no',
        type: 'text',
        label: '假值',
        defaultValue: '0',
        required: true
      }
    ],
    rTemplate: 'ifelse({{test}}, {{yes}}, {{no}})'
  },
  
  {
    id: 'data_frame',
    type: BlockType.DATA_FRAME,
    category: BlockCategory.BASE,
    label: 'data.frame()',
    description: '创建数据框',
    color: '#f59e0b',
    params: [
      {
        name: 'columns',
        type: 'text',
        label: '列定义',
        defaultValue: 'x=1:10, y=rnorm(10)',
        required: true
      }
    ],
    rTemplate: 'data.frame({{columns}})'
  },
  
  {
    id: 'matrix',
    type: BlockType.MATRIX,
    category: BlockCategory.BASE,
    label: 'matrix()',
    description: '创建矩阵',
    color: '#f59e0b',
    params: [
      {
        name: 'data',
        type: 'text',
        label: '数据',
        defaultValue: 'NA',
        required: true
      },
      {
        name: 'nrow',
        type: 'number',
        label: '行数',
        required: false
      },
      {
        name: 'ncol',
        type: 'number',
        label: '列数',
        required: true
      }
    ],
    rTemplate: 'matrix({{data}}{{#if nrow}}, {{nrow}}{{/if}}, {{ncol}})'
  },
  
  {
    id: 'rbind',
    type: BlockType.RBIND,
    category: BlockCategory.BASE,
    label: 'rbind()',
    description: '按行合并',
    color: '#f59e0b',
    params: [
      {
        name: 'objects',
        type: 'text',
        label: '对象',
        defaultValue: 'df1, df2',
        required: true
      }
    ],
    rTemplate: 'rbind({{objects}})'
  },
  
  {
    id: 'cbind',
    type: BlockType.CBIND,
    category: BlockCategory.BASE,
    label: 'cbind()',
    description: '按列合并',
    color: '#f59e0b',
    params: [
      {
        name: 'objects',
        type: 'text',
        label: '对象',
        defaultValue: 'vec1, vec2',
        required: true
      }
    ],
    rTemplate: 'cbind({{objects}})'
  },
  
  {
    id: 'nrow',
    type: BlockType.NROW,
    category: BlockCategory.BASE,
    label: 'nrow()',
    description: '获取行数',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'data',
        required: true
      }
    ],
    rTemplate: 'nrow({{x}})'
  },
  
  {
    id: 'ncol',
    type: BlockType.NCOL,
    category: BlockCategory.BASE,
    label: 'ncol()',
    description: '获取列数',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'data',
        required: true
      }
    ],
    rTemplate: 'ncol({{x}})'
  },
  
  {
    id: 'colnames',
    type: BlockType.COLNAMES,
    category: BlockCategory.BASE,
    label: 'colnames()',
    description: '获取/设置列名',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'data',
        required: true
      }
    ],
    rTemplate: 'colnames({{x}})'
  },
  
  {
    id: 'rownames',
    type: BlockType.ROWNAMES,
    category: BlockCategory.BASE,
    label: 'rownames()',
    description: '获取/设置行名',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'data',
        required: true
      }
    ],
    rTemplate: 'rownames({{x}})'
  },
  
  {
    id: 'levels',
    type: BlockType.LEVELS,
    category: BlockCategory.BASE,
    label: 'levels()',
    description: '获取因子水平',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '因子',
        defaultValue: 'data$group',
        required: true
      }
    ],
    rTemplate: 'levels({{x}})'
  },
  
  {
    id: 'nlevels',
    type: BlockType.NLEVELS,
    category: BlockCategory.BASE,
    label: 'nlevels()',
    description: '获取因子水平数',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '因子',
        defaultValue: 'data$group',
        required: true
      }
    ],
    rTemplate: 'nlevels({{x}})'
  },
  
  {
    id: 'sum',
    type: BlockType.SUM,
    category: BlockCategory.BASE,
    label: 'sum()',
    description: '求和',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'sum({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'mean',
    type: BlockType.MEAN,
    category: BlockCategory.BASE,
    label: 'mean()',
    description: '平均值',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'mean({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'min',
    type: BlockType.MIN,
    category: BlockCategory.BASE,
    label: 'min()',
    description: '最小值',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'min({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'max',
    type: BlockType.MAX,
    category: BlockCategory.BASE,
    label: 'max()',
    description: '最大值',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'max({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'median',
    type: BlockType.MEDIAN,
    category: BlockCategory.BASE,
    label: 'median()',
    description: '中位数',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'median({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'sd',
    type: BlockType.SD,
    category: BlockCategory.BASE,
    label: 'sd()',
    description: '标准差',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'sd({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'var',
    type: BlockType.VAR,
    category: BlockCategory.BASE,
    label: 'var()',
    description: '方差',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      },
      {
        name: 'na_rm',
        type: 'boolean',
        label: '移除NA',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'var({{x}}{{#if na_rm}}, na.rm=TRUE{{/if}})'
  },
  
  {
    id: 'length',
    type: BlockType.LENGTH,
    category: BlockCategory.BASE,
    label: 'length()',
    description: '长度',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: 'x',
        required: true
      }
    ],
    rTemplate: 'length({{x}})'
  },
  
  {
    id: 'sample',
    type: BlockType.SAMPLE,
    category: BlockCategory.BASE,
    label: 'sample()',
    description: '随机抽样',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: '数据',
        defaultValue: '1:10',
        required: true
      },
      {
        name: 'size',
        type: 'number',
        label: '样本量',
        required: true
      },
      {
        name: 'replace',
        type: 'boolean',
        label: '有放回',
        defaultValue: false,
        required: false
      }
    ],
    rTemplate: 'sample({{x}}, {{size}}{{#if replace}}, replace=TRUE{{/if}})'
  },
  
  // ========== 1. 数据层 (Data) ==========
  {
    id: 'data_import',
    type: BlockType.DATA_IMPORT,
    category: BlockCategory.DATA,
    label: 'data <-',
    description: '数据赋值语句',
    color: '#3b82f6',
    params: [
      {
        name: 'source',
        type: 'select',
        label: '数据源',
        options: [
          { label: 'iris（鸢尾花数据集）', value: 'iris' },
          { label: 'mtcars（汽车性能数据）', value: 'mtcars' },
          { label: 'diamonds（钻石数据集）', value: 'diamonds' },
          { label: 'mpg（汽车燃油数据）', value: 'mpg' },
          { label: 'economics（经济数据）', value: 'economics' },
          { label: 'faithful（间歇泉数据）', value: 'faithful' }
        ],
        defaultValue: 'iris',
        required: true
      }
    ],
    rTemplate: 'data <- {{source}}'
  },
  
  // ========== 2. ggplot() 初始化 ==========
  {
    id: 'ggplot_init',
    type: BlockType.GGPLOT_INIT,
    category: BlockCategory.DATA,
    label: 'ggplot()',
    description: '创建 ggplot 对象',
    color: '#8b5cf6',
    params: [
      {
        name: 'data',
        type: 'text',
        label: '数据集名称',
        defaultValue: 'data',
        required: true
      },
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      }
    ],
    rTemplate: 'ggplot({{data}}{{#if mapping}}, {{mapping}}{{/if}})'
  },
  
  // ========== 3. aes() 美学映射 ==========
  {
    id: 'aes',
    type: BlockType.AES,
    category: BlockCategory.AES,
    label: 'aes()',
    description: '美学映射语句',
    color: '#f59e0b',
    params: [
      {
        name: 'x',
        type: 'text',
        label: 'x',
        required: false
      },
      {
        name: 'y',
        type: 'text',
        label: 'y',
        required: false
      },
      {
        name: 'color',
        type: 'text',
        label: 'color',
        required: false
      },
      {
        name: 'fill',
        type: 'text',
        label: 'fill',
        required: false
      },
      {
        name: 'size',
        type: 'text',
        label: 'size',
        required: false
      },
      {
        name: 'alpha',
        type: 'text',
        label: 'alpha',
        required: false
      },
      {
        name: 'shape',
        type: 'text',
        label: 'shape',
        required: false
      },
      {
        name: 'linetype',
        type: 'text',
        label: 'linetype',
        required: false
      }
    ],
    rTemplate: 'aes({{#if x}}x = {{x}}{{/if}}{{#if y}}{{#if x}}, {{/if}}y = {{y}}{{/if}}{{#if color}}, color = {{color}}{{/if}}{{#if fill}}, fill = {{fill}}{{/if}}{{#if size}}, size = {{size}}{{/if}}{{#if alpha}}, alpha = {{alpha}}{{/if}}{{#if shape}}, shape = {{shape}}{{/if}}{{#if linetype}}, linetype = {{linetype}}{{/if}})'
  },
  
  // ========== 4. 几何对象 (Geoms) - 基础语句 ==========
  {
    id: 'geom_point',
    type: BlockType.GEOM_POINT,
    category: BlockCategory.GEOM,
    label: 'geom_point()',
    description: '点几何对象',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'size',
        type: 'text',
        label: 'size',
        required: false
      },
      {
        name: 'alpha',
        type: 'text',
        label: 'alpha',
        required: false
      },
      {
        name: 'color',
        type: 'text',
        label: 'color',
        required: false
      },
      {
        name: 'shape',
        type: 'text',
        label: 'shape',
        required: false
      }
    ],
    rTemplate: 'geom_point({{#if mapping}}mapping = {{mapping}}, {{/if}}{{#if size}}size = {{size}}, {{/if}}{{#if alpha}}alpha = {{alpha}}, {{/if}}{{#if color}}color = {{color}}, {{/if}}{{#if shape}}shape = {{shape}}, {{/if}})'
  },
  
  {
    id: 'geom_line',
    type: BlockType.GEOM_LINE,
    category: BlockCategory.GEOM,
    label: 'geom_line()',
    description: '线几何对象',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'linewidth',
        type: 'text',
        label: 'linewidth',
        required: false
      },
      {
        name: 'linetype',
        type: 'text',
        label: 'linetype',
        required: false
      },
      {
        name: 'color',
        type: 'text',
        label: 'color',
        required: false
      }
    ],
    rTemplate: 'geom_line({{#if mapping}}mapping = {{mapping}}{{/if}}{{#if linewidth}}{{#if mapping}}, {{/if}}linewidth = {{linewidth}}{{/if}}{{#if linetype}}, linetype = {{linetype}}{{/if}}{{#if color}}, color = {{color}}{{/if}})'
  },
  
  {
    id: 'geom_bar',
    type: BlockType.GEOM_BAR,
    category: BlockCategory.GEOM,
    label: 'geom_bar()',
    description: '柱状几何对象',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'stat',
        type: 'text',
        label: 'stat',
        defaultValue: 'count',
        required: false
      },
      {
        name: 'position',
        type: 'text',
        label: 'position',
        required: false
      },
      {
        name: 'alpha',
        type: 'text',
        label: 'alpha',
        required: false
      },
      {
        name: 'width',
        type: 'text',
        label: 'width',
        required: false
      }
    ],
    rTemplate: 'geom_bar({{#if mapping}}mapping = {{mapping}}{{/if}}{{#if stat}}{{#if mapping}}, {{/if}}stat = {{stat}}{{/if}}{{#if position}}, position = {{position}}{{/if}}{{#if alpha}}, alpha = {{alpha}}{{/if}}{{#if width}}, width = {{width}}{{/if}})'
  },
  
  {
    id: 'geom_col',
    type: BlockType.GEOM_COL,
    category: BlockCategory.GEOM,
    label: 'geom_col()',
    description: '柱形图 (需要 y 值)',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'position',
        type: 'text',
        label: 'position',
        required: false
      },
      {
        name: 'width',
        type: 'text',
        label: 'width',
        required: false
      }
    ],
    rTemplate: 'geom_col({{#if mapping}}mapping = {{mapping}}{{/if}}{{#if position}}{{#if mapping}}, {{/if}}position = {{position}}{{/if}}{{#if width}}, width = {{width}}{{/if}})'
  },
  
  {
    id: 'geom_histogram',
    type: BlockType.GEOM_HISTOGRAM,
    category: BlockCategory.GEOM,
    label: 'geom_histogram()',
    description: '直方图',
    color: '#ec4899',
    params: [
      {
        name: 'bins',
        type: 'text',
        label: 'bins',
        required: false
      },
      {
        name: 'binwidth',
        type: 'text',
        label: 'binwidth',
        required: false
      },
      {
        name: 'fill',
        type: 'text',
        label: 'fill',
        required: false
      }
    ],
    rTemplate: 'geom_histogram({{#if bins}}bins = {{bins}}{{/if}}{{#if binwidth}}{{#if bins}}, {{/if}}binwidth = {{binwidth}}{{/if}}{{#if fill}}, fill = {{fill}}{{/if}})'
  },
  
  {
    id: 'geom_boxplot',
    type: BlockType.GEOM_BOXPLOT,
    category: BlockCategory.GEOM,
    label: 'geom_boxplot()',
    description: '箱线图',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'width',
        type: 'text',
        label: 'width',
        required: false
      },
      {
        name: 'outlier_color',
        type: 'text',
        label: 'outlier.color',
        required: false
      }
    ],
    rTemplate: 'geom_boxplot({{#if mapping}}mapping = {{mapping}}{{/if}}{{#if width}}{{#if mapping}}, {{/if}}width = {{width}}{{/if}}{{#if outlier_color}}, outlier.color = {{outlier_color}}{{/if}})'
  },
  
  {
    id: 'geom_smooth',
    type: BlockType.GEOM_SMOOTH,
    category: BlockCategory.GEOM,
    label: 'geom_smooth()',
    description: '平滑趋势线',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'method',
        type: 'text',
        label: 'method',
        required: false
      },
      {
        name: 'se',
        type: 'text',
        label: 'se',
        defaultValue: 'TRUE',
        required: false
      },
      {
        name: 'level',
        type: 'text',
        label: 'level',
        required: false
      }
    ],
    rTemplate: 'geom_smooth({{#if mapping}}mapping = {{mapping}}, {{/if}}{{#if method}}method = {{method}}, {{/if}}{{#if se}}se = {{se}}, {{/if}}{{#if level}}level = {{level}}, {{/if}})'
  },
  
  {
    id: 'geom_text',
    type: BlockType.GEOM_TEXT,
    category: BlockCategory.GEOM,
    label: 'geom_text()',
    description: '文本标签',
    color: '#ec4899',
    params: [
      {
        name: 'data',
        type: 'text',
        label: 'data',
        required: false
      },
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping',
        required: false
      },
      {
        name: 'color',
        type: 'text',
        label: 'color',
        required: false
      },
      {
        name: 'fontface',
        type: 'text',
        label: 'fontface',
        required: false
      },
      {
        name: 'alpha',
        type: 'text',
        label: 'alpha',
        required: false
      },
      {
        name: 'size',
        type: 'text',
        label: 'size',
        required: false
      },
      {
        name: 'angle',
        type: 'text',
        label: 'angle',
        required: false
      },
      {
        name: 'vjust',
        type: 'text',
        label: 'vjust',
        required: false
      },
      {
        name: 'hjust',
        type: 'text',
        label: 'hjust',
        required: false
      },
      {
        name: 'inherit_aes',
        type: 'text',
        label: 'inherit.aes',
        required: false
      },
      {
        name: 'stat',
        type: 'text',
        label: 'stat',
        required: false
      }
    ],
    rTemplate: 'geom_text({{#if stat}}stat = {{stat}}{{/if}}{{#if data}}{{#if stat}}, {{/if}}data = {{data}}{{/if}}{{#if mapping}}{{#if data}}, {{/if}}{{#if stat}}, {{/if}}mapping = {{mapping}}{{/if}}{{#if color}}, color = {{color}}{{/if}}{{#if fontface}}, fontface = {{fontface}}{{/if}}{{#if alpha}}, alpha = {{alpha}}{{/if}}{{#if size}}, size = {{size}}{{/if}}{{#if angle}}, angle = {{angle}}{{/if}}{{#if vjust}}, vjust = {{vjust}}{{/if}}{{#if hjust}}, hjust = {{hjust}}{{/if}}{{#if inherit_aes}}, inherit.aes = {{inherit_aes}}{{/if}})'
  },
  
  {
    id: 'geom_area',
    type: BlockType.GEOM_AREA,
    category: BlockCategory.GEOM,
    label: 'geom_area()',
    description: '面积图',
    color: '#ec4899',
    params: [
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping (可选)',
        required: false
      },
      {
        name: 'alpha',
        type: 'text',
        label: 'alpha',
        required: false
      },
      {
        name: 'fill',
        type: 'text',
        label: 'fill',
        required: false
      }
    ],
    rTemplate: 'geom_area({{#if mapping}}mapping = {{mapping}}{{/if}}{{#if alpha}}{{#if mapping}}, {{/if}}alpha = {{alpha}}{{/if}}{{#if fill}}, fill = {{fill}}{{/if}})'
  },
  
  // ========== 5. 标度 (Scales) ==========
  {
    id: 'scale_x_continuous',
    type: BlockType.SCALE_X_CONTINUOUS,
    category: BlockCategory.SCALE,
    label: 'scale_x_continuous()',
    description: 'X 轴连续标度',
    color: '#06b6d4',
    params: [
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      },
      {
        name: 'limits',
        type: 'text',
        label: 'limits',
        required: false
      },
      {
        name: 'breaks',
        type: 'text',
        label: 'breaks',
        required: false
      }
    ],
    rTemplate: 'scale_x_continuous({{#if name}}name = {{name}}{{/if}}{{#if limits}}, limits = {{limits}}{{/if}}{{#if breaks}}, breaks = {{breaks}}{{/if}})'
  },
  
  {
    id: 'scale_y_continuous',
    type: BlockType.SCALE_Y_CONTINUOUS,
    category: BlockCategory.SCALE,
    label: 'scale_y_continuous()',
    description: 'Y 轴连续标度',
    color: '#06b6d4',
    params: [
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      },
      {
        name: 'limits',
        type: 'text',
        label: 'limits',
        required: false
      },
      {
        name: 'breaks',
        type: 'text',
        label: 'breaks',
        required: false
      }
    ],
    rTemplate: 'scale_y_continuous({{#if name}}name = {{name}}{{/if}}{{#if limits}}, limits = {{limits}}{{/if}}{{#if breaks}}, breaks = {{breaks}}{{/if}})'
  },
  
  {
    id: 'scale_color_manual',
    type: BlockType.SCALE_COLOR_MANUAL,
    category: BlockCategory.SCALE,
    label: 'scale_color_manual()',
    description: '手动设置颜色',
    color: '#06b6d4',
    params: [
      {
        name: 'values',
        type: 'text',
        label: 'values',
        required: false
      },
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      }
    ],
    rTemplate: 'scale_color_manual({{#if values}}values = {{values}}{{/if}}{{#if name}}, name = {{name}}{{/if}})'
  },
  
  {
    id: 'scale_fill_manual',
    type: BlockType.SCALE_FILL_MANUAL,
    category: BlockCategory.SCALE,
    label: 'scale_fill_manual()',
    description: '手动设置填充色',
    color: '#06b6d4',
    params: [
      {
        name: 'values',
        type: 'text',
        label: 'values',
        required: false
      },
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      },
      {
        name: 'guide',
        type: 'text',
        label: 'guide',
        required: false
      }
    ],
    rTemplate: 'scale_fill_manual({{#if values}}values = {{values}}{{/if}}{{#if name}}, name = {{name}}{{/if}}{{#if guide}}, guide = {{guide}}{{/if}})'
  },
  
  {
    id: 'scale_color_brewer',
    type: BlockType.SCALE_COLOR_BREWER,
    category: BlockCategory.SCALE,
    label: 'scale_color_brewer()',
    description: 'ColorBrewer 调色板',
    color: '#06b6d4',
    params: [
      {
        name: 'palette',
        type: 'text',
        label: 'palette',
        required: false
      },
      {
        name: 'direction',
        type: 'text',
        label: 'direction',
        required: false
      },
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      }
    ],
    rTemplate: 'scale_color_brewer({{#if palette}}palette = {{palette}}{{/if}}{{#if direction}}, direction = {{direction}}{{/if}}{{#if name}}, name = {{name}}{{/if}})'
  },
  
  {
    id: 'scale_fill_brewer',
    type: BlockType.SCALE_FILL_BREWER,
    category: BlockCategory.SCALE,
    label: 'scale_fill_brewer()',
    description: 'ColorBrewer 填充调色板',
    color: '#06b6d4',
    params: [
      {
        name: 'palette',
        type: 'text',
        label: 'palette',
        required: false
      },
      {
        name: 'direction',
        type: 'text',
        label: 'direction',
        required: false
      },
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      }
    ],
    rTemplate: 'scale_fill_brewer({{#if palette}}palette = {{palette}}{{/if}}{{#if direction}}, direction = {{direction}}{{/if}}{{#if name}}, name = {{name}}{{/if}})'
  },
  
  {
    id: 'scale_fill_gradient',
    type: BlockType.SCALE_FILL_GRADIENT,
    category: BlockCategory.SCALE,
    label: 'scale_fill_gradient()',
    description: '双色渐变',
    color: '#06b6d4',
    params: [
      {
        name: 'low',
        type: 'text',
        label: 'low',
        required: false
      },
      {
        name: 'high',
        type: 'text',
        label: 'high',
        required: false
      }
    ],
    rTemplate: 'scale_fill_gradient({{#if low}}low = {{low}}{{/if}}{{#if high}}, high = {{high}}{{/if}})'
  },
  
  // ========== 6. 坐标系 (Coordinates) ==========
  {
    id: 'coord_flip',
    type: BlockType.COORD_FLIP,
    category: BlockCategory.COORD,
    label: 'coord_flip()',
    description: '翻转坐标轴',
    color: '#6366f1',
    params: [],
    rTemplate: 'coord_flip()'
  },
  
  {
    id: 'coord_cartesian',
    type: BlockType.COORD_CARTESIAN,
    category: BlockCategory.COORD,
    label: 'coord_cartesian()',
    description: '笛卡尔坐标系',
    color: '#6366f1',
    params: [
      {
        name: 'xlim',
        type: 'text',
        label: 'xlim',
        required: false
      },
      {
        name: 'ylim',
        type: 'text',
        label: 'ylim',
        required: false
      }
    ],
    rTemplate: 'coord_cartesian({{#if xlim}}xlim = {{xlim}}{{/if}}{{#if ylim}}, ylim = {{ylim}}{{/if}})'
  },
  
  {
    id: 'coord_polar',
    type: BlockType.COORD_POLAR,
    category: BlockCategory.COORD,
    label: 'coord_polar()',
    description: '极坐标系',
    color: '#6366f1',
    params: [
      {
        name: 'theta',
        type: 'text',
        label: 'theta',
        defaultValue: 'x',
        required: false
      }
    ],
    rTemplate: 'coord_polar({{#if theta}}theta = {{theta}}{{/if}})'
  },
  
  // ========== 7. 分面 (Facets) ==========
  {
    id: 'facet_wrap',
    type: BlockType.FACET_WRAP,
    category: BlockCategory.FACET,
    label: 'facet_wrap()',
    description: '单变量分面',
    color: '#8b5cf6',
    params: [
      {
        name: 'facets',
        type: 'text',
        label: 'facets (如 ~Species)',
        required: false
      },
      {
        name: 'ncol',
        type: 'text',
        label: 'ncol',
        required: false
      },
      {
        name: 'nrow',
        type: 'text',
        label: 'nrow',
        required: false
      }
    ],
    rTemplate: 'facet_wrap({{#if facets}}{{facets}}{{/if}}{{#if ncol}}, ncol = {{ncol}}{{/if}}{{#if nrow}}, nrow = {{nrow}}{{/if}})'
  },
  
  {
    id: 'facet_grid',
    type: BlockType.FACET_GRID,
    category: BlockCategory.FACET,
    label: 'facet_grid()',
    description: '双变量分面',
    color: '#8b5cf6',
    params: [
      {
        name: 'rows',
        type: 'text',
        label: 'rows',
        required: false
      },
      {
        name: 'cols',
        type: 'text',
        label: 'cols',
        required: false
      },
      {
        name: 'scales',
        type: 'text',
        label: 'scales',
        required: false
      }
    ],
    rTemplate: 'facet_grid({{#if rows}}rows = vars({{rows}}){{/if}}{{#if cols}}{{#if rows}}, {{/if}}cols = vars({{cols}}){{/if}}{{#if scales}}, scales = {{scales}}{{/if}})'
  },
  
  // ========== 8. 统计变换 (Stats) ==========
  {
    id: 'stat_summary',
    type: BlockType.STAT_SUMMARY,
    category: BlockCategory.STAT,
    label: 'stat_summary()',
    description: '统计汇总',
    color: '#14b8a6',
    params: [
      {
        name: 'fun',
        type: 'text',
        label: 'fun',
        required: false
      },
      {
        name: 'geom',
        type: 'text',
        label: 'geom',
        required: false
      }
    ],
    rTemplate: 'stat_summary({{#if fun}}fun = {{fun}}{{/if}}{{#if geom}}, geom = {{geom}}{{/if}})'
  },
  
  {
    id: 'stat_smooth',
    type: BlockType.STAT_SMOOTH,
    category: BlockCategory.STAT,
    label: 'stat_smooth()',
    description: '平滑统计',
    color: '#14b8a6',
    params: [
      {
        name: 'method',
        type: 'text',
        label: 'method',
        required: false
      },
      {
        name: 'formula',
        type: 'text',
        label: 'formula',
        required: false
      }
    ],
    rTemplate: 'stat_smooth({{#if method}}method = {{method}}{{/if}}{{#if formula}}, formula = {{formula}}{{/if}})'
  },
  
  // ========== 9. 标签 (Labels) ==========
  {
    id: 'labs',
    type: BlockType.LABS,
    category: BlockCategory.LABS,
    label: 'labs()',
    description: '图表标签',
    color: '#f59e0b',
    params: [
      {
        name: 'title',
        type: 'text',
        label: 'title',
        required: false
      },
      {
        name: 'subtitle',
        type: 'text',
        label: 'subtitle',
        required: false
      },
      {
        name: 'x',
        type: 'text',
        label: 'x',
        required: false
      },
      {
        name: 'y',
        type: 'text',
        label: 'y',
        required: false
      },
      {
        name: 'fill',
        type: 'text',
        label: 'fill',
        required: false
      },
      {
        name: 'color',
        type: 'text',
        label: 'color',
        required: false
      },
      {
        name: 'caption',
        type: 'text',
        label: 'caption',
        required: false
      }
    ],
    rTemplate: 'labs({{#if title}}title = {{title}}{{/if}}{{#if subtitle}}, subtitle = {{subtitle}}{{/if}}{{#if x}}, x = {{x}}{{/if}}{{#if y}}, y = {{y}}{{/if}}{{#if fill}}, fill = {{fill}}{{/if}}{{#if color}}, color = {{color}}{{/if}}{{#if caption}}, caption = {{caption}}{{/if}})'
  },
  
  {
    id: 'ggtitle',
    type: BlockType.GGTITLE,
    category: BlockCategory.LABS,
    label: 'ggtitle()',
    description: '图表标题',
    color: '#f59e0b',
    params: [
      {
        name: 'label',
        type: 'text',
        label: 'label',
        required: false
      },
      {
        name: 'subtitle',
        type: 'text',
        label: 'subtitle',
        required: false
      }
    ],
    rTemplate: 'ggtitle({{#if label}}{{label}}{{/if}}{{#if subtitle}}, subtitle = {{subtitle}}{{/if}})'
  },
  
  {
    id: 'xlab',
    type: BlockType.XLAB,
    category: BlockCategory.LABS,
    label: 'xlab()',
    description: 'X 轴标签',
    color: '#f59e0b',
    params: [
      {
        name: 'label',
        type: 'text',
        label: 'label',
        required: false
      }
    ],
    rTemplate: 'xlab({{#if label}}{{label}}{{/if}})'
  },
  
  {
    id: 'ylab',
    type: BlockType.YLAB,
    category: BlockCategory.LABS,
    label: 'ylab()',
    description: 'Y 轴标签',
    color: '#f59e0b',
    params: [
      {
        name: 'label',
        type: 'text',
        label: 'label',
        required: false
      }
    ],
    rTemplate: 'ylab({{#if label}}{{label}}{{/if}})'
  },
  
  // ========== 10. 主题 (Themes) ==========
  {
    id: 'theme_minimal',
    type: BlockType.THEME_MINIMAL,
    category: BlockCategory.THEME,
    label: 'theme_minimal()',
    description: '极简主题',
    color: '#10b981',
    params: [
      { name: 'args', type: 'text', label: '参数', required: false }
    ],
    rTemplate: 'theme_minimal({{#if args}}{{args}}{{/if}})'
  },
  
  {
    id: 'theme_classic',
    type: BlockType.THEME_CLASSIC,
    category: BlockCategory.THEME,
    label: 'theme_classic()',
    description: '经典主题',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_classic()'
  },
  
  {
    id: 'theme_bw',
    type: BlockType.THEME_BW,
    category: BlockCategory.THEME,
    label: 'theme_bw()',
    description: '黑白主题',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_bw()'
  },
  
  {
    id: 'theme_gray',
    type: BlockType.THEME_GRAY,
    category: BlockCategory.THEME,
    label: 'theme_gray()',
    description: '灰色主题（默认）',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_gray()'
  },
  
  {
    id: 'theme_light',
    type: BlockType.THEME_LIGHT,
    category: BlockCategory.THEME,
    label: 'theme_light()',
    description: '浅色主题',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_light()'
  },
  
  {
    id: 'theme_dark',
    type: BlockType.THEME_DARK,
    category: BlockCategory.THEME,
    label: 'theme_dark()',
    description: '深色主题',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_dark()'
  },
  
  {
    id: 'theme_void',
    type: BlockType.THEME_VOID,
    category: BlockCategory.THEME,
    label: 'theme_void()',
    description: '空白主题',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_void()'
  },
  
  {
    id: 'theme',
    type: BlockType.THEME,
    category: BlockCategory.THEME,
    label: 'theme()',
    description: '自定义主题',
    color: '#10b981',
    params: [
      {
        name: 'custom',
        type: 'text',
        label: '自定义参数',
        required: false
      }
    ],
    rTemplate: 'theme({{#if custom}}{{custom}}{{/if}})'
  },
  
  // ========== 11. 其他几何对象 ==========
  {
    id: 'geom_segment',
    type: BlockType.GEOM_SEGMENT,
    category: BlockCategory.GEOM,
    label: 'geom_segment()',
    description: '线段几何对象',
    color: '#ec4899',
    params: [
      {
        name: 'data',
        type: 'text',
        label: 'data',
        required: false
      },
      {
        name: 'mapping',
        type: 'text',
        label: 'mapping',
        required: false
      },
      {
        name: 'colour',
        type: 'text',
        label: 'colour',
        required: false
      },
      {
        name: 'alpha',
        type: 'text',
        label: 'alpha',
        required: false
      },
      {
        name: 'linewidth',
        type: 'text',
        label: 'linewidth',
        required: false
      },
      {
        name: 'size',
        type: 'text',
        label: 'size',
        required: false
      },
      {
        name: 'inherit_aes',
        type: 'text',
        label: 'inherit.aes',
        required: false
      }
    ],
    rTemplate: 'geom_segment({{#if data}}data = {{data}}{{/if}}{{#if mapping}}{{#if data}}, {{/if}}mapping = {{mapping}}{{/if}}{{#if colour}}, colour = {{colour}}{{/if}}{{#if alpha}}, alpha = {{alpha}}{{/if}}{{#if linewidth}}, linewidth = {{linewidth}}{{/if}}{{#if size}}, size = {{size}}{{/if}}{{#if inherit_aes}}, inherit.aes = {{inherit_aes}}{{/if}})'
  },
  
  // ========== 12. 其他标度 ==========
  {
    id: 'scale_fill_viridis',
    type: BlockType.SCALE_FILL_VIRIDIS,
    category: BlockCategory.SCALE,
    label: 'scale_fill_viridis()',
    description: 'Viridis 调色板',
    color: '#06b6d4',
    params: [
      {
        name: 'name',
        type: 'text',
        label: 'name',
        required: false
      },
      {
        name: 'discrete',
        type: 'text',
        label: 'discrete',
        required: false
      },
      {
        name: 'option',
        type: 'text',
        label: 'option',
        required: false
      }
    ],
    rTemplate: 'scale_fill_viridis({{#if name}}name = {{name}}{{/if}}{{#if discrete}}{{#if name}}, {{/if}}discrete = {{discrete}}{{/if}}{{#if option}}{{#if name}}, {{else}}{{#if discrete}}, {{/if}}{{/if}}option = {{option}}{{/if}})'
  },
  
  // ========== 13. 坐标轴限制 ==========
  {
    id: 'ylim',
    type: BlockType.YLIM,
    category: BlockCategory.COORD,
    label: 'ylim()',
    description: 'Y轴限制',
    color: '#6366f1',
    params: [
      {
        name: 'min',
        type: 'text',
        label: 'min',
        required: false
      },
      {
        name: 'max',
        type: 'text',
        label: 'max',
        required: false
      }
    ],
    rTemplate: 'ylim({{#if min}}{{min}}{{/if}}{{#if max}}, {{max}}{{/if}})'
  },
  
  // ========== 14. 注释 ==========
  {
    id: 'annotate',
    type: BlockType.ANNOTATE,
    category: BlockCategory.GEOM,
    label: 'annotate()',
    description: '添加注释',
    color: '#ec4899',
    params: [
      {
        name: 'geom',
        type: 'text',
        label: 'geom',
        required: false
      },
      {
        name: 'x',
        type: 'text',
        label: 'x',
        required: false
      },
      {
        name: 'y',
        type: 'text',
        label: 'y',
        required: false
      },
      {
        name: 'label',
        type: 'text',
        label: 'label',
        required: false
      },
      {
        name: 'color',
        type: 'text',
        label: 'color',
        required: false
      },
      {
        name: 'size',
        type: 'text',
        label: 'size',
        required: false
      },
      {
        name: 'angle',
        type: 'text',
        label: 'angle',
        required: false
      },
      {
        name: 'fontface',
        type: 'text',
        label: 'fontface',
        required: false
      },
      {
        name: 'hjust',
        type: 'text',
        label: 'hjust',
        required: false
      }
    ],
    rTemplate: 'annotate({{#if geom}}{{geom}}{{/if}}{{#if x}}, x = {{x}}{{/if}}{{#if y}}, y = {{y}}{{/if}}{{#if label}}, label = {{label}}{{/if}}{{#if color}}, color = {{color}}{{/if}}{{#if size}}, size = {{size}}{{/if}}{{#if angle}}, angle = {{angle}}{{/if}}{{#if fontface}}, fontface = {{fontface}}{{/if}}{{#if hjust}}, hjust = {{hjust}}{{/if}})'
  },
  
  // ========== 15. 保存图表 ==========
  {
    id: 'ggsave',
    type: BlockType.GGSAVE,
    category: BlockCategory.BASE,
    label: 'ggsave()',
    description: '保存图表',
    color: '#ef4444',
    params: [
      {
        name: 'plot',
        type: 'text',
        label: 'plot',
        required: false
      },
      {
        name: 'file',
        type: 'text',
        label: 'file',
        required: false
      },
      {
        name: 'width',
        type: 'text',
        label: 'width',
        required: false
      },
      {
        name: 'height',
        type: 'text',
        label: 'height',
        required: false
      },
      {
        name: 'dpi',
        type: 'text',
        label: 'dpi',
        required: false
      }
    ],
    rTemplate: 'ggsave({{#if plot}}plot = {{plot}}{{/if}}{{#if file}}{{#if plot}}, {{/if}}file = {{file}}{{/if}}{{#if width}}, width = {{width}}{{/if}}{{#if height}}, height = {{height}}{{/if}}{{#if dpi}}, dpi = {{dpi}}{{/if}})'
  },
  
  // ========== 16. tidyverse 数据处理 ==========
  {
    id: 'gather',
    type: BlockType.GATHER,
    category: BlockCategory.DATA,
    label: 'gather()',
    description: '宽转长（数据重塑）',
    color: '#3b82f6',
    params: [
      {
        name: 'key',
        type: 'text',
        label: 'key',
        required: false
      },
      {
        name: 'value',
        type: 'text',
        label: 'value',
        required: false
      },
      {
        name: 'exclude',
        type: 'text',
        label: '排除列',
        required: false
      }
    ],
    rTemplate: 'gather({{#if key}}key = {{key}}{{/if}}{{#if value}}, value = {{value}}{{/if}}{{#if exclude}}, {{exclude}}{{/if}})'
  },
  
  {
    id: 'arrange',
    type: BlockType.ARRANGE,
    category: BlockCategory.DATA,
    label: 'arrange()',
    description: '排序',
    color: '#3b82f6',
    params: [
      {
        name: 'columns',
        type: 'text',
        label: '排序列',
        required: false
      }
    ],
    rTemplate: 'arrange({{#if columns}}{{columns}}{{/if}})'
  },
  
  {
    id: 'mutate',
    type: BlockType.MUTATE,
    category: BlockCategory.DATA,
    label: 'mutate()',
    description: '添加或修改列',
    color: '#3b82f6',
    params: [
      {
        name: 'expressions',
        type: 'text',
        label: '表达式',
        required: false
      }
    ],
    rTemplate: 'mutate({{#if expressions}}{{expressions}}{{/if}})'
  },
  
  {
    id: 'summarize',
    type: BlockType.SUMMARIZE,
    category: BlockCategory.DATA,
    label: 'summarize()',
    description: '汇总',
    color: '#3b82f6',
    params: [
      {
        name: 'expressions',
        type: 'text',
        label: '汇总表达式',
        required: false
      }
    ],
    rTemplate: 'summarize({{#if expressions}}{{expressions}}{{/if}})'
  },
  
  {
    id: 'group_by',
    type: BlockType.GROUP_BY,
    category: BlockCategory.DATA,
    label: 'group_by()',
    description: '分组',
    color: '#3b82f6',
    params: [
      {
        name: 'columns',
        type: 'text',
        label: '分组列',
        required: false
      }
    ],
    rTemplate: 'group_by({{#if columns}}{{columns}}{{/if}})'
  },
  
  {
    id: 'rowwise',
    type: BlockType.ROWWISE,
    category: BlockCategory.DATA,
    label: 'rowwise()',
    description: '按行操作',
    color: '#3b82f6',
    params: [],
    rTemplate: 'rowwise()'
  },
  
  // ========== 17. 主题元素 ==========
  {
    id: 'unit',
    type: BlockType.UNIT,
    category: BlockCategory.THEME,
    label: 'unit()',
    description: '单位',
    color: '#10b981',
    params: [
      {
        name: 'values',
        type: 'text',
        label: '值',
        required: false
      },
      {
        name: 'units',
        type: 'text',
        label: '单位',
        required: false
      }
    ],
    rTemplate: 'unit({{#if values}}{{values}}{{/if}}{{#if units}}, {{units}}{{/if}})'
  },
  
  {
    id: 'element_blank',
    type: BlockType.ELEMENT_BLANK,
    category: BlockCategory.THEME,
    label: 'element_blank()',
    description: '空白元素',
    color: '#10b981',
    params: [],
    rTemplate: 'element_blank()'
  },
  
  // ==================== 高级R语法 ====================
  
  {
    id: 'pipe_operator',
    type: BlockType.PIPE_OPERATOR,
    category: BlockCategory.BASE,
    label: '管道操作符 %>%',
    description: 'tidyverse管道操作符，将左侧结果传递给右侧函数',
    color: '#8b5cf6',
    params: [
      {
        name: 'left',
        type: 'text',
        label: '左侧表达式',
        required: true
      },
      {
        name: 'right',
        type: 'text',
        label: '右侧函数',
        required: true
      }
    ],
    rTemplate: '{{left}} %>% {{right}}'
  },
  
  {
    id: 'index_access',
    type: BlockType.INDEX_ACCESS,
    category: BlockCategory.BASE,
    label: '索引访问 $',
    description: '访问数据框或列表的列/元素 (data$column)',
    color: '#8b5cf6',
    params: [
      {
        name: 'object',
        type: 'text',
        label: '对象名称',
        required: true
      },
      {
        name: 'field',
        type: 'text',
        label: '字段名称',
        required: true
      }
    ],
    rTemplate: '{{object}}${{field}}'
  },
  
  {
    id: 'arithmetic_expr',
    type: BlockType.ARITHMETIC_EXPR,
    category: BlockCategory.BASE,
    label: '算术表达式',
    description: '数学运算表达式 (支持 +, -, *, /, 括号等)',
    color: '#8b5cf6',
    params: [
      {
        name: 'expression',
        type: 'text',
        label: '表达式',
        required: true,
        defaultValue: 'a + b'
      }
    ],
    rTemplate: '{{expression}}'
  },
  
  {
    id: 'subset_access',
    type: BlockType.SUBSET_ACCESS,
    category: BlockCategory.BASE,
    label: '数组子集 []',
    description: '访问向量、矩阵或数据框的子集 (data[rows, cols])',
    color: '#8b5cf6',
    params: [
      {
        name: 'object',
        type: 'text',
        label: '对象名称',
        required: true
      },
      {
        name: 'rows',
        type: 'text',
        label: '行索引',
        defaultValue: ''
      },
      {
        name: 'cols',
        type: 'text',
        label: '列索引',
        defaultValue: ''
      }
    ],
    rTemplate: '{{object}}[{{rows}}{{#if cols}}, {{cols}}{{/if}}]'
  },
  
  {
    id: 'negative_index',
    type: BlockType.NEGATIVE_INDEX,
    category: BlockCategory.BASE,
    label: '负索引',
    description: '排除指定的列或元素 (-c(1, 2))',
    color: '#8b5cf6',
    params: [
      {
        name: 'indices',
        type: 'text',
        label: '要排除的索引',
        required: true,
        defaultValue: '1, 2'
      }
    ],
    rTemplate: '-c({{indices}})'
  },
  
  {
    id: 'namespace_call',
    type: BlockType.NAMESPACE_CALL,
    category: BlockCategory.BASE,
    label: '命名空间调用',
    description: '使用完全限定名调用函数 (package::function)',
    color: '#8b5cf6',
    params: [
      {
        name: 'package',
        type: 'text',
        label: '包名',
        required: true
      },
      {
        name: 'function',
        type: 'text',
        label: '函数名',
        required: true
      },
      {
        name: 'args',
        type: 'text',
        label: '参数',
        defaultValue: ''
      }
    ],
    rTemplate: '{{package}}::{{function}}({{args}})'
  }
];

// 按类别分组积木
export const blocksByCategory = blockDefinitions.reduce((acc, block) => {
  if (!acc[block.category]) {
    acc[block.category] = [];
  }
  acc[block.category].push(block);
  return acc;
}, {} as Record<BlockCategory, BlockDefinition[]>);

