# 📦 R 包管理功能说明

## 🎯 功能概述

GGplotChim 现在提供了完整的 R 包管理功能，包括：

1. **丰富的预设包列表** - 包含 60+ 个常用 R 包
2. **自定义包添加** - 用户可以添加任意 CRAN 包
3. **智能镜像源选择** - 自动选择离用户最近的 CRAN 镜像源
4. **包管理界面** - 随时打开包管理器添加新包

---

## 📚 预设包列表

### ✅ 必需包
- **ggplot2** - 强大的数据可视化包（必需）

### 📊 ggplot2 扩展包
- **ggstream** - 流图（Stream Graph）
- **ggridges** - 山脊图（Ridge Plot）
- **ggalluvial** - 冲积图（Alluvial Diagram）
- **ggforce** - ggplot2 增强功能
- **ggrepel** - 自动避让的文本标签
- **gganimate** - 创建动画图表
- **ggpubr** - 出版级图表
- **ggthemes** - 额外的主题样式
- **ggcorrplot** - 相关性热图
- **ggtree** - 系统发育树可视化
- **ggraph** - 网络图和树形图
- **patchwork** - 组合多个 ggplot 图表
- **cowplot** - 出版级图表主题和布局
- **gridExtra** - 图表网格布局

### 🎨 配色方案
- **viridis** - 色盲友好的配色方案
- **RColorBrewer** - ColorBrewer 配色方案
- **scales** - 坐标轴刻度和标签格式化
- **ggsci** - 科学期刊配色方案
- **wesanderson** - Wes Anderson 电影配色

### 🔧 Tidyverse 系列
- **dplyr** - 数据处理和转换
- **tidyr** - 数据整理和重塑（包含 gather 等）
- **readr** - 快速读取数据文件
- **tibble** - 现代化的数据框
- **stringr** - 字符串处理
- **forcats** - 因子处理
- **purrr** - 函数式编程工具
- **lubridate** - 日期时间处理

### 🕸️ 网络图和流程图
- **networkD3** - 交互式网络图和桑基图（Sankey Diagram）
- **igraph** - 网络分析和可视化
- **visNetwork** - 交互式网络可视化
- **DiagrammeR** - 流程图和图表

### 🗺️ 地理空间可视化
- **sf** - 空间数据处理
- **leaflet** - 交互式地图
- **maps** - 地图数据
- **mapdata** - 额外地图数据
- **mapproj** - 地图投影

### ⚡ 交互式可视化
- **plotly** - 交互式图表
- **DT** - 交互式数据表格
- **htmlwidgets** - HTML 小部件框架
- **highcharter** - Highcharts 交互式图表

### 📈 时间序列分析
- **zoo** - 时间序列处理
- **xts** - 可扩展时间序列
- **forecast** - 时间序列预测
- **tseries** - 时间序列分析

### 📊 统计建模
- **car** - 回归分析辅助工具
- **lme4** - 线性混合效应模型
- **nlme** - 非线性混合效应模型
- **survival** - 生存分析
- **MASS** - 统计函数集合
- **caret** - 机器学习训练工具

### 🎯 专业可视化
- **circlize** - 圆形布局可视化
- **vcd** - 分类数据可视化
- **treemap** - 树状图
- **wordcloud** - 词云图
- **corrplot** - 相关系数可视化

### 💾 数据处理和转换
- **jsonlite** - JSON 数据处理
- **reshape2** - 数据重塑（包含 melt/cast）
- **data.table** - 高性能数据处理
- **tidytext** - 文本数据处理
- **haven** - 读取 SPSS/Stata/SAS 数据
- **readxl** - 读取 Excel 文件
- **xml2** - XML 数据处理

### 📝 字符串和文本处理
- **stringi** - 高级字符串处理
- **glue** - 字符串插值
- **tm** - 文本挖掘

### 🔧 实用工具
- **base64enc** - Base64 编码（图表导出需要）
- **knitr** - 动态报告生成
- **rmarkdown** - R Markdown 文档
- **shiny** - 交互式 Web 应用

---

## 🚀 使用方法

### 1. 首次启动选择包

应用启动时会自动弹出包选择器，你可以：

- 点击 **⭐ 推荐包** - 选择运行大多数示例所需的核心包
- 点击 **📊 ggplot2 扩展** - 选择所有 ggplot2 扩展包
- 点击 **🔧 Tidyverse** - 选择 Tidyverse 系列包
- 点击 **✓ 全选** - 选择所有包（首次安装可能需要较长时间）
- 手动勾选需要的包

### 2. 添加自定义包

在包选择器底部的 **➕ 添加自定义包** 区域：

1. 输入包名（如：`ggstream`）
2. 输入描述（可选）
3. 点击 **添加** 按钮
4. 自定义包会出现在列表中，并自动勾选

### 3. 运行时管理包

点击右上角的 **📦 包管理** 按钮，可以随时：

- 查看已安装的包
- 添加新的包
- 重新选择包并安装

---

## 🌍 智能镜像源选择

### 自动选择原理

系统会自动：

1. **检测用户地理位置** - 通过 IP 地理定位 API
2. **选择最近的镜像源** - 优先选择同国家/地区的镜像
3. **测试镜像速度** - 测试前 3 个镜像的响应速度
4. **自动切换** - 如果主镜像失败，自动尝试备用镜像

### 镜像源列表

#### 🇨🇳 中国镜像（最高优先级）
1. 清华大学 - `https://mirrors.tuna.tsinghua.edu.cn/CRAN/`
2. 中国科技大学 - `https://mirrors.ustc.edu.cn/CRAN/`
3. 阿里云 - `https://mirrors.aliyun.com/CRAN/`
4. 兰州大学 - `https://mirror.lzu.edu.cn/CRAN/`

#### 🌏 亚洲其他地区
- 日本（东京）
- 韩国（首尔）
- 新加坡

#### 🌍 欧洲
- 英国（布里斯托）
- 德国（明斯特）
- 法国（里昂）

#### 🌎 北美
- 美国（伯克利、RStudio）
- 加拿大（多伦多）

#### 🏛️ 官方镜像
- CRAN Master（奥地利维也纳）- 作为后备

### 镜像源切换策略

如果包安装失败，系统会：

1. 尝试使用主镜像源（基于地理位置选择）
2. 如果失败，自动切换到第 2 近的镜像源
3. 如果仍然失败，尝试第 3 近的镜像源
4. 最后使用官方 CRAN 主镜像

---

## 🔧 技术细节

### WebR 包安装机制

WebR 使用预编译的 WASM 包，与传统 R 不同：

- ✅ **优点**: 安装速度快，无需编译
- ⚠️ **限制**: 并非所有 CRAN 包都有 WASM 版本
- 📦 **可用包**: 大多数常用包（ggplot2、dplyr、tidyr 等）都可用

### 镜像源配置

虽然 WebR 主要使用预编译包，但系统仍会配置 CRAN 镜像源：

```r
# 在 R 环境中设置
options(repos = c(CRAN = "https://mirrors.tuna.tsinghua.edu.cn/CRAN/"))
```

这对于将来可能的源码包安装或其他功能扩展有帮助。

---

## 💡 使用建议

### 推荐的包组合

#### 🎯 基础使用（最小化）
- ggplot2
- dplyr
- tidyr

#### 📊 数据可视化
- ggplot2
- ggstream（流图）
- ggridges（山脊图）
- patchwork（组合图表）
- viridis（配色）
- RColorBrewer（配色）

#### 🔬 科研出版
- ggplot2
- ggpubr（出版级图表）
- cowplot（主题和布局）
- ggsci（期刊配色）
- scales（格式化）

#### 💻 完整数据分析
- 所有 Tidyverse 包
- ggplot2 扩展包
- 配色方案包

### 安装时间参考

- **推荐包**（5-6 个）: 约 2-3 分钟
- **ggplot2 扩展**（14 个）: 约 5-8 分钟
- **全部包**（35+ 个）: 约 10-15 分钟

> 💡 提示：首次安装会下载 WASM 包，后续使用会从浏览器缓存加载，速度更快。

---

## 🐛 常见问题

### Q: 为什么某些包安装失败？

**A**: 可能原因：
1. 该包没有 WASM 版本（WebR 限制）
2. 网络连接问题
3. 镜像源暂时不可用

**解决方法**：
- 系统会自动尝试备用镜像源
- 可以稍后重新尝试安装
- 检查控制台日志查看详细错误信息

### Q: 如何查看已安装的包？

**A**: 
1. 打开开发者模式（右上角开关）
2. 在 R 控制台输入：`installed.packages()[,1]`
3. 或者查看浏览器控制台的日志

### Q: 可以安装列表外的包吗？

**A**: 
可以！使用 **➕ 添加自定义包** 功能：
1. 输入包名（必须是 CRAN 上的包）
2. 点击添加
3. 系统会尝试安装该包

### Q: 镜像源选择失败怎么办？

**A**: 
不用担心，系统会：
1. 使用默认镜像源（清华大学镜像）
2. 如果安装失败，自动尝试其他镜像
3. 最终使用官方 CRAN 镜像作为后备

---

## 📝 更新日志

### v1.1.0 (2025-10-05)

#### ✨ 新增功能
- ✅ 添加 35+ 个预设 R 包（包括 ggstream、ggridges 等）
- ✅ 支持用户自定义添加包
- ✅ 右上角包管理按钮
- ✅ 智能 CRAN 镜像源选择（基于地理位置）
- ✅ 自动镜像源切换（失败时尝试备用镜像）

#### 🔧 改进
- 优化包安装流程（5 步骤）
- 增强错误处理和日志输出
- 改进用户界面和交互体验

#### 🐛 修复
- 修复 `labs()` 缺少 `fill` 和 `color` 参数
- 添加 `scale_fill_brewer()` 积木
- 修复 `ggsave()` 缺少 `dpi` 参数
- 修复 `scale_color_brewer()` 缺少 `name` 参数

---

## 🤝 贡献

如果你发现：
- 某个常用包没有在列表中
- 镜像源不可用或速度慢
- 有更好的镜像源建议

欢迎提交 Issue 或 Pull Request！

---

## 📚 相关资源

- [WebR 官方文档](https://docs.r-wasm.org/webr/latest/)
- [CRAN 官方网站](https://cran.r-project.org/)
- [ggplot2 文档](https://ggplot2.tidyverse.org/)
- [Tidyverse 文档](https://www.tidyverse.org/)

---

**享受使用 GGplotChim！** 🎨✨
