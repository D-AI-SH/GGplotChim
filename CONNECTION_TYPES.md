# 🔗 连接类型说明

## 两种连接类型

### 🔴 实线连接（input/output）
**用途**：表示程序的**运行顺序**（控制流）

**特点**：
- 所有积木（包括容器积木和普通积木）都通过实线连接形成执行链
- 一个积木的 `output` 指向下一个要执行的积木的 `input`
- 循环体内的积木之间也用实线连接，形成内部的执行顺序

**示例**：
```
[赋值] --实线--> [for循环] --实线--> [print]
         ↓
  内部: [赋值] --实线--> [print]
```

---

### 🔵 虚线连接（bodyInput/bodyOutput）
**用途**：表示容器积木的**引用关系**（仅用于标记范围）

**特点**：
- 只用于容器型积木（for、if 等）
- `bodyInput` 指向循环体的**第一个积木**（标记入口）
- `bodyOutput` 指向循环体的**最后一个积木**（标记出口）
- 不参与运行顺序，只是帮助代码生成器找到循环体的范围

**示例**：
```
for循环.bodyInput ⇢⇢⇢ 循环体第一个积木
循环体最后一个积木 ⇢⇢⇢ for循环.bodyOutput
```

---

## 完整示例

### 场景：for 循环遍历并打印

```r
x <- 5
for (i in 1:10) {
  y <- i * 2
  print(y)
}
print("done")
```

### 积木连接图

```
┌─────────┐
│  x <- 5 │
│ (assign1)│
└────┬────┘
     │ output (实线)
     ↓
┌────┴────────────┐
│   for 循环      │◄── input (实线)
│   (for1)        │
│                 │
│  bodyInput ⇢⇢⇢⇢⇢⇢⇢⇢┐
│                 │   │ (虚线引用)
│  ┌──────────────┼───┘
│  │  ┌──────────┐│
│  └─▶│ y <- i*2 ││  ← 循环体第一个
│     │(assign2) ││
│     └────┬─────┘│
│          │ output (实线)
│          ↓      │
│     ┌────┴─────┐│
│     │ print(y) ││  ← 循环体最后一个
│     │ (print2) ││
│     └────┬─────┘│
│          │      │
│  ┌───────┘      │
│  │  bodyOutput ⇠⇠⇠⇠⇠⇠┐
│                 │   │ (虚线引用)
└────┬────────────┘   │
     │ output (实线)  │
     ↓                │
┌────┴───────┐        │
│print("done")│       │
│  (print3)  │       │
└────────────┘       │
                      │
              实际的引用 ──┘
```

### 数据结构

```typescript
blocks = [
  {
    id: 'assign1',
    connections: { input: null, output: 'for1' }
  },
  {
    id: 'for1',
    connections: {
      input: 'assign1',      // 🔴 上一个积木
      output: 'print3',      // 🔴 下一个积木
      bodyInput: 'assign2',  // 🔵 循环体第一个
      bodyOutput: 'print2'   // 🔵 循环体最后一个
    },
    children: { body: ['assign2', 'print2'] }
  },
  {
    id: 'assign2',
    connections: { input: null, output: 'print2' },
    parentId: 'for1'
  },
  {
    id: 'print2',
    connections: { input: 'assign2', output: null },
    parentId: 'for1'
  },
  {
    id: 'print3',
    connections: { input: 'for1', output: null }
  }
]
```

---

## ⚙️ 代码生成逻辑

### 步骤 1：按实线遍历（执行顺序）
```
assign1 → for1 → print3
```

### 步骤 2：遇到容器积木时，使用 bodyInput/bodyOutput 找到循环体
```
for1.bodyInput → assign2
for1.bodyOutput → print2
```

### 步骤 3：生成嵌套代码
```r
x <- 5                  # assign1
for (i in 1:10) {       # for1
  y <- i * 2            #   ↑ bodyInput 指向 assign2
  print(y)              #   ↓ bodyOutput 指向 print2
}
print("done")           # print3
```

---

## 🎯 关键要点

1. **实线 = 运行顺序**
   - 外部积木 → 容器积木 → 外部积木
   - 循环体内部：第一个 → 第二个 → ... → 最后一个

2. **虚线 = 引用标记**
   - bodyInput 指向循环体第一个积木
   - bodyOutput 指向循环体最后一个积木
   - 不影响运行顺序，只是帮助找到范围

3. **循环体内的积木**
   - 设置 `parentId` 和 `slotName`
   - 内部用实线连接
   - 通过 `children` 数组管理

4. **代码生成器**
   - 按实线遍历主执行流
   - 遇到容器时，用虚线找到循环体
   - 递归生成嵌套代码

---

**这样设计的好处**：
✅ 清晰区分执行顺序和引用关系
✅ 循环体内的积木不会混入外部流程
✅ 支持任意深度的嵌套
✅ 代码生成逻辑简单明了

