# 积木连接系统使用指南

## 🔗 连接机制

GGplotChim 实现了完整的积木连接系统，让您可以像搭建乐高一样组合 ggplot2 图层。

---

## 🎯 核心特性

### 1. 可视化连接点

每个积木都有两个连接点：

- **输入连接点（顶部）**：⭕ 连接到上一个积木
- **输出连接点（底部）**：⭕ 连接到下一个积木

```
┌──────────────┐
│   🔵 输入    │  ← 连接上游积木
├──────────────┤
│  ggplot()    │
│              │
├──────────────┤
│   🔵 输出    │  ← 连接下游积木
└──────────────┘
```

### 2. 自动吸附

当您拖拽新积木靠近现有积木时（80px 范围内），系统会：
- ✅ 自动检测可连接的积木
- ✅ 自动建立连接关系
- ✅ 自动更新图层顺序
- ✅ 自动生成连接线

### 3. 连接状态指示

- **未连接**：⚪ 空心圆圈
- **已连接**：🔵 实心圆圈（使用积木颜色）
- **顺序标记**：右上角显示 `#2`, `#3` 等序号

### 4. 可视化连接线

积木之间会显示平滑的贝塞尔曲线：
- 线条颜色与源积木颜色一致
- 鼠标悬停时线条会加粗
- 自动计算最优路径

---

## 🛠️ 使用方法

### 方式一：拖拽自动连接

1. 从左侧积木面板拖出第一个积木（如 `ggplot()`）
2. 继续拖出第二个积木，**放置在第一个积木下方附近**
3. 系统自动检测并连接积木
4. 继续添加更多积木，逐步构建图层链

```
第一步：拖出 ggplot()
┌──────────────┐
│  ggplot()    │
└──────────────┘

第二步：拖出 aes()，靠近 ggplot() 的底部
┌──────────────┐
│  ggplot()    │
└───────┬──────┘
        │ ← 自动连接线
┌───────▼──────┐
│  aes(...)    │
└──────────────┘

第三步：继续添加 geom_point()
┌──────────────┐
│  ggplot()    │ #1
└───────┬──────┘
        │
┌───────▼──────┐
│  aes(...)    │ #2
└───────┬──────┘
        │
┌───────▼──────┐
│ geom_point() │ #3
└──────────────┘
```

### 方式二：手动连接（未来功能）

1. 点击源积木的输出连接点
2. 拖动到目标积木的输入连接点
3. 释放鼠标完成连接

---

## 📋 连接规则

### ✅ 允许的连接

- 任意积木可以连接到**没有输入连接**的积木
- 一个积木可以有**多个输出**（支持分支，但代码生成只使用第一个）
- 一个积木只能有**一个输入**

### ❌ 禁止的连接

- ❌ 自己连接自己
- ❌ 目标积木已有输入连接
- ❌ 形成环路（A → B → A）

---

## 🧩 典型连接模式

### 模式 1：线性链（最常见）

```
ggplot(iris)
  → aes(x = Sepal.Length, y = Sepal.Width)
    → geom_point()
      → theme_minimal()
```

**生成的 R 代码：**
```r
ggplot(iris)
  + aes(x = Sepal.Length, y = Sepal.Width)
  + geom_point()
  + theme_minimal()
```

### 模式 2：多层几何对象

```
ggplot(mtcars)
  → aes(x = wt, y = mpg)
    → geom_point(size = 3)
      → geom_smooth(method = "lm")
        → labs(title = "Weight vs MPG")
```

**生成的 R 代码：**
```r
ggplot(mtcars)
  + aes(x = wt, y = mpg)
  + geom_point(size = 3)
  + geom_smooth(method = "lm")
  + labs(title = "Weight vs MPG")
```

### 模式 3：完整的图表

```
ggplot(iris)
  → aes(x = Species, y = Sepal.Length, fill = Species)
    → geom_boxplot()
      → scale_fill_manual(values = c("red", "blue", "green"))
        → labs(title = "Iris Sepal Length by Species")
          → theme_classic()
```

**生成的 R 代码：**
```r
ggplot(iris)
  + aes(x = Species, y = Sepal.Length, fill = Species)
  + geom_boxplot()
  + scale_fill_manual(values = c("red", "blue", "green"))
  + labs(title = "Iris Sepal Length by Species")
  + theme_classic()
```

---

## 🔧 连接管理

### 断开连接

1. 点击要删除的积木
2. 点击删除按钮（❌）
3. 系统自动：
   - 断开上游连接
   - 断开下游连接
   - 重新计算剩余积木的顺序

### 重新排列

1. 直接删除不需要的积木
2. 重新拖入新积木
3. 靠近需要连接的位置
4. 自动建立新连接

---

## 💡 最佳实践

### 1. 遵循 ggplot2 的图层顺序

推荐的连接顺序：

```
1️⃣ ggplot(data)          # 数据和画布
2️⃣ aes(...)              # 美学映射
3️⃣ geom_*()              # 几何对象
4️⃣ stat_*()              # 统计变换
5️⃣ scale_*()             # 标度
6️⃣ coord_*()             # 坐标系
7️⃣ facet_*()             # 分面
8️⃣ labs()                # 标签
9️⃣ theme_*()             # 主题
```

### 2. 先确定主体，再添加装饰

```
# 好的做法
ggplot() → aes() → geom_point()  # 先建立基础图表
         ↓
  添加 labs() 和 theme()  # 再添加标签和主题

# 避免的做法
theme_minimal()  # 单独一个主题积木，没有实际内容
```

### 3. 使用顺序标记检查逻辑

右上角的顺序标记（#1, #2, #3...）可以帮助您：
- 确认积木的执行顺序
- 发现不合理的连接
- 验证图层逻辑

---

## 🐛 常见问题

### Q1: 为什么我的积木没有自动连接？

**可能原因：**
- 积木距离太远（超过 80px）
- 目标积木已有输入连接
- 试图形成环路

**解决方法：**
- 将积木拖得更近一些
- 先断开目标积木的现有连接
- 检查连接方向是否正确

### Q2: 如何插入一个积木到链条中间？

**步骤：**
1. 删除需要插入位置后面的积木
2. 插入新积木，等待自动连接
3. 重新添加之前删除的积木
4. 系统会自动重建连接

### Q3: 连接线为什么显示不正确？

**可能原因：**
- 积木位置还在调整中
- 浏览器渲染延迟

**解决方法：**
- 轻微移动积木位置
- 刷新页面

### Q4: 如何创建多个独立的图表？

每个没有输入连接的积木都会被视为独立链的起点。

**示例：**
```
图表 1:
ggplot(iris) → aes(...) → geom_point()

图表 2:
ggplot(mtcars) → aes(...) → geom_line()
```

两个独立的 `ggplot()` 积木会生成两段独立的代码。

---

## 🎨 视觉反馈

| 状态 | 外观 | 含义 |
|------|------|------|
| ⚪ 空心连接点 | 未连接 | 可以建立新连接 |
| 🔵 实心连接点 | 已连接 | 已有连接关系 |
| 🟣 悬停高亮 | 鼠标经过 | 可以拖动建立连接 |
| 📏 贝塞尔曲线 | 连接线 | 显示积木之间的关系 |
| #️⃣ 数字标记 | 顺序标记 | 显示在图层链中的位置 |
| 🎯 阴影加强 | 选中状态 | 当前选中的积木 |

---

## 🚀 技术实现

### 数据结构

每个积木实例包含：

```typescript
interface BlockInstance {
  id: string;                    // 唯一标识
  blockType: BlockType;          // 积木类型
  position: { x, y };            // 画布位置
  params: Record<string, any>;   // 参数值
  connections: {
    input: string | null;        // 输入连接的积木 ID
    outputs: string[];           // 输出连接的积木 ID 列表
  };
  order: number;                 // 在图层链中的顺序
}
```

### 连接算法

1. **自动吸附检测**
   ```typescript
   findNearestConnectable(newBlock, existingBlocks, threshold)
   - 计算距离：Math.sqrt(dx² + dy²)
   - 过滤可连接的积木
   - 返回最近的可连接积木
   ```

2. **建立连接**
   ```typescript
   connectBlocks(source, target)
   - 更新 source.connections.outputs
   - 更新 target.connections.input
   - 更新 target.order = source.order + 1
   ```

3. **代码生成**
   ```typescript
   generateRCode(blocks)
   - 查找所有起始积木（input === null）
   - 为每个起始积木构建链
   - 按顺序生成 R 代码
   - 使用 + 运算符连接
   ```

---

## 📚 相关文档

- [设计理念](./DESIGN_PHILOSOPHY.md) - 了解为什么采用语句级封装
- [积木定义](./src/data/blockDefinitions.ts) - 查看所有可用积木
- [代码生成器](./src/utils/codeGenerator.ts) - 了解代码生成逻辑

---

**GGplotChim - 让 ggplot2 像搭积木一样简单** 🎨🔗

最后更新：2025年10月2日

