# 🎨 GGPLOTCHIM 设计系统

基于 **Ant Design 5.x** 的设计规范，提供完整的设计令牌和可复用组件样式。

## 📁 文件结构

```
src/styles/
├── antd-design-system.css  # Ant Design 设计系统核心
├── components.css           # 可复用组件和工具类
├── variables.css            # 项目自定义变量
├── animations.css           # 动画效果
├── utilities.css            # 工具类（旧版）
├── main.css                 # 主样式文件
├── BlockPalette.css         # 积木面板样式
├── Canvas.css               # 画布样式
├── BlockNode.css            # 积木节点样式
├── PreviewPanel.css         # 预览面板样式
└── TemplateSelector.css     # 模板选择器样式
```

## 🎯 设计令牌 (Design Tokens)

### 颜色系统

#### 品牌色 (Primary - 蓝色)
```css
--ant-primary-1: #e6f4ff;  /* 最浅 */
--ant-primary-6: #1677ff;  /* 主色 ⭐ */
--ant-primary-10: #001d66; /* 最深 */
```

#### 成功色 (Success - 绿色)
```css
--ant-success-1: #f6ffed;
--ant-success-6: #52c41a;  /* 主色 ⭐ */
--ant-success-10: #092b00;
```

#### 警告色 (Warning - 橙色)
```css
--ant-warning-1: #fffbe6;
--ant-warning-6: #faad14;  /* 主色 ⭐ */
--ant-warning-10: #613400;
```

#### 错误色 (Error - 红色)
```css
--ant-error-1: #fff1f0;
--ant-error-6: #f5222d;    /* 主色 ⭐ */
--ant-error-10: #5c0011;
```

#### 中性色 (Neutral)
```css
--ant-gray-1: #ffffff;     /* 白色 */
--ant-gray-3: #f5f5f5;     /* 背景色 */
--ant-gray-5: #d9d9d9;     /* 边框色 */
--ant-gray-7: #8c8c8c;     /* 次要文本 */
--ant-gray-13: #000000;    /* 黑色 */
```

### 间距系统

```css
--ant-spacing-xs: 8px;
--ant-spacing-sm: 12px;
--ant-spacing-md: 16px;    /* 标准间距 ⭐ */
--ant-spacing-lg: 24px;
--ant-spacing-xl: 32px;
--ant-spacing-xxl: 48px;
```

### 圆角系统

```css
--ant-border-radius-sm: 2px;
--ant-border-radius-base: 6px;    /* 标准圆角 ⭐ */
--ant-border-radius-lg: 8px;
--ant-border-radius-xl: 12px;
--ant-border-radius-round: 100px; /* 胶囊形 */
--ant-border-radius-circle: 50%;  /* 圆形 */
```

### 阴影系统

```css
--ant-shadow-1: /* 轻微阴影 */
--ant-shadow-2: /* 标准阴影 ⭐ */
--ant-shadow-3: /* 强阴影 */
```

### 字体系统

```css
--ant-font-size-sm: 12px;
--ant-font-size-base: 14px;       /* 标准字号 ⭐ */
--ant-font-size-lg: 16px;
--ant-font-size-xl: 20px;
--ant-font-size-heading-1: 38px;
--ant-font-size-heading-3: 24px;
```

### 动画系统

```css
--ant-motion-duration-fast: 0.1s;
--ant-motion-duration-mid: 0.2s;  /* 标准时长 ⭐ */
--ant-motion-duration-slow: 0.3s;
--ant-motion-ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
```

## 🧩 组件样式

### 按钮 (Button)

```html
<!-- 主要按钮 -->
<button class="ant-btn ant-btn-primary">主要按钮</button>

<!-- 默认按钮 -->
<button class="ant-btn">默认按钮</button>

<!-- 虚线按钮 -->
<button class="ant-btn ant-btn-dashed">虚线按钮</button>

<!-- 文本按钮 -->
<button class="ant-btn ant-btn-text">文本按钮</button>

<!-- 链接按钮 -->
<button class="ant-btn ant-btn-link">链接按钮</button>

<!-- 危险按钮 -->
<button class="ant-btn ant-btn-danger">危险按钮</button>

<!-- 成功按钮 -->
<button class="ant-btn ant-btn-success">成功按钮</button>

<!-- 尺寸变体 -->
<button class="ant-btn ant-btn-sm">小按钮</button>
<button class="ant-btn">默认按钮</button>
<button class="ant-btn ant-btn-lg">大按钮</button>

<!-- 形状变体 -->
<button class="ant-btn ant-btn-circle">🔍</button>
<button class="ant-btn ant-btn-round">圆角按钮</button>
```

### 卡片 (Card)

```html
<!-- 基础卡片 -->
<div class="ant-card">
  <div class="ant-card-head">卡片标题</div>
  <div class="ant-card-body">卡片内容</div>
</div>

<!-- 可悬停卡片 -->
<div class="ant-card ant-card-hoverable">
  <div class="ant-card-body">悬停效果</div>
</div>

<!-- 带边框卡片 -->
<div class="ant-card ant-card-bordered">
  <div class="ant-card-body">带边框</div>
</div>
```

### 输入框 (Input)

```html
<!-- 基础输入框 -->
<input class="ant-input" placeholder="请输入内容" />

<!-- 大尺寸 -->
<input class="ant-input ant-input-lg" placeholder="大输入框" />

<!-- 小尺寸 -->
<input class="ant-input ant-input-sm" placeholder="小输入框" />
```

### 标签页 (Tabs)

```html
<div class="ant-tabs">
  <div class="ant-tabs-nav">
    <button class="ant-tabs-tab ant-tabs-tab-active">标签1</button>
    <button class="ant-tabs-tab">标签2</button>
    <button class="ant-tabs-tab">标签3</button>
  </div>
  <div class="ant-tabs-content">
    内容区域
  </div>
</div>
```

### 标签 (Tag)

```html
<span class="ant-tag">默认标签</span>
<span class="ant-tag ant-tag-primary">主要标签</span>
<span class="ant-tag ant-tag-success">成功标签</span>
<span class="ant-tag ant-tag-warning">警告标签</span>
<span class="ant-tag ant-tag-error">错误标签</span>
```

### 警告提示 (Alert)

```html
<div class="ant-alert ant-alert-info">信息提示</div>
<div class="ant-alert ant-alert-success">成功提示</div>
<div class="ant-alert ant-alert-warning">警告提示</div>
<div class="ant-alert ant-alert-error">错误提示</div>
```

### 开关 (Switch)

```html
<label class="ant-switch">
  <input type="checkbox" />
  <span class="toggle-slider"></span>
</label>
```

### 加载动画 (Spin)

```html
<div class="ant-spin"></div>
<div class="ant-spin ant-spin-lg"></div>
<div class="ant-spin ant-spin-sm"></div>
```

### 徽章 (Badge)

```html
<div class="ant-badge">
  <span>内容</span>
  <span class="ant-badge-count">5</span>
</div>

<div class="ant-badge">
  <span>内容</span>
  <span class="ant-badge-dot"></span>
</div>
```

## 🛠️ 工具类

### 间距工具类

```html
<!-- Margin -->
<div class="mt-md">上边距</div>
<div class="mb-lg">下边距</div>
<div class="ml-sm">左边距</div>
<div class="mr-xs">右边距</div>

<!-- Padding -->
<div class="pt-md">上内边距</div>
<div class="pb-lg">下内边距</div>
<div class="pl-sm">左内边距</div>
<div class="pr-xs">右内边距</div>
```

### Flexbox 工具类

```html
<!-- 基础 Flex -->
<div class="flex">Flex 容器</div>
<div class="flex flex-col">纵向 Flex</div>
<div class="flex flex-row">横向 Flex</div>

<!-- 对齐 -->
<div class="flex-center">居中对齐</div>
<div class="flex-between">两端对齐</div>
<div class="flex items-center">垂直居中</div>
<div class="flex justify-center">水平居中</div>

<!-- 间距 -->
<div class="flex gap-md">中等间距</div>
<div class="flex gap-lg">大间距</div>
```

### 文本工具类

```html
<!-- 颜色 -->
<span class="text-primary">主色文本</span>
<span class="text-success">成功文本</span>
<span class="text-warning">警告文本</span>
<span class="text-error">错误文本</span>
<span class="text-secondary">次要文本</span>
<span class="text-disabled">禁用文本</span>

<!-- 大小 -->
<span class="text-sm">小文本</span>
<span class="text-lg">大文本</span>

<!-- 粗细 -->
<span class="text-bold">粗体文本</span>

<!-- 对齐 -->
<div class="text-left">左对齐</div>
<div class="text-center">居中对齐</div>
<div class="text-right">右对齐</div>

<!-- 截断 -->
<div class="truncate">单行截断文本...</div>
<div class="line-clamp-2">两行截断文本...</div>
```

### 背景工具类

```html
<div class="bg-white">白色背景</div>
<div class="bg-gray">灰色背景</div>
<div class="bg-primary">主色背景</div>
<div class="bg-success">成功背景</div>
<div class="bg-warning">警告背景</div>
<div class="bg-error">错误背景</div>
```

### 边框工具类

```html
<div class="border">边框</div>
<div class="border-t">上边框</div>
<div class="border-b">下边框</div>
<div class="border-primary">主色边框</div>
<div class="border-none">无边框</div>
```

### 圆角工具类

```html
<div class="rounded-sm">小圆角</div>
<div class="rounded">标准圆角</div>
<div class="rounded-lg">大圆角</div>
<div class="rounded-full">胶囊形</div>
<div class="rounded-circle">圆形</div>
```

### 阴影工具类

```html
<div class="shadow-sm">轻微阴影</div>
<div class="shadow">标准阴影</div>
<div class="shadow-lg">强阴影</div>
<div class="shadow-none">无阴影</div>
```

### 交互工具类

```html
<!-- 光标 -->
<div class="cursor-pointer">指针光标</div>
<div class="cursor-not-allowed">禁止光标</div>

<!-- 用户选择 -->
<div class="select-none">禁止选择</div>
<div class="select-text">允许选择</div>

<!-- 指针事件 -->
<div class="pointer-events-none">禁用事件</div>
<div class="pointer-events-auto">启用事件</div>
```

### 悬停效果

```html
<div class="hover-lift">悬停上浮</div>
<div class="hover-scale">悬停放大</div>
<div class="hover-opacity">悬停透明</div>
```

### 过渡动画

```html
<div class="transition-all">全部过渡</div>
<div class="transition-fast">快速过渡</div>
<div class="transition-slow">慢速过渡</div>
```

### 显示工具类

```html
<div class="block">块级元素</div>
<div class="inline-block">行内块元素</div>
<div class="inline">行内元素</div>
<div class="hidden">隐藏元素</div>
```

### 溢出工具类

```html
<div class="overflow-hidden">隐藏溢出</div>
<div class="overflow-auto">自动滚动</div>
<div class="overflow-y-auto">垂直滚动</div>
```

### 宽高工具类

```html
<div class="w-full">全宽</div>
<div class="h-full">全高</div>
<div class="w-auto">自动宽度</div>
```

## 📝 使用示例

### 创建一个卡片式按钮组

```html
<div class="flex gap-md">
  <button class="ant-btn ant-btn-primary ant-btn-lg hover-lift">
    主要操作
  </button>
  <button class="ant-btn ant-btn-lg hover-lift">
    次要操作
  </button>
  <button class="ant-btn ant-btn-danger ant-btn-lg hover-lift">
    危险操作
  </button>
</div>
```

### 创建一个信息卡片

```html
<div class="ant-card ant-card-hoverable shadow">
  <div class="ant-card-head flex-between">
    <span class="text-bold">卡片标题</span>
    <span class="ant-tag ant-tag-success">新</span>
  </div>
  <div class="ant-card-body">
    <p class="text-secondary mb-md">这是卡片的描述信息。</p>
    <div class="flex gap-sm">
      <button class="ant-btn ant-btn-primary ant-btn-sm">操作</button>
      <button class="ant-btn ant-btn-text ant-btn-sm">取消</button>
    </div>
  </div>
</div>
```

### 创建一个表单

```html
<div class="form-item">
  <label class="form-label form-label-required">用户名</label>
  <input class="ant-input" placeholder="请输入用户名" />
  <div class="form-help">用户名长度为 3-20 个字符</div>
</div>

<div class="form-item">
  <label class="form-label">邮箱</label>
  <input class="ant-input" type="email" placeholder="请输入邮箱" />
</div>

<div class="form-item">
  <button class="ant-btn ant-btn-primary w-full">提交</button>
</div>
```

## 🎨 颜色使用建议

- **主色 (Primary)**: 用于主要操作、链接、强调元素
- **成功色 (Success)**: 用于成功状态、完成提示
- **警告色 (Warning)**: 用于警告信息、需要注意的内容
- **错误色 (Error)**: 用于错误提示、危险操作
- **中性色 (Gray)**: 用于文本、边框、背景

## 📐 间距使用建议

- **xs (8px)**: 紧密相关的元素间距
- **sm (12px)**: 小间距
- **md (16px)**: 标准间距 ⭐ 最常用
- **lg (24px)**: 大间距，用于分组
- **xl (32px)**: 超大间距
- **xxl (48px)**: 页面级间距

## 🚀 最佳实践

1. **优先使用设计令牌**: 使用 `var(--ant-*)` 变量而不是硬编码值
2. **使用工具类组合**: 通过组合工具类快速构建 UI
3. **保持一致性**: 遵循 Ant Design 的设计规范
4. **响应式设计**: 使用 Flexbox 工具类构建响应式布局
5. **语义化命名**: 使用有意义的类名

## 📚 参考资源

- [Ant Design 官方文档](https://ant.design/)
- [Ant Design 设计价值观](https://ant.design/docs/spec/values-cn)
- [Ant Design 色彩系统](https://ant.design/docs/spec/colors-cn)
