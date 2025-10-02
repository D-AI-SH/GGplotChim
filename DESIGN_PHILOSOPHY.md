# GGplotChim 设计理念

## 📐 图层语法 (Grammar of Graphics)

### 核心哲学

**GGplotChim 不是提供预制的"折线图"、"散点图"模块，而是提供基础的 ggplot2 语句积木，让用户通过自由组合来创建个性化图表。**

这正是 ggplot2 的核心理念 —— **图层语法**。

---

## 🧩 积木设计原则

### 1. 语句级封装，而非图表级封装

❌ **错误示例：** 提供一个"折线图"积木，内部包含 `ggplot() + aes() + geom_line()`

✅ **正确示例：** 分别提供 `ggplot()`, `aes()`, `geom_line()` 三个独立积木

### 2. 参数完全暴露，而非预设选项

❌ **错误示例：** `geom_point()` 只提供"小、中、大"三种点大小

✅ **正确示例：** `geom_point()` 提供 `size` 参数，用户可以输入任意数值或变量名

### 3. 保持 R 语法的灵活性

每个积木应该：
- 直接对应一个 ggplot2 函数
- 参数名与 R 函数参数一致
- 支持传入变量名、表达式、函数调用

---

## 🎨 示例：如何创建一个散点图

### 传统方式（拖出一个"散点图"模块）
```
❌ 这种方式限制了用户的创造力
```

### GGplotChim 方式（组合基础语句）
```r
# 1. 加载数据
data <- iris

# 2. 创建 ggplot 对象
ggplot(data)

# 3. 添加美学映射
+ aes(x = Sepal.Length, y = Sepal.Width, color = Species)

# 4. 添加点几何对象
+ geom_point(size = 3, alpha = 0.7)

# 5. 添加平滑曲线
+ geom_smooth(method = "lm", se = TRUE)

# 6. 设置标题
+ labs(title = "鸢尾花萼片尺寸关系")

# 7. 应用主题
+ theme_minimal()
```

### 优势
- ✅ 用户可以**自由组合**任意图层
- ✅ 可以同时添加**多个几何对象**（点 + 线 + 平滑曲线）
- ✅ 每个参数都可以**精确控制**
- ✅ **学习 ggplot2 真正的语法**，而不是被工具限制

---

## 🚀 10 大积木类别

### 1. 📊 数据层 (Data)
```r
data <- iris           # 数据赋值
ggplot(data)           # 创建画布
```

### 2. 🎨 美学映射 (Aesthetics)
```r
aes(x = ..., y = ..., color = ..., size = ...)
```

### 3. 📈 几何对象 (Geoms)
```r
geom_point()           # 点
geom_line()            # 线
geom_bar()             # 柱
geom_boxplot()         # 箱线图
geom_histogram()       # 直方图
geom_smooth()          # 趋势线
geom_text()            # 文本
geom_area()            # 面积图
```

### 4. 📏 标度 (Scales)
```r
scale_x_continuous()   # X 轴连续标度
scale_y_continuous()   # Y 轴连续标度
scale_color_manual()   # 手动设置颜色
scale_fill_gradient()  # 渐变填充
scale_color_brewer()   # ColorBrewer 调色板
```

### 5. 📐 坐标系 (Coordinates)
```r
coord_flip()           # 翻转坐标轴
coord_cartesian()      # 笛卡尔坐标系
coord_polar()          # 极坐标系（饼图）
```

### 6. 🔲 分面 (Facets)
```r
facet_wrap(~Species)   # 单变量分面
facet_grid(rows = vars(...), cols = vars(...))  # 网格分面
```

### 7. 📊 统计变换 (Stats)
```r
stat_summary()         # 统计汇总
stat_smooth()          # 平滑统计
```

### 8. 🏷️ 标签 (Labels)
```r
labs(title = ..., x = ..., y = ...)
ggtitle("标题")
xlab("X 轴")
ylab("Y 轴")
```

### 9. 🎭 主题 (Themes)
```r
theme_minimal()        # 极简主题
theme_classic()        # 经典主题
theme_bw()             # 黑白主题
theme(...)             # 自定义主题
```

### 10. ➕ 图层叠加
所有积木通过 `+` 运算符连接，形成图层叠加

---

## 💡 实际案例

### 案例 1：创建一个复杂的多层图表

**目标：** 散点图 + 回归线 + 置信区间 + 分组颜色 + 自定义主题

**积木组合：**
```r
data <- mtcars
ggplot(data)
+ aes(x = wt, y = mpg, color = factor(cyl))
+ geom_point(size = 3, alpha = 0.6)
+ geom_smooth(method = "lm", se = TRUE)
+ labs(
    title = "汽车重量与油耗的关系",
    x = "重量 (1000 lbs)",
    y = "油耗 (mpg)",
    color = "气缸数"
  )
+ scale_color_manual(values = c("red", "blue", "green"))
+ theme_minimal()
+ theme(legend.position = "bottom")
```

### 案例 2：创建分面直方图

```r
data <- iris
ggplot(data)
+ aes(x = Sepal.Length, fill = Species)
+ geom_histogram(bins = 20, alpha = 0.7)
+ facet_wrap(~Species, ncol = 3)
+ labs(title = "不同品种鸢尾花的萼片长度分布")
+ theme_bw()
```

### 案例 3：创建极坐标饼图

```r
data <- data.frame(
  category = c("A", "B", "C", "D"),
  value = c(30, 25, 20, 25)
)
ggplot(data)
+ aes(x = "", y = value, fill = category)
+ geom_bar(stat = "identity", width = 1)
+ coord_polar(theta = "y")
+ theme_void()
```

---

## 🎯 与传统图表工具的对比

| 特性 | 传统图表工具 | GGplotChim |
|------|------------|-----------|
| **封装粒度** | 图表级（折线图、柱状图） | 语句级（geom_line, geom_bar） |
| **灵活性** | 受限于预设模板 | 完全自由组合 |
| **学习曲线** | 快速上手，但深入困难 | 稍慢，但学到真正的 ggplot2 |
| **个性化** | 只能在预设范围内调整 | 无限可能 |
| **代码质量** | 生成简化的代码 | 生成标准的 ggplot2 代码 |
| **适用场景** | 快速原型 | 学习 + 专业绘图 |

---

## 🌟 设计优势

### 1. 教育价值
用户通过拖拽积木，**实际上在学习 ggplot2 的真正语法**：
- 理解图层叠加的概念
- 学习每个函数的作用和参数
- 培养数据可视化的思维方式

### 2. 专业性
生成的代码是**标准的 ggplot2 代码**，可以直接在 R 中使用：
- 可读性高
- 易于修改
- 符合最佳实践

### 3. 创造力
用户可以创建**任意复杂度的图表**：
- 多个几何对象叠加
- 复杂的美学映射
- 自定义统计变换
- 独特的主题样式

### 4. 可扩展性
添加新功能只需添加新的**语句积木**：
- 不需要重新设计整个系统
- 保持一致的使用体验
- 积木数量可以无限增长

---

## 📚 给初学者的建议

### 最小可用图表
```r
data <- iris
ggplot(data)
+ aes(x = Sepal.Length, y = Sepal.Width)
+ geom_point()
```

### 逐步增强
```r
# 1. 基础图表
data <- iris
ggplot(data) + aes(x = Sepal.Length, y = Sepal.Width) + geom_point()

# 2. 添加颜色
+ aes(color = Species)

# 3. 添加趋势线
+ geom_smooth(method = "lm")

# 4. 添加标题
+ labs(title = "鸢尾花萼片尺寸")

# 5. 美化主题
+ theme_minimal()
```

---

## 🔮 未来扩展

### 更多几何对象
- `geom_density()` - 密度图
- `geom_violin()` - 小提琴图
- `geom_tile()` - 热力图
- `geom_polygon()` - 多边形
- `geom_path()` - 路径

### 更多统计变换
- `stat_bin()` - 分箱统计
- `stat_count()` - 计数统计
- `stat_identity()` - 原值统计
- `stat_density()` - 密度统计

### 位置调整
- `position_dodge()` - 并列
- `position_stack()` - 堆叠
- `position_jitter()` - 抖动

### 数据操作
- `dplyr::filter()` - 数据筛选
- `dplyr::mutate()` - 变量计算
- `dplyr::group_by()` - 分组

---

## 💬 设计哲学总结

> **"Give users the building blocks, not the finished buildings."**
>
> **"提供构建积木，而非成品建筑。"**

GGplotChim 的目标不是让用户快速生成一个"标准"图表，而是让用户：
1. **理解** ggplot2 的图层语法
2. **掌握** 每个语句的作用和参数
3. **创造** 独一无二的个性化图表
4. **学习** 数据可视化的最佳实践

通过语句级的积木封装，我们尊重 ggplot2 的设计哲学，同时降低编程门槛，让更多人享受数据可视化的乐趣。

---

**GGplotChim - 用积木搭建图层语法** 🎨🧩

最后更新：2025年10月2日

