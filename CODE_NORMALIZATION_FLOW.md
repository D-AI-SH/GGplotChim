# 代码规范化流程说明

## 功能概述
当用户在代码编辑器中编辑 R 代码时，系统会自动在适当的时机对代码进行规范化处理，以保持代码格式的一致性。

## 工作流程

### 1. 用户编辑代码
- 用户在代码编辑器中输入或修改代码
- 编辑内容立即显示在编辑器中
- 记录最后一次编辑的时间戳

### 2. 自动同步到积木块（500ms后）
- 用户停止输入 500ms 后，系统开始处理：
  - 调用 `updateCodeAndSync()` 将代码同步到积木块
  - 代码首先被规范化（格式化）
  - 使用 AST 解析器将代码解析为积木块实例
  - 更新 Zustand store 中的 `blocks` 和 `generatedCode`

### 3. 自动规范化显示（再等5秒）
- 在同步完成后，如果用户 5 秒内没有继续编辑：
  - 从 store 获取规范化后的 `generatedCode`
  - 更新编辑器显示的代码为规范化后的版本
  - 用户会看到格式化后的代码（例如：缩进统一、空格规范等）

### 4. 手动同步按钮
- 用户可以随时点击"同步"按钮
- 立即执行同步和规范化流程
- 无需等待计时器

## 防止冲突的机制

### 1. 时间戳检查
```typescript
lastEditTimeRef.current = Date.now(); // 每次编辑时更新
```

### 2. 规范化前检查
```typescript
const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
if (timeSinceLastEdit >= 5000) {
  // 应用规范化
}
```

### 3. useEffect 保护
```typescript
useEffect(() => {
  const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
  if (timeSinceLastEdit < 5000) {
    return; // 不覆盖用户输入
  }
  setLocalCode(generatedCode);
}, [generatedCode]);
```

## 时间线示例

```
t=0s    用户开始编辑 "ggplot(data)"
        ↓ 立即显示在编辑器

t=0.5s  停止编辑 500ms
        ↓ 触发同步到积木块
        ↓ 代码被规范化为 "ggplot(data = data)"
        ↓ 更新 store.generatedCode

t=5.5s  5秒无编辑
        ↓ 应用规范化显示
        ↓ 编辑器显示 "ggplot(data = data)"
```

## 实现细节

### 计时器管理
- `syncTimerRef`: 500ms 同步计时器
- `normalizeTimerRef`: 5秒规范化计时器
- 每次新编辑都会清除旧计时器，重新开始计时

### 获取最新的 generatedCode
```typescript
// 使用 getState() 获取最新值，而不是依赖 hook 的闭包
const { generatedCode: updatedCode } = useBlockStore.getState();
setLocalCode(updatedCode);
```

### 清理资源
```typescript
useEffect(() => {
  return () => {
    // 组件卸载时清理计时器
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (normalizeTimerRef.current) clearTimeout(normalizeTimerRef.current);
  };
}, []);
```

## 用户体验

### ✅ 优点
1. 编辑时立即响应，无延迟感
2. 自动保持代码格式一致
3. 不打断用户的编辑流程
4. 可以手动触发同步和规范化

### ⚠️ 注意事项
1. 5秒的等待时间是可调整的参数
2. 规范化可能改变代码格式，但不改变语义
3. 如果用户连续编辑，规范化会一直延迟

