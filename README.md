# 🎨 GGplotChim

**GGplotChim** 是一个可视化的 ggplot2 编程工具，让 R 语言数据可视化变得像搭积木一样简单！

通过拖拽积木的方式，无需记忆复杂语法，即可创建专业的 ggplot2 图表代码。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 特性

- 🧩 **拖拽式编程** - 像搭积木一样创建 ggplot2 代码
- 📊 **9 大积木类别** - 覆盖 ggplot2 全部核心功能
- 💻 **实时代码生成** - 所见即所得的 R 代码预览
- 🎨 **美观的界面** - 现代化三栏布局设计
- 📝 **代码导出** - 一键复制/下载生成的 R 代码
- 🚀 **零配置启动** - 开箱即用

---

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/ggplotchim.git
cd ggplotchim

# 安装依赖
npm install
```

### 运行

```bash
# 启动开发服务器
npm start

# 应用将在 http://localhost:8080 自动打开
```

### 构建

```bash
# 生产构建
npm run build

# 输出到 dist/ 目录
```

---

## 📖 使用指南

### 基本流程

1. **导入数据** - 从左侧拖拽"导入数据"积木
2. **创建画布** - 添加"创建 ggplot 画布"积木
3. **选择图表类型** - 拖拽几何对象积木（散点、折线、柱状等）
4. **美化图表** - 添加主题、标签、颜色等
5. **导出代码** - 在右侧复制或下载生成的 R 代码

### 界面布局

```
┌─────────────┬──────────────────┬─────────────┐
│             │                  │             │
│  积木面板   │   可视化画布     │  预览面板   │
│  (左侧)     │   (中间)         │  (右侧)     │
│             │                  │             │
│  9大类积木  │  拖放积木区域    │  代码预览   │
│  分类切换   │  自由组合        │  图表预览   │
│             │                  │             │
└─────────────┴──────────────────┴─────────────┘
```

---

## 🧩 积木类别

| 类别 | 说明 | 示例 |
|------|------|------|
| 📊 数据 | 数据导入与处理 | `read.csv()`, `filter()` |
| 📈 几何对象 | 图表类型 | `geom_point()`, `geom_bar()` |
| 🎨 美学映射 | 数据映射 | `aes(x, y, color)` |
| 📏 标度 | 坐标轴与图例 | `scale_x_continuous()` |
| 🎭 主题 | 视觉风格 | `theme_minimal()` |
| 📐 坐标系 | 坐标变换 | `coord_flip()` |
| 📊 统计 | 统计变换 | `stat_smooth()` |
| 🔲 分面 | 多子图 | `facet_wrap()` |
| 🏷️ 标签 | 标题与注释 | `labs(title, x, y)` |

---

## 💻 技术栈

### 核心技术
- **React 18** - UI 框架
- **TypeScript 5** - 类型安全
- **Zustand** - 状态管理
- **Monaco Editor** - 代码编辑器（VS Code 引擎）

### 构建工具
- **Webpack 5** - 模块打包
- **Babel** - JavaScript 编译器
- **CSS** - 原生样式

### 未来集成
- **WebR** - 浏览器端 R 运行时（开发中）

---

## 📂 项目结构

```
GGPLOTCHIM/
├── public/
│   └── index.html              # HTML 入口
├── src/
│   ├── components/             # React 组件
│   │   ├── BlockPalette.tsx    # 积木面板
│   │   ├── Canvas.tsx          # 画布
│   │   ├── BlockNode.tsx       # 积木节点
│   │   ├── PreviewPanel.tsx    # 预览面板
│   │   ├── CodePreview.tsx     # 代码预览
│   │   └── PlotPreview.tsx     # 图表预览
│   ├── data/
│   │   └── blockDefinitions.ts # 积木定义数据
│   ├── store/
│   │   └── useBlockStore.ts    # Zustand 状态管理
│   ├── types/
│   │   └── blocks.ts           # TypeScript 类型
│   ├── utils/
│   │   └── codeGenerator.ts    # R 代码生成器
│   ├── styles/
│   │   └── main.css            # 全局样式
│   ├── App.tsx                 # 主应用组件
│   └── index.tsx               # 应用入口
├── .babelrc                    # Babel 配置
├── webpack.config.js           # Webpack 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 依赖管理
├── README.md                   # 项目说明
├── USER_GUIDE.md               # 使用指南
└── DEVELOPMENT_PLAN.md         # 开发计划
```

---

## 🎯 功能状态

### ✅ 已实现

- [x] 三栏响应式布局
- [x] 9 大类积木系统（20+ 种积木）
- [x] 拖拽式积木编程
- [x] 实时 R 代码生成
- [x] Monaco Editor 代码预览
- [x] 代码复制/下载
- [x] 积木删除与清空
- [x] TypeScript 类型安全

### 🚧 开发中

- [ ] 积木参数编辑面板
- [ ] WebR 集成（浏览器运行 R）
- [ ] 图表实时预览
- [ ] 项目保存/加载

### 📅 计划中

- [ ] 更多积木类型
- [ ] 积木模板库
- [ ] 图表导出（PNG/SVG/PDF）
- [ ] 多语言支持
- [ ] 在线示例库
- [ ] 协作功能

---

## 🎬 示例

### 创建散点图

**操作步骤：**
1. 拖拽 [📊 导入数据] → `iris.csv`
2. 拖拽 [📊 创建画布] → `x = Sepal.Length, y = Petal.Length`
3. 拖拽 [📈 散点图] → `color = Species`
4. 拖拽 [🏷️ 标签] → `title = "鸢尾花数据分析"`
5. 拖拽 [🎭 主题] → `theme_minimal()`

**生成代码：**
```r
library(ggplot2)
library(dplyr)

data <- read.csv("iris.csv")

plot <- data %>%
  ggplot(aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.7) +
  labs(title = "鸢尾花数据分析") +
  theme_minimal()

print(plot)
```

---

## 🤝 贡献

欢迎各种形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📚 文档

- [使用指南](USER_GUIDE.md) - 详细使用说明
- [开发计划](DEVELOPMENT_PLAN.md) - 项目规划与进度
- [ggplot2 官方文档](https://ggplot2.tidyverse.org/)

---

## 🐛 问题反馈

遇到问题？请提交 [Issue](https://github.com/yourusername/ggplotchim/issues)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [ggplot2](https://ggplot2.tidyverse.org/) - R 语言最强大的可视化包
- [React](https://react.dev/) - 构建用户界面的 JavaScript 库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code 的代码编辑器引擎
- [Zustand](https://github.com/pmndrs/zustand) - 简洁强大的状态管理

---

<p align="center">
  Made with ❤️ by GGplotChim Team
</p>

<p align="center">
  <strong>让 ggplot2 编程像搭积木一样简单！</strong>
</p>
