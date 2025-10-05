# 加载包
library(ggridges)
library(ggplot2)
library(viridis)

# 使用 ggridges 包内置的 lincoln_weather 数据集
# 该数据集包含2016年美国内布拉斯加州林肯市的天气数据

# 创建脊线图
p <- ggplot(lincoln_weather, aes(x = `Mean Temperature [F]`, y = `Month`, fill = after_stat(x))) +
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
