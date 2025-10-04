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
    rTemplate: '{{variable}} <- {{value}}'
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
        name: 'mapping',
        type: 'text',
        label: 'mapping (必需)',
        required: false
      },
      {
        name: 'size',
        type: 'text',
        label: 'size',
        required: false
      },
      {
        name: 'vjust',
        type: 'text',
        label: 'vjust',
        required: false
      }
    ],
    rTemplate: 'geom_text({{#if mapping}}mapping = {{mapping}}{{/if}}{{#if size}}, size = {{size}}{{/if}}{{#if vjust}}, vjust = {{vjust}}{{/if}})'
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
      }
    ],
    rTemplate: 'scale_fill_manual({{#if values}}values = {{values}}{{/if}}{{#if name}}, name = {{name}}{{/if}})'
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
      }
    ],
    rTemplate: 'scale_color_brewer({{#if palette}}palette = {{palette}}{{/if}}{{#if direction}}, direction = {{direction}}{{/if}})'
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
        name: 'caption',
        type: 'text',
        label: 'caption',
        required: false
      }
    ],
    rTemplate: 'labs({{#if title}}title = {{title}}{{/if}}{{#if subtitle}}, subtitle = {{subtitle}}{{/if}}{{#if x}}, x = {{x}}{{/if}}{{#if y}}, y = {{y}}{{/if}}{{#if caption}}, caption = {{caption}}{{/if}})'
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
    params: [],
    rTemplate: 'theme_minimal()'
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
        name: 'inherit_aes',
        type: 'text',
        label: 'inherit.aes',
        required: false
      }
    ],
    rTemplate: 'geom_segment({{#if data}}data = {{data}}{{/if}}{{#if mapping}}{{#if data}}, {{/if}}mapping = {{mapping}}{{/if}}{{#if colour}}, colour = {{colour}}{{/if}}{{#if alpha}}, alpha = {{alpha}}{{/if}}{{#if linewidth}}, linewidth = {{linewidth}}{{/if}}{{#if inherit_aes}}, inherit.aes = {{inherit_aes}}{{/if}})'
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
    rTemplate: 'scale_fill_viridis({{#if discrete}}discrete = {{discrete}}{{/if}}{{#if option}}, option = {{option}}{{/if}})'
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
      }
    ],
    rTemplate: 'ggsave({{#if plot}}{{plot}}{{/if}}{{#if file}}{{#if plot}}, {{/if}}file = {{file}}{{/if}}{{#if width}}, width = {{width}}{{/if}}{{#if height}}, height = {{height}}{{/if}})'
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

