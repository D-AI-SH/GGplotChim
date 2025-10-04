# 🔧 修复 for 循环的 bodyInput/bodyOutput 连接点

## 问题描述

用户反馈：**for 循环内部的两个连接点（bodyInput 和 bodyOutput）无法被拖拽连接**。

之前虽然在 UI 上显示了这两个连接点，但在代码逻辑中被强制转换成了 `'input' | 'output'` 类型，导致无法正常工作。

---

## 解决方案

### 1️⃣ 更新类型定义

**文件**：`src/components/BlockNode.tsx`

```typescript
// ❌ 之前（错误）
onConnectionStart?: (blockId: string, type: 'input' | 'output', e?: React.MouseEvent) => void;
onConnectionEnd?: (blockId: string, type: 'input' | 'output') => void;

// ✅ 修复后
onConnectionStart?: (blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput', e?: React.MouseEvent) => void;
onConnectionEnd?: (blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput') => void;
```

同时移除了强制类型转换：

```typescript
// ❌ 之前
onConnectionStart(block.id, type as 'input' | 'output', e);

// ✅ 修复后
onConnectionStart(block.id, type, e);
```

---

### 2️⃣ 更新 Canvas 连接逻辑

**文件**：`src/components/Canvas.tsx`

#### A. 更新状态类型

```typescript
const [connectingFrom, setConnectingFrom] = useState<{ 
  blockId: string; 
  type: 'input' | 'output' | 'bodyInput' | 'bodyOutput'; 
  isGgplotConnection?: boolean 
} | null>(null);
```

#### B. 处理 bodyInput/bodyOutput 断开连接

在 `handleConnectionStart` 中添加：

```typescript
} else if (type === 'bodyInput' && block.connections.bodyInput) {
  // 从 bodyInput 点拉线，断开旧连接
  updateBlock(blockId, {
    connections: { ...block.connections, bodyInput: null }
  });
} else if (type === 'bodyOutput' && block.connections.bodyOutput) {
  // 从 bodyOutput 点拉线，断开旧连接
  updateBlock(blockId, {
    connections: { ...block.connections, bodyOutput: null }
  });
}
```

#### C. 处理 bodyInput/bodyOutput 建立连接

在 `handleConnectionEnd` 中添加：

```typescript
// 🔵 处理 bodyInput 和 bodyOutput 连接（虚线引用）
if (connectingFrom.type === 'bodyInput') {
  // bodyInput 指向循环体的第一个积木
  console.log('✅ [Canvas] 连接 bodyInput:', sourceBlock.id, '->', targetBlock.id);
  updateBlock(sourceBlock.id, {
    connections: { ...sourceBlock.connections, bodyInput: targetBlock.id }
  });
  setConnectingFrom(null);
  setOldConnection(null);
  setMousePos(null);
  return;
}

if (connectingFrom.type === 'bodyOutput') {
  // bodyOutput 指向循环体的最后一个积木
  console.log('✅ [Canvas] 连接 bodyOutput:', sourceBlock.id, '->', targetBlock.id);
  updateBlock(sourceBlock.id, {
    connections: { ...sourceBlock.connections, bodyOutput: targetBlock.id }
  });
  setConnectingFrom(null);
  setOldConnection(null);
  setMousePos(null);
  return;
}
```

---

### 3️⃣ 更新连接点位置计算

**文件**：`src/components/Canvas.tsx`

更新 `getConnectionPoint` 函数以支持 `bodyInput` 和 `bodyOutput`：

```typescript
const getConnectionPoint = (blockId: string, type: 'input' | 'output' | 'bodyInput' | 'bodyOutput'): { x: number; y: number } | null => {
  // ... 省略前面的代码 ...
  
  } else if (type === 'bodyInput') {
    // bodyInput 点在插槽顶部（试图找到实际的连接点元素）
    const bodyInputElement = blockElement.querySelector('.connection-body-input') as HTMLElement;
    if (bodyInputElement) {
      const pointRect = bodyInputElement.getBoundingClientRect();
      return {
        x: pointRect.left - canvasRect.left + scrollLeft + pointRect.width / 2,
        y: pointRect.top - canvasRect.top + scrollTop + pointRect.height / 2
      };
    }
    // 备用方案：估算位置
    return {
      x: relativeX + blockRect.width / 2,
      y: relativeY + 60 // 估算的插槽顶部位置
    };
  } else if (type === 'bodyOutput') {
    // bodyOutput 点在插槽底部
    const bodyOutputElement = blockElement.querySelector('.connection-body-output') as HTMLElement;
    if (bodyOutputElement) {
      const pointRect = bodyOutputElement.getBoundingClientRect();
      return {
        x: pointRect.left - canvasRect.left + scrollLeft + pointRect.width / 2,
        y: pointRect.top - canvasRect.top + scrollTop + pointRect.height / 2
      };
    }
    // 备用方案：估算位置
    return {
      x: relativeX + blockRect.width / 2,
      y: relativeY + blockRect.height - 20 // 估算的插槽底部位置
    };
  }
  
  return null;
};
```

---

### 4️⃣ 渲染连接线

**文件**：`src/components/Canvas.tsx`

在 `renderConnections` 函数中添加渲染 bodyInput/bodyOutput 连接线的逻辑：

```typescript
// 🔵 渲染 bodyInput 和 bodyOutput 虚线连接（引用关系）
if (block.connections.bodyInput) {
  const targetBlock = blocks.find(b => b.id === block.connections.bodyInput);
  if (targetBlock) {
    const definition = blockDefinitions.find(d => d.type === block.blockType);
    const color = definition?.color || '#4f46e5';
    
    const startPoint = getConnectionPoint(block.id, 'bodyInput');
    const endPoint = getConnectionPoint(targetBlock.id, 'input');
    
    if (startPoint && endPoint) {
      const pathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
      
      connections.push(
        <path
          key={`body-input-${block.id}`}
          d={pathD}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
          className="connection-line connection-line-body-input"
          opacity="0.6"
        />
      );
    }
  }
}

if (block.connections.bodyOutput) {
  const targetBlock = blocks.find(b => b.id === block.connections.bodyOutput);
  if (targetBlock) {
    const definition = blockDefinitions.find(d => d.type === block.blockType);
    const color = definition?.color || '#4f46e5';
    
    const startPoint = getConnectionPoint(targetBlock.id, 'output');
    const endPoint = getConnectionPoint(block.id, 'bodyOutput');
    
    if (startPoint && endPoint) {
      const pathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
      
      connections.push(
        <path
          key={`body-output-${block.id}`}
          d={pathD}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
          className="connection-line connection-line-body-output"
          opacity="0.6"
        />
      );
    }
  }
}
```

---

### 5️⃣ 增强 CSS 样式

**文件**：`src/styles/BlockNode.css`

让 bodyInput 和 bodyOutput 连接点更显眼：

```css
/* 🔧 循环体连接点（在插槽内部） */
.connection-body-input,
.connection-body-output {
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  margin: 4px auto;
  background: rgba(147, 51, 234, 0.1); /* 浅紫色背景，更显眼 */
  border: 2px solid #9333ea; /* 紫色边框 */
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair; /* 十字光标表示可以连接 */
  transition: var(--transition-all);
  z-index: 5;
}

.connection-body-input:hover,
.connection-body-output:hover {
  transform: translateX(-50%) scale(1.3);
  background: rgba(147, 51, 234, 0.2);
  border-color: #7e22ce;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.2);
}

.connection-body-input svg,
.connection-body-output svg {
  stroke: #9333ea;
  stroke-width: 2;
}
```

---

## 使用方法

### 连接 bodyInput（循环体入口）

1. 点击 **for 循环插槽顶部的紫色圆点**（bodyInput）
2. 拖拽到循环体内**第一个积木的顶部**
3. 松开鼠标，建立虚线连接

### 连接 bodyOutput（循环体出口）

1. 点击 **for 循环插槽底部的紫色圆点**（bodyOutput）
2. 拖拽到循环体内**最后一个积木的底部**
3. 松开鼠标，建立虚线连接

---

## 效果展示

### 连接前
```
┌─────────┐
│  for 循环 │
│         │
│ ● ← bodyInput (未连接)
│ ┌─────┐ │
│ │赋值 │ │
│ ├─────┤ │
│ │打印 │ │
│ └─────┘ │
│ ● ← bodyOutput (未连接)
└─────────┘
```

### 连接后
```
┌─────────┐
│  for 循环 │
│         │
│ ●········> 赋值  ← bodyInput 虚线指向第一个积木
│ ┌─────┐ │
│ │赋值 │ │
│ ├──↓──┤ │  实线连接
│ │打印 │ │
│ └─────┘ │
│ ●<········ 打印  ← bodyOutput 虚线指向最后一个积木
└─────────┘
```

---

## 技术要点

1. **类型安全**：确保 TypeScript 类型正确传递，不使用 `as` 强制转换
2. **连接点定位**：使用 DOM 元素的实际位置计算连接线坐标
3. **视觉区分**：
   - 🔴 实线（红色）= 运行顺序
   - 🔵 虚线（紫色）= 引用关系（bodyInput/bodyOutput）
4. **交互提示**：
   - 鼠标悬停放大
   - 紫色边框突出显示
   - 十字光标表示可连接

---

## 测试建议

1. 创建一个 for 循环积木
2. 拖拽多个积木到循环体内
3. 尝试连接 bodyInput 到第一个积木
4. 尝试连接 bodyOutput 到最后一个积木
5. 检查虚线是否正确显示
6. 检查代码生成是否正确

---

**修复完成！** 🎉 现在 for 循环的 bodyInput 和 bodyOutput 连接点可以正常使用了！

