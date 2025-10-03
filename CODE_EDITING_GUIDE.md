# 代码编辑与双向同步功能指南

## 功能概述

GGplotChim 现在支持**代码与积木块的双向同步**！您可以：
1. 通过拖拽积木块生成 R 代码（原有功能）
2. **直接编辑 R 代码，自动生成对应的积木块**（新功能）

## 如何使用

### 1. 启用代码编辑模式

在右侧的"代码预览"面板中：
- 点击 **🔒 只读** 按钮，切换为 **🔓 可编辑** 模式
- 此时代码编辑器变为可编辑状态

### 2. 编辑代码

在可编辑模式下，您可以直接修改 R 代码：
- 修改现有的 ggplot2 语句
- 添加新的图层
- 调整参数值
- 删除不需要的代码

### 3. 自动同步到积木块

编辑代码后，系统会自动：
- **500ms 延迟自动同步**：停止输入 500ms 后，代码会自动解析并更新左侧的积木块
- **手动立即同步**：点击 **🔄 同步** 按钮立即同步到积木块

### 4. 积木块更新

同步后，左侧画布上的积木块会自动更新：
- 新增的代码会创建新的积木块
- 修改的参数会更新到对应积木
- 删除的代码会移除相应积木

## 支持的 R 语句

当前代码解析器支持以下 R 语句：

### 基础语句
- `library(package)` - 加载 R 包
- `variable <- value` - 变量赋值
- `print(value)` - 打印输出
- `# 注释` - 代码注释

### ggplot2 语句
- `data <- iris` - 数据导入
- `ggplot(data)` - 初始化画布
- `aes(x = ..., y = ...)` - 美学映射
- `geom_point()`, `geom_line()`, `geom_bar()` 等 - 几何对象
- `scale_x_continuous()`, `scale_color_manual()` 等 - 标度
- `coord_flip()`, `coord_polar()` 等 - 坐标系
- `facet_wrap()`, `facet_grid()` - 分面
- `labs()`, `ggtitle()`, `xlab()`, `ylab()` - 标签
- `theme_minimal()`, `theme_classic()` 等 - 主题

### ggplot2 链式调用
系统会自动识别用 `+` 连接的 ggplot2 链：
```r
ggplot(iris) +
  aes(x = Sepal.Length, y = Sepal.Width) +
  geom_point() +
  theme_minimal()
```

## 示例

### 示例 1：创建简单散点图

1. 启用可编辑模式
2. 输入以下代码：
```r
library(ggplot2)
data <- iris
ggplot(data) +
  aes(x = Sepal.Length, y = Sepal.Width, color = Species) +
  geom_point(size = 3) +
  theme_minimal()
```
3. 系统会自动生成对应的积木块

### 示例 2：修改参数

直接在代码中修改参数：
```r
geom_point(size = 5, alpha = 0.6)
```
对应的积木块参数会自动更新

### 示例 3：添加新图层

在现有代码中添加新的图层：
```r
# ... 现有代码 ...
  + geom_smooth(method = "lm")
  + labs(title = "鸢尾花数据分析")
```

## 双向同步机制

系统使用智能同步机制，防止循环更新：

1. **积木块 → 代码**：拖拽积木块时，自动生成代码
2. **代码 → 积木块**：编辑代码时，自动解析并创建积木块
3. **防循环机制**：使用 `syncSource` 标记，确保单向更新

## 注意事项

### ✅ 推荐做法
- 编辑简单、清晰的 R 代码
- 使用标准的 ggplot2 语法
- 一次修改一个小功能，便于观察效果

### ⚠️ 限制
- 代码解析器是简化版本，可能无法处理非常复杂的嵌套语句
- 不支持自定义函数定义
- 复杂的条件语句和循环可能无法完全解析

### 🐛 遇到问题？
如果代码解析失败：
1. 检查代码语法是否正确
2. 查看浏览器控制台的错误信息
3. 尝试简化代码
4. 切回只读模式，使用积木块重新构建

## 技术实现

### 核心文件
- `src/utils/codeParser.ts` - R 代码解析器
- `src/components/CodePreview.tsx` - 代码编辑组件
- `src/store/useBlockStore.ts` - 状态管理（含同步逻辑）
- `src/components/Canvas.tsx` - 积木画布（含反向同步控制）

### 解析流程
1. 代码编辑 → 触发 `handleCodeChange`
2. 500ms 防抖 → 调用 `updateCodeAndSync`
3. 调用 `parseRCodeToBlocks` 解析代码
4. 生成 `BlockInstance[]` 对象
5. 更新 store 中的 blocks
6. Canvas 重新渲染积木块

## 未来改进

- [ ] 支持更复杂的 R 语法
- [ ] 添加语法高亮和自动完成
- [ ] 实时语法检查和错误提示
- [ ] 支持更多 ggplot2 扩展包
- [ ] 代码格式化功能
- [ ] 撤销/重做历史记录

---

**享受代码与积木的双向创作体验！** 🎨✨

