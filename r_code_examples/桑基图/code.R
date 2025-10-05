# ==========================================
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




