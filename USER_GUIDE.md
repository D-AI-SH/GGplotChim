# GGplotChim 使用指南 📚

## 🎯 快速开始

### 启动应用

```bash
npm install   # 安装依赖
npm start     # 启动开发服务器
```

应用将在 `http://localhost:8080` 打开

---

## 🖥️ 界面介绍

GGplotChim 采用**三栏布局**：

### 1️⃣ 左侧：积木面板
- 包含 9 大类积木
- 点击分类标签切换
- 拖拽积木到画布使用

### 2️⃣ 中间：可视化画布
- 拖放积木到此区域
- 点击积木查看/编辑参数
- 自由组合积木创建图表

### 3️⃣ 右侧：预览面板
- **代码预览**：实时生成 R 代码
- **图表预览**：查看生成的图表（开发中）

---

## 🧩 积木分类

### 📊 数据类
- **导入数据**：读取 CSV/RDS 等数据文件
- **数据转换**：筛选、排序、分组等操作

### 📈 几何对象（Geom）
- `geom_point()`：散点图
- `geom_line()`：折线图
- `geom_bar()`：柱状图
- `geom_histogram()`：直方图
- `geom_boxplot()`：箱线图
- `geom_violin()`：小提琴图
- 更多...

### 🎨 美学映射（Aes）
- 映射 x、y 轴
- 颜色、大小、形状映射
- 分组、透明度等

### 📏 标度（Scale）
- 连续标度、离散标度
- 颜色标度、大小标度
- 坐标轴变换

### 🎭 主题（Theme）
- `theme_minimal()`
- `theme_classic()`
- `theme_bw()`
- 自定义主题

### 🏷️ 标签（Labs）
- 设置标题、副标题
- 坐标轴标签
- 图例标签

### 🔲 分面（Facet）
- `facet_wrap()`：按单变量分面
- `facet_grid()`：按两变量分面

---

## 📝 使用流程

### Step 1: 导入数据
从左侧拖拽**"导入数据"**积木到画布

### Step 2: 创建画布
添加**"创建 ggplot 画布"**积木，设置 x、y 映射

### Step 3: 添加几何对象
选择合适的 geom 积木（散点、折线、柱状等）

### Step 4: 美化图表
- 添加主题积木
- 设置标签积木
- 调整颜色、标度等

### Step 5: 导出代码
- 在右侧预览面板查看生成的 R 代码
- 点击**"复制"**按钮复制代码
- 点击**"下载"**按钮保存为 .R 文件

---

## 💡 使用技巧

### ✅ 最佳实践

1. **按顺序添加积木**
   - 先数据 → 再画布 → 然后几何对象 → 最后美化

2. **点击积木编辑参数**
   - 每个积木都可以自定义参数
   - 参数会实时反映在代码中

3. **善用分类切换**
   - 9 个分类涵盖 ggplot2 全部功能
   - 快速找到需要的积木

4. **实时预览代码**
   - 右侧代码实时更新
   - 随时复制到 RStudio 运行

### 🎨 示例工作流

**创建一个散点图：**

```
1. [数据] 导入数据 → data.csv
2. [数据] 创建画布 → aes(x = height, y = weight)
3. [几何] 散点图 → geom_point(color = "blue", size = 3)
4. [标签] 设置标题 → labs(title = "身高体重关系图")
5. [主题] 应用主题 → theme_minimal()
```

生成的代码：
```r
library(ggplot2)
library(dplyr)

data <- read.csv("data.csv")

plot <- data %>%
  ggplot(aes(x = height, y = weight)) +
  geom_point(color = "blue", size = 3) +
  labs(title = "身高体重关系图") +
  theme_minimal()

print(plot)
```

---

## 🔧 功能列表

### ✅ 已实现

- ✅ 拖拽式积木编程
- ✅ 9 大类积木（20+ 种积木）
- ✅ 实时代码生成
- ✅ 代码复制/下载
- ✅ 积木参数编辑（UI 开发中）
- ✅ 积木删除
- ✅ 画布清空

### 🚧 开发中

- 🚧 积木参数编辑面板（右键/点击编辑）
- 🚧 WebR 集成（浏览器运行 R 代码）
- 🚧 图表实时预览
- 🚧 项目保存/加载
- 🚧 导出图表（PNG/SVG/PDF）

### 📅 未来计划

- 📅 更多积木类型
- 📅 积木模板库
- 📅 代码美化选项
- 📅 多语言支持
- 📅 在线示例库
- 📅 协作功能

---

## 🐛 常见问题

### Q1: 为什么看不到图表预览？
**A**: 图表预览功能需要集成 WebR，目前正在开发中。您可以先复制代码到 RStudio 运行。

### Q2: 如何编辑积木参数？
**A**: 参数编辑面板正在开发中。当前版本使用默认参数，可以手动修改生成的代码。

### Q3: 代码能直接在 R 中运行吗？
**A**: 可以！复制代码到 RStudio 或 R 控制台，确保安装了 ggplot2 和 dplyr 包即可运行。

### Q4: 支持哪些数据格式？
**A**: 目前支持 CSV、RDS、Excel 等常见格式，通过 R 的 `read.csv()` 等函数导入。

---

## 🚀 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **代码编辑器**: Monaco Editor（VS Code 引擎）
- **打包工具**: Webpack 5
- **样式**: 原生 CSS
- **未来集成**: WebR（浏览器端 R 运行时）

---

## 📚 相关资源

- [ggplot2 官方文档](https://ggplot2.tidyverse.org/)
- [R for Data Science](https://r4ds.had.co.nz/)
- [ggplot2 速查表](https://rstudio.github.io/cheatsheets/data-visualization.pdf)

---

## 🤝 贡献指南

欢迎提交 Issue 和 PR！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

---

**祝您使用愉快！🎉**

如有问题或建议，欢迎反馈！

