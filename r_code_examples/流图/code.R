# 加载包
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
  theme_minimal(base_family = getOption("ggplot_chinese_font", "SimSun")) +
  labs(title = "流图",
       x = "年份",
       y = "值",
       fill = "类别") +
  theme(legend.position = "right")

# 保存为 PNG 文件
print(p)
