import { BlockDefinition, BlockType, BlockCategory } from '../types/blocks';

// 积木定义库
export const blockDefinitions: BlockDefinition[] = [
  // ========== 数据相关 ==========
  {
    id: 'data_import',
    type: BlockType.DATA_IMPORT,
    category: BlockCategory.DATA,
    label: '导入数据',
    description: '导入 CSV 或使用示例数据集',
    color: '#3b82f6',
    params: [
      {
        name: 'source',
        type: 'select',
        label: '数据源',
        options: [
          { label: 'iris（鸢尾花）', value: 'iris' },
          { label: 'mtcars（汽车）', value: 'mtcars' },
          { label: 'diamonds（钻石）', value: 'diamonds' },
          { label: 'mpg（汽车燃油）', value: 'mpg' }
        ],
        defaultValue: 'iris',
        required: true
      }
    ],
    rTemplate: 'data <- {{source}}'
  },
  
  // ========== ggplot 初始化 ==========
  {
    id: 'ggplot_init',
    type: BlockType.GGPLOT_INIT,
    category: BlockCategory.DATA,
    label: '创建画布',
    description: '初始化 ggplot 对象',
    color: '#8b5cf6',
    params: [
      {
        name: 'x',
        type: 'column',
        label: 'X 轴',
        required: false
      },
      {
        name: 'y',
        type: 'column',
        label: 'Y 轴',
        required: false
      },
      {
        name: 'color',
        type: 'column',
        label: '颜色映射',
        required: false
      },
      {
        name: 'size',
        type: 'column',
        label: '大小映射',
        required: false
      }
    ],
    rTemplate: 'ggplot(data, aes({{#if x}}x = {{x}}{{/if}}{{#if y}}, y = {{y}}{{/if}}{{#if color}}, color = {{color}}{{/if}}{{#if size}}, size = {{size}}{{/if}}))'
  },
  
  // ========== 几何对象 ==========
  {
    id: 'geom_point',
    type: BlockType.GEOM_POINT,
    category: BlockCategory.GEOM,
    label: '散点图',
    description: '添加散点图层',
    color: '#ec4899',
    params: [
      {
        name: 'size',
        type: 'number',
        label: '点大小',
        defaultValue: 3
      },
      {
        name: 'alpha',
        type: 'number',
        label: '透明度',
        defaultValue: 0.8
      },
      {
        name: 'shape',
        type: 'select',
        label: '点形状',
        options: [
          { label: '圆形', value: 16 },
          { label: '方形', value: 15 },
          { label: '三角形', value: 17 },
          { label: '菱形', value: 18 }
        ],
        defaultValue: 16
      }
    ],
    rTemplate: 'geom_point(size = {{size}}, alpha = {{alpha}}, shape = {{shape}})'
  },
  
  {
    id: 'geom_line',
    type: BlockType.GEOM_LINE,
    category: BlockCategory.GEOM,
    label: '折线图',
    description: '添加折线图层',
    color: '#ec4899',
    params: [
      {
        name: 'linewidth',
        type: 'number',
        label: '线宽',
        defaultValue: 1
      },
      {
        name: 'linetype',
        type: 'select',
        label: '线型',
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
          { label: '点划线', value: 'dotdash' }
        ],
        defaultValue: 'solid'
      }
    ],
    rTemplate: 'geom_line(linewidth = {{linewidth}}, linetype = "{{linetype}}")'
  },
  
  {
    id: 'geom_bar',
    type: BlockType.GEOM_BAR,
    category: BlockCategory.GEOM,
    label: '柱状图',
    description: '添加柱状图层',
    color: '#ec4899',
    params: [
      {
        name: 'stat',
        type: 'select',
        label: '统计方式',
        options: [
          { label: '计数', value: 'count' },
          { label: '原值', value: 'identity' }
        ],
        defaultValue: 'count'
      },
      {
        name: 'position',
        type: 'select',
        label: '位置调整',
        options: [
          { label: '堆叠', value: 'stack' },
          { label: '并列', value: 'dodge' },
          { label: '填充', value: 'fill' }
        ],
        defaultValue: 'stack'
      }
    ],
    rTemplate: 'geom_bar(stat = "{{stat}}", position = "{{position}}")'
  },
  
  {
    id: 'geom_boxplot',
    type: BlockType.GEOM_BOXPLOT,
    category: BlockCategory.GEOM,
    label: '箱线图',
    description: '添加箱线图层',
    color: '#ec4899',
    params: [
      {
        name: 'width',
        type: 'number',
        label: '箱体宽度',
        defaultValue: 0.5
      },
      {
        name: 'outlier_shape',
        type: 'select',
        label: '异常值形状',
        options: [
          { label: '圆形', value: 16 },
          { label: '十字', value: 4 },
          { label: '不显示', value: 'NA' }
        ],
        defaultValue: 16
      }
    ],
    rTemplate: 'geom_boxplot(width = {{width}}{{#if outlier_shape}}, outlier.shape = {{outlier_shape}}{{/if}})'
  },
  
  {
    id: 'geom_smooth',
    type: BlockType.GEOM_SMOOTH,
    category: BlockCategory.GEOM,
    label: '平滑曲线',
    description: '添加趋势线',
    color: '#ec4899',
    params: [
      {
        name: 'method',
        type: 'select',
        label: '拟合方法',
        options: [
          { label: '线性回归', value: 'lm' },
          { label: 'LOESS', value: 'loess' },
          { label: 'GAM', value: 'gam' }
        ],
        defaultValue: 'loess'
      },
      {
        name: 'se',
        type: 'boolean',
        label: '显示置信区间',
        defaultValue: true
      }
    ],
    rTemplate: 'geom_smooth(method = "{{method}}", se = {{se}})'
  },
  
  // ========== 标签 ==========
  {
    id: 'labs',
    type: BlockType.LABS,
    category: BlockCategory.LABS,
    label: '标题和标签',
    description: '设置图表标题和坐标轴标签',
    color: '#f59e0b',
    params: [
      {
        name: 'title',
        type: 'text',
        label: '主标题',
        defaultValue: ''
      },
      {
        name: 'subtitle',
        type: 'text',
        label: '副标题',
        defaultValue: ''
      },
      {
        name: 'x',
        type: 'text',
        label: 'X 轴标签',
        defaultValue: ''
      },
      {
        name: 'y',
        type: 'text',
        label: 'Y 轴标签',
        defaultValue: ''
      }
    ],
    rTemplate: 'labs({{#if title}}title = "{{title}}"{{/if}}{{#if subtitle}}, subtitle = "{{subtitle}}"{{/if}}{{#if x}}, x = "{{x}}"{{/if}}{{#if y}}, y = "{{y}}"{{/if}})'
  },
  
  // ========== 主题 ==========
  {
    id: 'theme_minimal',
    type: BlockType.THEME_MINIMAL,
    category: BlockCategory.THEME,
    label: '极简主题',
    description: '应用 theme_minimal()',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_minimal()'
  },
  
  {
    id: 'theme_classic',
    type: BlockType.THEME_CLASSIC,
    category: BlockCategory.THEME,
    label: '经典主题',
    description: '应用 theme_classic()',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_classic()'
  },
  
  {
    id: 'theme_bw',
    type: BlockType.THEME_BW,
    category: BlockCategory.THEME,
    label: '黑白主题',
    description: '应用 theme_bw()',
    color: '#10b981',
    params: [],
    rTemplate: 'theme_bw()'
  },
  
  // ========== 标度 ==========
  {
    id: 'scale_color_brewer',
    type: BlockType.SCALE_COLOR,
    category: BlockCategory.SCALE,
    label: '颜色标度',
    description: '设置颜色映射',
    color: '#06b6d4',
    params: [
      {
        name: 'palette',
        type: 'select',
        label: '调色板',
        options: [
          { label: 'Set1', value: 'Set1' },
          { label: 'Set2', value: 'Set2' },
          { label: 'Set3', value: 'Set3' },
          { label: 'Pastel1', value: 'Pastel1' },
          { label: 'Dark2', value: 'Dark2' }
        ],
        defaultValue: 'Set1'
      }
    ],
    rTemplate: 'scale_color_brewer(palette = "{{palette}}")'
  },
  
  // ========== 坐标系 ==========
  {
    id: 'coord_flip',
    type: BlockType.COORD_FLIP,
    category: BlockCategory.COORD,
    label: '翻转坐标轴',
    description: '交换 X 和 Y 轴',
    color: '#6366f1',
    params: [],
    rTemplate: 'coord_flip()'
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

