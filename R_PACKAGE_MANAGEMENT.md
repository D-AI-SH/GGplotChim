# R包管理系统

## 概述

为了解决 `Error in library(tidyverse): there is no package called 'tidyverse'` 这类错误，我们添加了一个完整的R包管理系统。

## 功能特性

### 1. 包选择器界面

在应用启动时，用户会看到一个友好的包选择器界面，可以选择需要安装的R包。

#### 主要功能：
- ✅ **推荐包** - 一键选择运行大多数示例所需的核心包（ggplot2, dplyr, tidyr, viridis, scales）
- 📊 **选择 Tidyverse** - 选择所有 tidyverse 系列的包
- ✓ **全选** - 选择所有可用的包
- ✗ **取消全选** - 取消所有选择（保留必需的包）

### 2. 可用的R包

#### 必需包
- **ggplot2** - 强大的数据可视化包（必需，不可取消选择）

#### Tidyverse 系列
- **dplyr** - 数据处理和转换（tidyverse核心包）
- **tidyr** - 数据整理和重塑（包含gather等函数）
- **readr** - 快速读取数据文件
- **tibble** - 现代化的数据框
- **stringr** - 字符串处理
- **forcats** - 因子处理
- **purrr** - 函数式编程工具

#### 其他常用包
- **viridis** - 色盲友好的配色方案
- **scales** - 坐标轴刻度和标签格式化
- **RColorBrewer** - 配色方案
- **gridExtra** - 图表网格布局
- **cowplot** - 出版级图表主题
- **ggrepel** - 自动避让的文本标签
- **gganimate** - 创建动画图表
- **plotly** - 交互式图表
- **lubridate** - 日期时间处理
- **jsonlite** - JSON数据处理

### 3. 智能安装流程

安装过程分为4个步骤：
1. **[1/4]** 准备初始化 WebR
2. **[2/4]** 下载 WebR 运行时（约 10MB）
3. **[3/4]** 逐个安装用户选择的包（显示进度）
4. **[4/4]** 验证安装并显示结果

安装过程中会显示详细的进度信息，让用户了解当前正在安装哪个包。

### 4. 状态管理

在 `useBlockStore` 中新增了以下状态：
- `selectedPackages` - 用户选择要安装的包列表
- `installedPackages` - 已成功安装的包列表
- `isInstallingPackages` - 是否正在安装包

## 使用建议

### 对于新用户
建议点击 **"⭐ 推荐包"** 按钮，这会选择运行大多数ggplot2示例所需的核心包：
- ggplot2
- dplyr
- tidyr
- viridis
- scales

### 对于使用 tidyverse 的用户
如果你的代码中有 `library(tidyverse)`，请点击 **"📊 选择 Tidyverse"** 按钮，这会选择所有 tidyverse 相关的包。

**注意**：webR 不支持直接安装 `tidyverse` 元包，但可以分别安装其核心组件包。

### 对于高级用户
- 可以手动勾选需要的特定包
- 使用 **"✓ 全选"** 安装所有可用包（需要较长时间）

## 技术实现

### 组件结构
- `src/components/RPackageSelector.tsx` - 包选择器组件
- `src/core/rRunner/webRRunner.ts` - WebR运行器（包含包安装逻辑）
- `src/store/useBlockStore.ts` - 状态管理（包管理状态）

### 安装逻辑
```typescript
// 在 webRRunner.ts 中
async installSelectedPackages(): Promise<void> {
  // 获取用户选择的包
  const { selectedPackages } = useBlockStore.getState();
  
  // 逐个安装包
  for (const pkg of selectedPackages) {
    await this.webR.installPackages([pkg]);
    await this.webR.evalR(`library(${pkg})`);
  }
}
```

## 解决的问题

### 示例：圆形堆叠条形图
你在 `r_code_examples/圆形堆叠条形图/code.R` 中使用了：
```r
library(tidyverse)
library(viridis)
```

现在用户可以在启动时选择安装 `tidyr`（用于 `gather` 函数）和 `viridis` 包，代码就能正常运行了。

## 注意事项

1. **首次安装时间** - 根据选择的包数量，首次安装可能需要几分钟
2. **网络要求** - 需要稳定的网络连接来下载包
3. **包大小** - 每个包大小在 1-10MB 不等
4. **错误处理** - 如果某个包安装失败，会继续安装其他包，不会中断整个流程

## 未来改进

- [ ] 添加包的依赖关系检测
- [ ] 支持在应用运行时动态安装包
- [ ] 添加包的版本信息
- [ ] 提供包的使用示例和文档链接
- [ ] 记住用户的包选择偏好（localStorage）

