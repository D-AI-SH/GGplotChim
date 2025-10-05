# 加载包
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
    labs(title = "脊线图",
         x = "",
         y = "分配概率 (%)")

# 保存为 PNG 文件
print(p)
