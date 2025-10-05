/**
 * R 代码模板定义
 * 从 r_code_examples/ 目录收集的示例代码
 */

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  thumbnail?: string; // 可选：模板缩略图
  requiredPackages: string[]; // 所需的 R 包
}

export const codeTemplates: CodeTemplate[] = [
  {
    id: 'circular-stacked-barplot',
    name: '圆形堆叠条形图',
    description: '使用极坐标系统创建的圆形堆叠条形图，适合展示多维度分类数据',
    category: '高级图表',
    requiredPackages: ['ggplot2', 'dplyr', 'tidyr', 'viridis'],
    code: `# library
# 注意：webR 不支持 tidyverse 元包，需要分别加载核心包
library(ggplot2)  # 用于绘图
library(dplyr)    # 用于 %>%, group_by, summarize, arrange, mutate 等
library(tidyr)    # 用于 gather 函数
library(viridis)  # 用于配色
 
# Create dataset
data <- data.frame(
  individual=paste( "Mister ", seq(1,60), sep=""),
  group=factor(c( rep('A', 10), rep('B', 30), rep('C', 14), rep('D', 6))) ,
  value1=sample( seq(10,100), 60, replace=T),
  value2=sample( seq(10,100), 60, replace=T),
  value3=sample( seq(10,100), 60, replace=T)
)
 
# Transform data in a tidy format (long format)
data <- data %>% gather(key = "observation", value="value", -c(1,2))

# Set a number of 'empty bar' to add at the end of each group
empty_bar <- 2
nObsType <- nlevels(as.factor(data$observation))
to_add <- data.frame( matrix(NA, empty_bar*nlevels(data$group)*nObsType, ncol(data)) )
colnames(to_add) <- colnames(data)
to_add$group <- rep(levels(data$group), each=empty_bar*nObsType )
data <- rbind(data, to_add)
data <- data %>% arrange(group, individual)
data$id <- rep( seq(1, nrow(data)/nObsType) , each=nObsType)
 
# Get the name and the y position of each label
label_data <- data %>% group_by(id, individual) %>% summarize(tot=sum(value))
number_of_bar <- nrow(label_data)
angle <- 90 - 360 * (label_data$id-0.5) /number_of_bar     # I substract 0.5 because the letter must have the angle of the center of the bars. Not extreme right(1) or extreme left (0)
label_data$hjust <- ifelse( angle < -90, 1, 0)
label_data$angle <- ifelse(angle < -90, angle+180, angle)
 
# prepare a data frame for base lines
base_data <- data %>% 
  group_by(group) %>% 
  summarize(start=min(id), end=max(id) - empty_bar) %>% 
  rowwise() %>% 
  mutate(title=mean(c(start, end)))
 
# prepare a data frame for grid (scales)
grid_data <- base_data
grid_data$end <- grid_data$end[ c( nrow(grid_data), 1:nrow(grid_data)-1)] + 1
grid_data$start <- grid_data$start - 1
grid_data <- grid_data[-1,]
 
# Make the plot
p <- ggplot(data) +      
  
  # Add the stacked bar
  geom_bar(aes(x=as.factor(id), y=value, fill=observation), stat="identity", alpha=0.5) +
  scale_fill_viridis(discrete=TRUE) +
  
  # Add a val=100/75/50/25 lines. I do it at the beginning to make sur barplots are OVER it.
  geom_segment(data=grid_data, aes(x = end, y = 0, xend = start, yend = 0), colour = "grey", alpha=1, linewidth=0.3 , inherit.aes = FALSE ) +
  geom_segment(data=grid_data, aes(x = end, y = 50, xend = start, yend = 50), colour = "grey", alpha=1, linewidth=0.3 , inherit.aes = FALSE ) +
  geom_segment(data=grid_data, aes(x = end, y = 100, xend = start, yend = 100), colour = "grey", alpha=1, linewidth=0.3 , inherit.aes = FALSE ) +
  geom_segment(data=grid_data, aes(x = end, y = 150, xend = start, yend = 150), colour = "grey", alpha=1, linewidth=0.3 , inherit.aes = FALSE ) +
  geom_segment(data=grid_data, aes(x = end, y = 200, xend = start, yend = 200), colour = "grey", alpha=1, linewidth=0.3 , inherit.aes = FALSE ) +
  
  # Add text showing the value of each 100/75/50/25 lines
  ggplot2::annotate("text", x = rep(max(data$id),5), y = c(0, 50, 100, 150, 200), label = c("0", "50", "100", "150", "200") , color="grey", size=6 , angle=0, fontface="bold", hjust=1) +
  
  ylim(-150,max(label_data$tot, na.rm=T)) +
  theme_minimal() +
  theme(
    legend.position = "none",
    axis.text = element_blank(),
    axis.title = element_blank(),
    panel.grid = element_blank(),
    plot.margin = unit(rep(-1,4), "cm") 
  ) +
  coord_polar() +
  
  # Add labels on top of each bar
  geom_text(data=label_data, aes(x=id, y=tot+10, label=individual, hjust=hjust), color="black", fontface="bold",alpha=0.6, size=5, angle= label_data$angle, inherit.aes = FALSE ) +
  
  # Add base line information
  geom_segment(data=base_data, aes(x = start, y = -5, xend = end, yend = -5), colour = "black", alpha=0.8, size=0.6 , inherit.aes = FALSE )  +
  geom_text(data=base_data, aes(x = title, y = -18, label=group), hjust=c(1,1,0,0), colour = "black", alpha=0.8, size=4, fontface="bold", inherit.aes = FALSE)

# 显示图表（webR 需要显式打印才能显示）
print(p)
`
  },
  {
    id: 'stream-graph',
    name: '流图',
    description: '使用 ggstream 创建的流图，适合展示时间序列数据的变化趋势',
    category: '高级图表',
    requiredPackages: ['ggplot2', 'ggstream'],
    code: `# 加载包
library(ggplot2)
library(ggstream)

# 创建数据
data <- data.frame(
  year=rep(seq(1990,2016) , each=10),
  name=rep(letters[1:10] , 27),
  value=sample( seq(0,1,0.0001) , 270)
)

# 使用 ggplot2 和 ggstream 创建静态流图
p <- ggplot(data, aes(x = year, y = value, fill = name)) +
  geom_stream() +
  scale_fill_brewer(palette = "Spectral") +
  theme_minimal() +
  labs(title = "流图",
       x = "年份",
       y = "值",
       fill = "类别") +
  theme(legend.position = "right")

# 保存为 PNG 文件
print(p)
`
  },
  {
    id: 'sankey-diagram',
    name: '桑基图',
    description: '使用 ggalluvial 创建的桑基图（冲积图），适合展示流程和能量流动关系',
    category: '高级图表',
    requiredPackages: ['ggplot2', 'dplyr', 'ggalluvial'],
    code: `# ==========================================
# 桑基图示例 - 英国能源系统流动图（静态版本）
# ==========================================
# 说明：本示例展示如何使用 ggplot2 和 ggalluvial 包绘制桑基图（Alluvial Diagram）
# 桑基图是一种流程图，用于可视化能量、物质或成本等在系统中的流动
# 图中的带状宽度与流量大小成正比，适合展示复杂的流动关系
# 
# 数据来源：英国能源系统数据（简化版，展示主要能源流动）
# 单位：TWh（太瓦时）
# ==========================================

# 加载必需的包
library(ggplot2)
library(dplyr)
library(ggalluvial)

# 创建简化的能源流动数据（三层流动：来源 -> 转换 -> 终端使用）
# 这个数据结构更适合在 WebR 环境中使用 ggalluvial 包绘制
energy_flows <- data.frame(
  # 能源来源
  source = c(
    "煤炭", "煤炭", "煤炭",
    "天然气", "天然气", "天然气", "天然气",
    "石油", "石油", "石油",
    "核能", "水电", "风能", "太阳能",
    "生物质", "生物质"
  ),
  
  # 转换过程
  conversion = c(
    "热力发电", "工业", "家庭供暖",
    "热力发电", "工业", "家庭供暖", "商业供暖",
    "道路交通", "航空", "工业",
    "电网", "电网", "电网", "电网",
    "热力发电", "生物燃料"
  ),
  
  # 终端使用
  end_use = c(
    "电网", "工业用能", "居民用能",
    "电网", "工业用能", "居民用能", "商业用能",
    "交通运输", "交通运输", "工业用能",
    "电力", "电力", "电力", "电力",
    "电网", "交通运输"
  ),
  
  # 能量值（TWh）
  value = c(
    400, 150, 100,
    350, 120, 180, 80,
    500, 130, 80,
    290, 60, 190, 60,
    100, 80
  ),
  
  stringsAsFactors = FALSE
)

# 查看数据结构
print("能源流动数据（前10行）：")
head(energy_flows, 10)

# 使用 ggalluvial 包绘制桑基图（冲积图）
# 这是一个静态图表，可以在 WebR 环境中正常显示
p <- ggplot(energy_flows,
       aes(y = value,
           axis1 = source,      # 第一层：能源来源
           axis2 = conversion,  # 第二层：转换过程
           axis3 = end_use)) +  # 第三层：终端使用
  
  # 绘制流动带（alluvium）- 使用灰色，叠加部分自动加深
  geom_alluvium(fill = "grey70",     # 统一灰色
                width = 1/12,
                alpha = 0.5,         # 半透明，叠加处自动变深
                decreasing = FALSE) +
  
  # 绘制分类轴（stratum）- 使用彩色填充
  geom_stratum(aes(fill = after_stat(stratum)),  # 根据节点名称着色
               width = 1/12, 
               color = "white",       # 白色边框
               linewidth = 0.8) +
  
  # 添加标签 - 白色文字更清晰
  geom_text(stat = "stratum", 
            aes(label = after_stat(stratum)),
            size = 3.2,
            fontface = "bold",
            color = "white",
            family = getOption("ggplot_chinese_font", "SimSun")) +  # 使用配置的中文字体
  
  # 设置配色方案（科研论文专用配色：ColorBrewer Set1/Dark2混合，色盲友好）
  # 配色原则：能源来源用深色系，转换过程用中色系，终端使用用浅色系
  scale_fill_manual(
    values = c(
      # 第一层：能源来源（8种，深色系）
      "煤炭" = "#525252",      # 深灰色（化石能源）
      "天然气" = "#2166AC",    # 深蓝色（天然气）
      "石油" = "#B2182B",      # 深红色（石油）
      "核能" = "#762A83",      # 深紫色（核能）
      "水电" = "#01665E",      # 深青色（水电）
      "风能" = "#084594",      # 深蓝色（风能）
      "太阳能" = "#D94801",    # 深橙色（太阳能）
      "生物质" = "#1B7837",    # 深绿色（生物质）
      
      # 第二层：转换过程（5种，中色系）
      "热力发电" = "#E78AC3",  # 粉色（发电）
      "工业" = "#8DA0CB",      # 蓝灰色（工业）
      "家庭供暖" = "#FC8D62",  # 珊瑚橙（家庭）
      "商业供暖" = "#FFD92F",  # 金黄色（商业）
      "道路交通" = "#66C2A5",  # 薄荷绿（交通）
      "航空" = "#A6D854",      # 黄绿色（航空）
      "生物燃料" = "#B3B3B3",  # 浅灰色（燃料）
      "电网" = "#E5C494",      # 米黄色（电网）
      
      # 第三层：终端使用（4种，浅色系）
      "电力" = "#FEE0B6",      # 浅橙色（电力）
      "工业用能" = "#D1E5F0",  # 浅蓝色（工业）
      "居民用能" = "#FDDBC7",  # 浅粉色（居民）
      "商业用能" = "#F7F7F7",  # 浅灰色（商业）
      "交通运输" = "#B8E186"   # 浅绿色（交通）
    ),
    name = "节点类型",
    guide = guide_legend(
      title.position = "top",
      title.hjust = 0.5,
      ncol = 2,              # 两列显示
      byrow = TRUE,
      keywidth = unit(0.8, "cm"),
      keyheight = unit(0.6, "cm"),
      override.aes = list(color = NA)  # 图例中不显示边框
    )
  ) +
  
  # 设置X轴标签
  scale_x_discrete(
    limits = c("能源来源", "转换过程", "终端使用"),
    expand = c(0.1, 0.1)
  ) +
  
  # 添加标题和标签
  labs(
    title = "英国能源系统流动图（桑基图）",
    subtitle = "展示从能源来源到终端使用的能量流动路径",
    y = "能量 (TWh)",
    caption = "数据来源：英国能源系统统计数据（简化版）"
  ) +
  
  # 使用科研论文专用主题（Nature/Science 风格）
  # 使用用户配置的字体（从全局选项中获取）
  theme_minimal(
    base_size = 12, 
    base_family = getOption("ggplot_chinese_font", "SimSun")  # 默认宋体
  ) +
  theme(
    # 标题设置 - 明确指定字体
    plot.title = element_text(
      hjust = 0.5, 
      face = "bold", 
      size = 14,
      margin = margin(b = 8),
      family = getOption("ggplot_chinese_font", "SimSun")
    ),
    plot.subtitle = element_text(
      hjust = 0.5, 
      size = 11, 
      color = "grey30",
      margin = margin(b = 15),
      family = getOption("ggplot_chinese_font", "SimSun")
    ),
    plot.caption = element_text(
      hjust = 1, 
      size = 9, 
      color = "grey50",
      margin = margin(t = 10),
      family = getOption("ggplot_chinese_font", "SimSun")
    ),
    
    # 图例设置（科研论文风格）- 明确指定字体
    legend.position = "right",
    legend.title = element_text(face = "bold", size = 11, family = getOption("ggplot_chinese_font", "SimSun")),
    legend.text = element_text(size = 10, family = getOption("ggplot_chinese_font", "SimSun")),
    legend.background = element_rect(fill = "white", color = "grey80", linewidth = 0.3),
    legend.margin = margin(6, 6, 6, 6),
    legend.key.size = unit(0.6, "cm"),
    
    # 网格和背景
    panel.grid.major = element_blank(),
    panel.grid.minor = element_blank(),
    panel.background = element_rect(fill = "white", color = NA),
    plot.background = element_rect(fill = "white", color = NA),
    
    # 坐标轴设置 - 明确指定字体
    axis.text.y = element_text(size = 10, color = "grey20", family = getOption("ggplot_chinese_font", "SimSun")),
    axis.text.x = element_text(size = 10, face = "bold", color = "grey20", family = getOption("ggplot_chinese_font", "SimSun")),
    axis.title.y = element_text(size = 11, face = "bold", margin = margin(r = 10), family = getOption("ggplot_chinese_font", "SimSun")),
    axis.title.x = element_blank(),
    axis.line = element_line(color = "grey50", linewidth = 0.3),
    axis.ticks = element_line(color = "grey50", linewidth = 0.3),
    
    # 整体边距
    plot.margin = margin(15, 15, 15, 15)
  )

# 显示图表
# 注意：如果在 WebR 中遇到 PNG 设备错误，尝试以下选项：
# options(webr.plot.backend = "canvas")  # 使用 Canvas 后端
print(p)

# ==========================================
# 配色设计说明
# ==========================================
# 
# 【当前设计】灰色流动带 + 彩色节点标签
# 设计理念：
#   - 流动带：统一灰色（grey70, alpha=0.5），叠加部分自动加深
#     优点：突出流动路径，不干扰节点颜色，视觉清晰
#   
#   - 节点标签：三层渐变配色（深→中→浅）
#     第一层（能源来源）：深色系 - 8种能源类型
#     第二层（转换过程）：中色系 - 8种转换方式
#     第三层（终端使用）：浅色系 - 5种使用场景
#     优点：层次分明，一眼看出能量流动方向
# 
`
  },
  {
    id: 'histogram-ridgeline',
    name: '直方脊线图',
    description: '使用 ggridges 创建的直方脊线图，适合展示多个分布的对比，使用直方图而非密度曲线',
    category: '高级图表',
    requiredPackages: ['ggplot2', 'ggridges', 'dplyr', 'forcats'],
    code: `# 加载包
library(ggridges)
library(ggplot2)
library(dplyr)
library(forcats)

# 创建数据
set.seed(123)
data <- data.frame(
  text = rep(c("Almost Certainly", "Very Good Chance", "We Believe", "Likely", 
               "About Even", "Little Chance", "Chances Are Slight", "Almost No Chance"), 
             each = 46),
  value = c(
    # Almost Certainly (46 values)
    c(95,95,95,95,98,95,85,97,95,90,90,99,60,88.7,99,95,97,99,95,95,90,92,98,98,90,95,95,98,85,80,98,96,99,85,90,95,98,98,80,95,99,85,90,95,85,95),
    # Very Good Chance (46 values)
    c(80,75,85,85,95,99,95,95,95,85,90,97,80,69,98,90,90,95,95,90,80,85,90,92,90,85,90,95,85,15,80,85,85,84,95,85,96,96,90,90,90,80,70,80,90,80),
    # We Believe (46 values)
    c(66,51,80,80,65,80,80,75,65,65,80,90,60,50,5,85,75,80,75,50,60,85,85,70,80,50,60,75,50,60,60,80,50,60,60,75,70,45,70,85,90,65,70,100,95,55),
    # Likely (46 values)
    c(75,51,70,70,70,90,80,70,70,70,70,75,70,51,85,70,51,60,60,80,75,60,80,85,75,75,60,85,60,65,65,75,80,50,70,64,90,75,80,80,90,70,75,75,65,75),
    # About Even (46 values)
    c(50,50,50,50,50,50,45,50,50,52,50,50,50,50,50,50,50,50,50,50,50,50,49,50,50,50,50,50,50,50,50,50,50,50,40,50,50,52,50,48,50,45,50,50,50,49),
    # Little Chance (46 values)
    c(20,5,20,20,5,5,20,20,15,20,20,17,10,13,100,15,15,10,25,25,20,7,2,17,20,10,15,10,10,29,15,20,5,20,4,8,8,18,10,15,5,10,5,10,25,17),
    # Chances Are Slight (46 values)
    c(25,10,5,5,2,3,20,5,15,6,10,3,5,3,90,5,7,5,5,5,5,3,5,3,10,5,20,5,15,15,8,5,10,15,2,5,5,3,10,5,30,15,10,5,5,10),
    # Almost No Chance (46 values)
    c(5,5,1,1,1,1,10,3,5,10,15,2,5,2,95,1,2,1,5,5,5,3,5,2,2,2,5,2,1,7,1,10,0.05,5,2,2,1,7,1,5,1,5,2,1,2,5)
  )
)

# 使用 ggplot2 和 ggridges 创建静态脊线图
p <- data %>%
  mutate(text = fct_reorder(text, value)) %>%
  ggplot(aes(y=text, x=value, fill=text)) +
    geom_density_ridges(alpha=0.6, stat="binline", bins=20) +
    theme_ridges(font_family = getOption("ggplot_chinese_font", "SimSun")) +
    theme(
      legend.position="none",
      panel.spacing = unit(0.1, "lines"),
      strip.text.x = element_text(size = 8)
    ) +
    labs(title = "直方脊线图",
         x = "",
         y = "分配概率 (%)")

# 保存为 PNG 文件
print(p)
`
  },
  {
    id: 'ridgeline-plot',
    name: '脊线图',
    description: '使用 ggridges 创建的温度分布脊线图，展示林肯市2016年各月温度分布情况',
    category: '高级图表',
    requiredPackages: ['ggplot2', 'ggridges', 'viridis'],
    code: `# 加载包
library(ggridges)
library(ggplot2)
library(viridis)

# 使用 ggridges 包内置的 lincoln_weather 数据集
# 该数据集包含2016年美国内布拉斯加州林肯市的天气数据

# 创建脊线图
p <- ggplot(lincoln_weather, aes(x = \`Mean Temperature [F]\`, y = \`Month\`, fill = after_stat(x))) +
  geom_density_ridges_gradient(scale = 3, rel_min_height = 0.01) +
  scale_fill_viridis(name = "温度 [F]", option = "C") +
  labs(title = '2016年林肯市温度分布',
       x = "平均温度 [华氏度]",
       y = "月份") +
  theme_minimal(base_family = getOption("ggplot_chinese_font", "SimSun")) +
  theme(
    legend.position = "right",
    panel.spacing = unit(0.1, "lines"),
    strip.text.x = element_text(size = 8),
    plot.title = element_text(hjust = 0.5, face = "bold", family = getOption("ggplot_chinese_font", "SimSun")),
    axis.title = element_text(family = getOption("ggplot_chinese_font", "SimSun")),
    axis.text = element_text(family = getOption("ggplot_chinese_font", "SimSun")),
    legend.title = element_text(family = getOption("ggplot_chinese_font", "SimSun"))
  )

# 显示图表
print(p)
`
  }
  // 可以在这里添加更多模板
];

/**
 * 按类别分组模板
 */
export function getTemplatesByCategory(): Record<string, CodeTemplate[]> {
  const grouped: Record<string, CodeTemplate[]> = {};
  
  codeTemplates.forEach(template => {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  });
  
  return grouped;
}

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): CodeTemplate | undefined {
  return codeTemplates.find(template => template.id === id);
}

