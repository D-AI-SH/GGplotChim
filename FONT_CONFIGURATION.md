# 字体配置指南

## 概述

GGplotChim 支持为图表配置中文和英文字体。默认配置为：
- **中文字体**：宋体 (SimSun)
- **英文字体**：Times Roman (Times)

## 配置方法

### 1. 通过界面配置

1. 点击顶部工具栏的 **"字体"** 按钮
2. 在弹出的字体选择器中选择中文和英文字体
3. 点击 **"确认应用"** 保存配置

### 2. 在R代码中使用字体配置

系统会自动将字体配置保存到R的全局选项中，可以在代码中使用：

```r
# 获取用户配置的中文字体（默认宋体）
chinese_font <- getOption("ggplot_chinese_font", "SimSun")

# 获取用户配置的英文字体（默认Times）
english_font <- getOption("ggplot_english_font", "Times")

# 在主题中使用
ggplot(data, aes(x, y)) +
  geom_point() +
  theme_minimal(base_family = chinese_font) +
  labs(title = "我的图表")
```

## 可用字体列表

### 中文字体

| 字体名称 | R 值 | 描述 |
|---------|------|------|
| 宋体 | `SimSun` | 经典衬线字体，适合正式文档 |
| 黑体 | `SimHei` | 无衬线字体，清晰易读 |
| 楷体 | `KaiTi` | 书法风格，优雅美观 |
| 仿宋 | `FangSong` | 印刷体，古典风格 |
| 微软雅黑 | `Microsoft YaHei` | 现代无衬线字体 |
| 华文宋体 | `STSong` | 清晰的衬线字体 |
| 华文黑体 | `STHeiti` | 粗黑体，醒目突出 |
| 华文楷体 | `STKaiti` | 流畅的书法体 |

### 英文字体

| 字体名称 | R 值 | 描述 |
|---------|------|------|
| Times Roman | `Times` | 经典衬线字体，学术标准 |
| Times New Roman | `Times New Roman` | 改进版Times，更清晰 |
| Arial | `Arial` | 现代无衬线字体，清晰易读 |
| Helvetica | `Helvetica` | 经典无衬线字体，简洁专业 |
| Calibri | `Calibri` | Office默认字体，温和友好 |
| Georgia | `Georgia` | 屏显衬线字体，优雅大方 |
| Palatino | `Palatino` | 文艺复兴风格，适合阅读 |
| Garamond | `Garamond` | 法国古典字体，精致优雅 |
| Courier | `Courier` | 等宽字体，适合代码 |
| Verdana | `Verdana` | 宽松字距，网页友好 |

## 示例代码

### 完整示例：使用动态字体配置

```r
# 加载必需的包
library(ggplot2)
library(dplyr)

# 获取用户配置的字体
cn_font <- getOption("ggplot_chinese_font", "SimSun")
en_font <- getOption("ggplot_english_font", "Times")

# 创建数据
data <- data.frame(
  category = c("分类A", "分类B", "分类C", "分类D"),
  value = c(23, 45, 56, 32)
)

# 创建图表
p <- ggplot(data, aes(x = category, y = value, fill = category)) +
  geom_col() +
  labs(
    title = "销售数据分析 Sales Analysis",
    subtitle = "2024年第一季度 Q1 2024",
    x = "产品类别 Product Category",
    y = "销售额 Sales (万元)",
    caption = "数据来源：内部统计 Data Source: Internal Statistics"
  ) +
  theme_minimal(base_size = 12, base_family = cn_font) +
  theme(
    plot.title = element_text(hjust = 0.5, face = "bold", size = 16),
    plot.subtitle = element_text(hjust = 0.5, size = 12),
    axis.text = element_text(size = 11),
    axis.title = element_text(size = 12, face = "bold"),
    legend.text = element_text(size = 10),
    legend.title = element_text(size = 11, face = "bold")
  )

# 显示图表
print(p)
```

### 混合字体示例（中英文分别设置）

```r
# 注意：WebR 环境可能不完全支持混合字体
# 推荐使用 base_family 设置主要字体，系统会自动处理中英文混排

library(ggplot2)

# 获取字体配置
main_font <- getOption("ggplot_chinese_font", "SimSun")

ggplot(mtcars, aes(x = mpg, y = wt)) +
  geom_point() +
  labs(
    title = "汽车性能分析 Vehicle Performance",
    x = "油耗 Miles per Gallon",
    y = "重量 Weight"
  ) +
  theme_classic(base_family = main_font)
```

## 注意事项

1. **WebR 环境限制**：
   - WebR 在浏览器中运行，字体支持依赖于浏览器的字体渲染能力
   - 某些特殊字体可能无法正常显示
   - 推荐使用系统常见字体以确保兼容性

2. **字体回退**：
   - 如果指定字体不可用，系统会自动回退到默认字体
   - 中文默认：宋体 (SimSun)
   - 英文默认：Times Roman (Times)

3. **实时更新**：
   - 更改字体配置后，需要重新运行代码才能看到效果
   - 无需重启应用，字体配置会实时生效

4. **最佳实践**：
   - 学术论文：宋体 + Times Roman
   - 商业报告：微软雅黑 + Arial
   - 演示文稿：黑体 + Helvetica
   - 技术文档：等线体 + Courier

## 技术实现

字体配置通过以下方式实现：

1. **全局选项**：配置存储在 R 的 `options()` 中
   ```r
   options(
     ggplot_chinese_font = "SimSun",
     ggplot_english_font = "Times"
   )
   ```

2. **主题继承**：所有使用 `base_family` 的主题都会自动应用配置
   ```r
   theme_minimal(base_family = getOption("ggplot_chinese_font", "SimSun"))
   ```

3. **浏览器缓存**：配置保存在 Zustand store 中，刷新页面后保持

## 故障排除

### 问题：中文显示为方块或乱码

**解决方案**：
1. 检查浏览器是否安装了所选字体
2. 尝试更换为常见字体（如宋体、黑体）
3. 清除浏览器缓存后重试

### 问题：字体配置未生效

**解决方案**：
1. 确认已点击"确认应用"按钮
2. 重新运行 R 代码
3. 检查代码中是否使用了 `getOption()` 获取字体配置

### 问题：英文字体影响中文显示

**解决方案**：
- 在 WebR 环境中，建议主要使用中文字体设置
- 中文字体通常已包含英文字符的支持
- 英文字体配置主要用于将来的扩展功能

## 相关文档

- [WebR 官方文档](https://docs.r-wasm.org/webr/latest/)
- [ggplot2 主题文档](https://ggplot2.tidyverse.org/reference/theme.html)
- [R 字体管理](https://cran.r-project.org/web/packages/extrafont/README.html)

