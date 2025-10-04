# 容器型积木的四连接点设计

## 📐 设计原理

容器型积木（如 `for循环`、`if语句`）现在拥有**四个连接点**，而不是传统的两个连接点。这样可以正确处理执行流的输入输出。

## 🔌 四个连接点

### 1️⃣ **顶部输入（input）**
- **位置**：积木顶部中央
- **作用**：表示这个 for 循环在执行顺序中的上一个积木
- **连接类型**：🔴 **实线**（运行顺序）
- **示例**：`x <- 5` → `for循环.input`

### 2️⃣ **底部输出（output）**
- **位置**：积木底部中央
- **作用**：表示这个 for 循环在执行顺序中的下一个积木
- **连接类型**：🔴 **实线**（运行顺序）
- **示例**：`for循环.output` → `print("done")`

### 3️⃣ **循环体输入（bodyInput）**
- **位置**：插槽区域顶部
- **作用**：**引用**循环体内的第一个积木（不是运行顺序）
- **连接类型**：🔵 **虚线**（引用关系）
- **示例**：`for循环.bodyInput` ⇢ `y <- i * 2`（循环体第一个积木）

### 4️⃣ **循环体输出（bodyOutput）**
- **位置**：插槽区域底部
- **作用**：**引用**循环体内的最后一个积木（不是运行顺序）
- **连接类型**：🔵 **虚线**（引用关系）
- **示例**：`print(y)` ⇢ `for循环.bodyOutput`（循环体最后一个积木）

## 🎨 可视化示意图

```
        x <- 5
          │ (实线 = 运行顺序)
          ↓
    ┌─────┴─────┐
    │ ① input   │
    ├───────────┤
    │  for 循环  │
    │           │
    │ ┌───②───┐ │  ⇠ 虚线引用
    │ │bodyIn │ │     (引用第一个积木)
    │ ├───────┤ │
    │ │ y←i*2 │ │  ← 循环体积木按实线顺序执行
    │ ├───↓───┤ │
    │ │print(y)│ │
    │ ├───────┤ │
    │ │bodyOut│ │  ⇠ 虚线引用
    │ └───③───┘ │     (引用最后一个积木)
    │           │
    ├───────────┤
    │ ④ output  │
    └─────┬─────┘
          │ (实线 = 运行顺序)
          ↓
    print("done")
```

**关键区别**：
- 🔴 **实线（input/output）**：运行顺序链，按 `①→循环体→④` 顺序执行
- 🔵 **虚线（bodyInput/bodyOutput）**：引用关系，标记循环体的首尾积木
- ⚡ **循环体内部**：积木之间依然用实线连接，表示内部的执行顺序

## 🔗 连接逻辑

### 普通积木的连接（实线）
```
积木A.output → 积木B.input  (运行顺序)
```

### 容器积木的连接
```
🔴 实线连接（运行顺序）:
  上一个积木.output → for循环.input
  for循环内部第一个.input ← (由 bodyInput 引用)
  for循环内部第一个.output → 第二个.input → ... → 最后一个
  for循环内部最后一个 → (由 bodyOutput 引用)
  for循环.output → 下一个积木.input

🔵 虚线连接（引用关系）:
  for循环.bodyInput ⇢ 循环体第一个积木 (标记入口)
  循环体最后一个积木 ⇢ for循环.bodyOutput (标记出口)
```

**重要**：
- `bodyInput` 和 `bodyOutput` 不参与运行顺序，只是用来标记循环体的范围
- 循环体内的积木依然通过 `input/output` 实线连接，形成自己的执行链
- 代码生成器根据 `bodyInput/bodyOutput` 找到循环体的积木，然后缩进生成

## 💻 技术实现

### 类型定义（`src/types/blocks.ts`）
```typescript
export interface BlockInstance {
  connections: {
    input: string | null;       // 顶部输入
    output: string | null;      // 底部输出
    bodyInput?: string | null;  // 循环体输入（容器专用）
    bodyOutput?: string | null; // 循环体输出（容器专用）
  };
  children?: Record<string, string[]>; // 子积木列表
  parentId?: string | null;            // 父容器 ID
}
```

### 渲染组件（`src/components/BlockNode.tsx`）
- 顶部和底部连接点：使用 `position: absolute`
- 循环体连接点：使用 `position: relative`，在插槽区域内部

### 样式（`src/styles/BlockNode.css`）
- `.connection-input`：顶部输入（-12px）
- `.connection-output`：底部输出（-12px）
- `.connection-body-input`：循环体输入（相对定位，8px 间距）
- `.connection-body-output`：循环体输出（相对定位，8px 间距）

## ✅ 优点

1. **清晰的执行流**：明确区分循环前、循环体、循环后的执行顺序
2. **正确的代码生成**：可以准确生成嵌套结构的代码
3. **直观的可视化**：连接线清楚地显示了数据流和控制流
4. **符合直觉**：与 Scratch 等可视化编程工具的逻辑一致

## 🚀 下一步

- [ ] 在 `Canvas.tsx` 中实现四连接点的拖拽逻辑
- [ ] 在代码生成器中处理 `bodyInput`/`bodyOutput` 连接
- [ ] 在解析器中自动建立循环体的连接关系
- [ ] 绘制连接线时区分容器内外的连接

## 📝 使用示例

```typescript
// ✅ 正确的连接关系
{
  // 外部积木
  { id: 'assign1', output: 'for1' },  // x <- 5
  
  // for 循环容器
  {
    id: 'for1',
    blockType: 'control_for',
    connections: {
      input: 'assign1',      // 🔴 实线：上一个积木
      output: 'print3',      // 🔴 实线：下一个积木
      bodyInput: 'assign2',  // 🔵 虚线：引用循环体第一个
      bodyOutput: 'print2'   // 🔵 虚线：引用循环体最后一个
    },
    children: {
      body: ['assign2', 'print2']  // 子积木列表
    }
  },
  
  // 循环体内的积木（按实线连接）
  {
    id: 'assign2',  // y <- i * 2
    blockType: 'base_assign',
    connections: {
      input: null,     // 第一个积木，没有上游
      output: 'print2' // 🔴 实线：连接到循环体内下一个积木
    },
    parentId: 'for1',
    slotName: 'body'
  },
  
  {
    id: 'print2',  // print(y)
    blockType: 'base_print',
    connections: {
      input: 'assign2', // 🔴 实线：连接到循环体内上一个积木
      output: null      // 最后一个积木，没有下游
    },
    parentId: 'for1',
    slotName: 'body'
  },
  
  // 外部积木
  { id: 'print3', input: 'for1' }  // print("done")
}
```

**代码生成逻辑**：
```r
x <- 5                    # assign1
for (i in 1:10) {         # for1 开始
  y <- i * 2              # assign2 (由 bodyInput 找到)
  print(y)                # print2 (通过 assign2.output 找到)
}                         # for1 结束 (由 bodyOutput 确定范围)
print("done")             # print3
```

---

**注意**：这个设计解决了容器型积木的执行流混乱问题，确保循环体内的积木不会"跑到外面去"！

