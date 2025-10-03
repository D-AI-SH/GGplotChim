# 🔗 连接系统设计文档

## 概述

GGplotChim 现在支持两种类型的积木连接：

1. **实线连接（Execution Order）**：代表代码的执行顺序
2. **虚线连接（ggplot +）**：代表 ggplot2 的图层组合关系

---

## 🎯 连接类型

### 1. 实线连接（input/output）

**含义**：代表积木的执行顺序

**使用场景**：
- 普通 R 语句的执行顺序
- 变量赋值
- 数据处理流程
- 控制流程（循环、条件）

**创建方式**：
- **普通拖拽**：直接从一个积木的输出点拖拽到另一个积木的输入点

**代码生成**：
```r
# 实线连接按顺序生成代码
data <- read.csv("data.csv")
print(data)
```

**数据结构**：
```typescript
connections: {
  input: string | null,   // 上一个积木的 ID
  output: string | null   // 下一个积木的 ID
}
```

---

### 2. 虚线连接（ggplotConnections）

**含义**：代表 ggplot2 的图层组合关系（`+` 操作符）

**使用场景**：
- ggplot() 初始化与几何对象的组合
- 添加图层（geom_*）
- 添加主题（theme_*）
- 添加标签（labs）
- 添加刻度（scale_*）

**创建方式**：
- **Shift + 拖拽**：按住 Shift 键，从一个积木拖拽到另一个积木

**代码生成**：
```r
# 虚线连接使用 + 操作符组合
ggplot(data, aes(x = x, y = y))
  + geom_point()
  + theme_minimal()
  + labs(title = "My Plot")
```

**数据结构**：
```typescript
ggplotConnections?: string[]  // 通过 + 连接的积木 ID 列表
```

---

## 🎨 视觉区分

### 实线连接
- **线条样式**：实线
- **颜色**：继承源积木的颜色
- **宽度**：2px
- **动画**：无

### 虚线连接
- **线条样式**：虚线（strokeDasharray: "8,4"）
- **颜色**：继承源积木的颜色
- **宽度**：2px
- **透明度**：0.8
- **预览提示**：显示 "ggplot +" 文字

---

## 📖 用户操作指南

### 创建实线连接（执行顺序）
1. 将鼠标悬停在积木的**输出点**（底部圆圈）
2. **按住并拖拽**
3. 拖拽到目标积木的**输入点**（顶部圆圈）
4. 松开鼠标

### 创建虚线连接（ggplot +）
1. **按住 Shift 键**
2. 将鼠标悬停在积木的**输出点**（底部圆圈）
3. **按住并拖拽**（此时会看到虚线预览和 "ggplot +" 提示）
4. 拖拽到目标积木的**输入点**（顶部圆圈）
5. 松开鼠标

### 删除连接
- 点击积木的连接点，拖拽到空白处松开

---

## 🔧 技术实现

### 类型定义（src/types/blocks.ts）

```typescript
export interface BlockInstance {
  id: string;
  blockType: BlockType;
  position: { x: number; y: number };
  params: Record<string, any>;
  
  // 实线连接（执行顺序）
  connections: {
    input: string | null;
    output: string | null;
  };
  
  // 虚线连接（ggplot +）
  ggplotConnections?: string[];
  
  order: number;
  // ... 其他字段
}
```

### Canvas 连接处理（src/components/Canvas.tsx）

**检测 Shift 键**：
```typescript
const handleConnectionStart = (blockId: string, type: 'input' | 'output', e?: React.MouseEvent) => {
  const isGgplotConnection = e?.shiftKey || false;
  
  if (isGgplotConnection) {
    // 创建虚线连接
    setConnectingFrom({ blockId, type, isGgplotConnection: true });
  } else {
    // 创建实线连接
    setConnectingFrom({ blockId, type, isGgplotConnection: false });
  }
};
```

**完成连接**：
```typescript
const handleConnectionEnd = (targetBlockId: string, targetType: 'input' | 'output') => {
  if (connectingFrom.isGgplotConnection) {
    // 添加到 ggplotConnections
    const updatedSourceBlock = {
      ...sourceBlock,
      ggplotConnections: [...(sourceBlock.ggplotConnections || []), targetBlock.id]
    };
    updateBlock(sourceBlock.id, updatedSourceBlock);
  } else {
    // 使用标准的 connectBlocks 处理实线连接
    const { source, target } = connectBlocks(sourceBlock, targetBlock);
    // ...
  }
};
```

### SVG 渲染（src/components/Canvas.tsx）

**实线渲染**：
```typescript
<path
  d={pathD}
  stroke={color}
  strokeWidth="2"
  fill="none"
  className="connection-line connection-line-solid"
/>
```

**虚线渲染**：
```typescript
<path
  d={pathD}
  stroke={color}
  strokeWidth="2"
  strokeDasharray="8,4"
  fill="none"
  opacity="0.8"
  className="connection-line connection-line-dashed"
/>
```

### 代码生成（src/utils/codeGenerator.ts）

**获取 ggplot 链**：
```typescript
function getGgplotChains(blocks: BlockInstance[]): BlockInstance[][] {
  // 找到所有有 ggplotConnections 的起始积木
  const startBlocks = blocks.filter(b => 
    b.ggplotConnections && b.ggplotConnections.length > 0
  );
  
  // 递归收集所有连接的积木
  // ...
}
```

**生成代码**：
```typescript
export function generateRCode(blocks: BlockInstance[]): string {
  // 1. 优先处理 ggplot 链（虚线）
  const ggplotChains = getGgplotChains(blocks);
  ggplotChains.forEach(chain => {
    // 使用 + 连接
  });
  
  // 2. 处理普通执行链（实线）
  const executionChains = getAllChains(blocks);
  executionChains.forEach(chain => {
    // 按顺序生成
  });
}
```

### AST 解析器（src/utils/astCodeParser.ts）

**识别 `+` 操作符**：
```typescript
if (node.type === 'call' && node.function_name === '+') {
  // 展开链式调用
  const chainBlocks = flattenGgplotChain(node, blockIdCounter);
  
  // 设置虚线连接
  if (chainBlocks.length > 0) {
    chainBlocks[0].ggplotConnections = chainBlocks.slice(1).map(b => b.id);
  }
}
```

### 正则解析器（src/utils/codeParser.ts）

**解析 ggplot 链**：
```typescript
const chainParts = splitGgplotChain(chainBuffer);
chainParts.forEach((part, index) => {
  const blockInstance = {
    // ...
    connections: { input: null, output: null },  // 不使用实线
    ggplotConnections: index === 0 ? [] : undefined
  };
  currentChainBlocks.push(blockInstance);
});

// 设置虚线连接
if (currentChainBlocks.length > 0) {
  currentChainBlocks[0].ggplotConnections = 
    currentChainBlocks.slice(1).map(b => b.id);
}
```

---

## 🎓 设计原则

### 1. 语义清晰
- **实线 = 执行顺序**：先做什么，后做什么
- **虚线 = 组合关系**：把什么和什么组合在一起

### 2. 符合 ggplot2 语法
- ggplot2 使用 `+` 操作符组合图层，这是组合关系而非执行顺序
- 实线连接用于普通 R 语句的顺序执行

### 3. 双向解析一致性
- **代码 → 积木**：
  - `+` 操作符解析为虚线连接
  - 普通语句解析为实线连接
- **积木 → 代码**：
  - 虚线连接生成 `+` 操作符
  - 实线连接按顺序生成

### 4. 用户体验
- **Shift 键**：作为修饰键，符合用户习惯
- **视觉反馈**：虚线预览 + 文字提示
- **颜色一致**：连接线继承源积木颜色

---

## 🚀 未来扩展

### 可能的增强功能
1. **右键菜单**：切换连接类型
2. **连接编辑**：点击连接线显示菜单（删除、转换类型）
3. **智能建议**：根据积木类型自动建议连接类型
4. **连接验证**：检查连接的合理性（例如，theme 只能用虚线连接到 ggplot）
5. **多重虚线连接**：一个积木可以同时被多个 ggplot 链引用

---

## 📝 示例

### 示例 1：简单 ggplot 图表
```r
# 虚线连接（ggplot +）
ggplot(mtcars, aes(x = wt, y = mpg))
  + geom_point()
  + theme_minimal()
```

**积木结构**：
- `ggplot()` 积木的 `ggplotConnections`: [`geom_point-id`, `theme_minimal-id`]

### 示例 2：混合使用
```r
# 实线连接（执行顺序）
data <- read.csv("data.csv")

# 虚线连接（ggplot +）
ggplot(data, aes(x = x, y = y))
  + geom_point()
  + labs(title = "My Plot")

# 实线连接（执行顺序）
print("Plot created")
```

**积木结构**：
- `read.csv` → `ggplot()` (实线)
- `ggplot()` → `geom_point`, `labs` (虚线)
- `ggplot()` → `print()` (实线)

---

## 🐛 已知限制

1. **暂不支持复杂的 ggplot 表达式**：
   - 例如：`ggplot() + (geom_point() + geom_line())`
   
2. **虚线连接目前是单向的**：
   - 只能从源积木添加到 ggplotConnections
   - 未来可以考虑双向引用

3. **删除连接**：
   - 实线连接可以通过拖拽断开
   - 虚线连接目前需要手动编辑或删除积木

---

## ✅ 测试清单

- [x] 实线连接：拖拽创建
- [x] 虚线连接：Shift+拖拽创建
- [x] 实线渲染：显示为实线
- [x] 虚线渲染：显示为虚线
- [x] 代码生成：实线按顺序，虚线用 `+`
- [x] AST 解析：`+` 操作符识别为虚线
- [x] 正则解析：`+` 操作符识别为虚线
- [x] 预览效果：虚线连接显示提示文字
- [x] 无 Lint 错误

---

**版本**：v2.0  
**最后更新**：2025-10-03  
**作者**：GGplotChim Team

