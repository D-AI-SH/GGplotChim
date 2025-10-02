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
  
  // 4. 标度 (Scales)
  SCALE_X_CONTINUOUS = 'scale_x_continuous',
  SCALE_Y_CONTINUOUS = 'scale_y_continuous',
  SCALE_COLOR_MANUAL = 'scale_color_manual',
  SCALE_FILL_MANUAL = 'scale_fill_manual',
  SCALE_COLOR_BREWER = 'scale_color_brewer',
  SCALE_FILL_GRADIENT = 'scale_fill_gradient',
  
  // 5. 坐标系 (Coordinates)
  COORD_FLIP = 'coord_flip',
  COORD_CARTESIAN = 'coord_cartesian',
  COORD_POLAR = 'coord_polar',
  
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
  THEME = 'theme'
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

