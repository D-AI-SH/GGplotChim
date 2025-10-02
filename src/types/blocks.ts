// 积木类型定义

export enum BlockCategory {
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
  // 数据相关
  DATA_IMPORT = 'data_import',
  DATA_FILTER = 'data_filter',
  DATA_SELECT = 'data_select',
  DATA_MUTATE = 'data_mutate',
  
  // ggplot 初始化
  GGPLOT_INIT = 'ggplot_init',
  AES_MAPPING = 'aes_mapping',
  
  // 几何对象
  GEOM_POINT = 'geom_point',
  GEOM_LINE = 'geom_line',
  GEOM_BAR = 'geom_bar',
  GEOM_HISTOGRAM = 'geom_histogram',
  GEOM_BOXPLOT = 'geom_boxplot',
  GEOM_VIOLIN = 'geom_violin',
  GEOM_SMOOTH = 'geom_smooth',
  
  // 标度
  SCALE_COLOR = 'scale_color',
  SCALE_FILL = 'scale_fill',
  SCALE_X = 'scale_x',
  SCALE_Y = 'scale_y',
  
  // 标签
  LABS = 'labs',
  
  // 主题
  THEME_MINIMAL = 'theme_minimal',
  THEME_CLASSIC = 'theme_classic',
  THEME_BW = 'theme_bw',
  THEME_CUSTOM = 'theme_custom',
  
  // 坐标系
  COORD_FLIP = 'coord_flip',
  COORD_POLAR = 'coord_polar',
  
  // 分面
  FACET_WRAP = 'facet_wrap',
  FACET_GRID = 'facet_grid'
}

export interface BlockParam {
  name: string;
  type: 'text' | 'number' | 'select' | 'color' | 'boolean' | 'column';
  label: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
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
}

export interface BlockInstance {
  id: string;
  blockType: BlockType;
  position: { x: number; y: number };
  params: Record<string, any>;
  connections?: {
    input?: string; // 输入连接的块 ID
    output?: string[]; // 输出连接的块 ID
  };
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

