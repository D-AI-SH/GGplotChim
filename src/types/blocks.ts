// 积木类型定义

export enum BlockCategory {
  BASE = 'base',     // R语言基础语句
  DATA = 'data',
  GEOM = 'geom',
  AES = 'aes',
  SCALE = 'scale',
  THEME = 'theme',
  COORD = 'coord',
  STAT = 'stat',
  FACET = 'facet',
  LABS = 'labs'
}

export enum BlockType {
  // 0. R语言基础语句
  START = 'start', // 程序开始积木
  LIBRARY = 'library',
  PRINT = 'print',
  ASSIGN = 'assign',
  FOR_LOOP = 'for_loop',
  IF_STATEMENT = 'if_statement',
  FUNCTION_CALL = 'function_call',
  COMMENT = 'comment',
  CUSTOM_CODE = 'custom_code', // 自定义代码块（用于存储无法识别的代码）
  
  // 1. 数据相关
  DATA_IMPORT = 'data_import',
  GGPLOT_INIT = 'ggplot_init',
  
  // 2. 美学映射
  AES = 'aes',
  
  // 3. 几何对象 (Geoms)
  GEOM_POINT = 'geom_point',
  GEOM_LINE = 'geom_line',
  GEOM_BAR = 'geom_bar',
  GEOM_COL = 'geom_col',
  GEOM_HISTOGRAM = 'geom_histogram',
  GEOM_BOXPLOT = 'geom_boxplot',
  GEOM_SMOOTH = 'geom_smooth',
  GEOM_TEXT = 'geom_text',
  GEOM_AREA = 'geom_area',
  GEOM_SEGMENT = 'geom_segment',
  
  // 4. 标度 (Scales)
  SCALE_X_CONTINUOUS = 'scale_x_continuous',
  SCALE_Y_CONTINUOUS = 'scale_y_continuous',
  SCALE_COLOR_MANUAL = 'scale_color_manual',
  SCALE_FILL_MANUAL = 'scale_fill_manual',
  SCALE_COLOR_BREWER = 'scale_color_brewer',
  SCALE_FILL_GRADIENT = 'scale_fill_gradient',
  SCALE_FILL_VIRIDIS = 'scale_fill_viridis',
  
  // 5. 坐标系 (Coordinates)
  COORD_FLIP = 'coord_flip',
  COORD_CARTESIAN = 'coord_cartesian',
  COORD_POLAR = 'coord_polar',
  YLIM = 'ylim',
  
  // 6. 分面 (Facets)
  FACET_WRAP = 'facet_wrap',
  FACET_GRID = 'facet_grid',
  
  // 7. 统计变换 (Stats)
  STAT_SUMMARY = 'stat_summary',
  STAT_SMOOTH = 'stat_smooth',
  
  // 8. 标签 (Labels)
  LABS = 'labs',
  GGTITLE = 'ggtitle',
  XLAB = 'xlab',
  YLAB = 'ylab',
  
  // 9. 主题 (Themes)
  THEME_MINIMAL = 'theme_minimal',
  THEME_CLASSIC = 'theme_classic',
  THEME_BW = 'theme_bw',
  THEME_GRAY = 'theme_gray',
  THEME_LIGHT = 'theme_light',
  THEME_DARK = 'theme_dark',
  THEME_VOID = 'theme_void',
  THEME = 'theme',
  
  // 10. 其他
  GGSAVE = 'ggsave',
  ANNOTATE = 'annotate',
  GATHER = 'gather',
  ARRANGE = 'arrange',
  MUTATE = 'mutate',
  SUMMARIZE = 'summarize',
  GROUP_BY = 'group_by',
  ROWWISE = 'rowwise',
  UNIT = 'unit',
  ELEMENT_BLANK = 'element_blank'
}

export interface BlockParam {
  name: string;
  type: 'text' | 'number' | 'select' | 'color' | 'boolean' | 'column';
  label: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
}

// 容器型积木的插槽定义
export interface BlockSlot {
  name: string;
  label: string;
  allowMultiple?: boolean; // 是否允许多个子积木
}

export interface BlockDefinition {
  id: string;
  type: BlockType;
  category: BlockCategory;
  label: string;
  description: string;
  icon?: string;
  color: string;
  params: BlockParam[];
  rTemplate: string; // R 代码模板
  isContainer?: boolean; // 是否为容器型积木（C型）
  slots?: BlockSlot[]; // 容器插槽（如 for 循环的循环体）
}

export interface BlockInstance {
  id: string;
  blockType: BlockType;
  position: { x: number; y: number };
  params: Record<string, any>;
  connections: {
    input: string | null;  // 输入连接的积木 ID（上一个积木）- 实线，代表执行顺序
    output: string | null; // 输出连接的积木 ID（只能连接一个积木，串行）- 实线，代表执行顺序
    // 🔧 容器型积木的额外连接点（循环体/分支体的输入输出）
    bodyInput?: string | null;  // 容器体内第一个积木的 ID
    bodyOutput?: string | null; // 容器体内最后一个积木的 ID
  };
  ggplotConnections?: string[]; // ggplot + 连接的积木 ID 列表 - 虚线，代表组合关系（Shift+拖拽创建）
  order: number; // 在图层链中的顺序（0 为起始积木）
  isSelected?: boolean; // 是否被选中（用于多选）
  children?: Record<string, string[]>; // 容器型积木的子积木 {slotName: [childBlockId1, childBlockId2, ...]}
  parentId?: string | null; // 父容器积木 ID（如果在容器内）
  slotName?: string; // 所在的插槽名称
  assignedTo?: string; // 变量赋值名称（如 p <- ggplot(...) 中的 "p"）
}

export interface DataColumn {
  name: string;
  type: 'numeric' | 'character' | 'factor' | 'date';
  sample?: any[];
}

export interface Dataset {
  id: string;
  name: string;
  columns: DataColumn[];
  rowCount: number;
  preview?: any[][];
}

