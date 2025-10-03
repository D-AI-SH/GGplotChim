# WebR 集成说明

## 概述

GGplotChim 现已集成 WebR，可以在浏览器中直接运行生成的 R 代码并实时预览 ggplot2 图表！

## 功能特性

✨ **无需服务器**: WebR 在浏览器端运行，完全离线可用  
📊 **实时预览**: 即时生成并显示图表  
💾 **图表下载**: 支持下载 PNG 格式图表  
🔄 **即时重运行**: 修改积木后可快速重新生成图表  
⚡ **快速响应**: 代码执行状态实时反馈

## 使用方法

### 1. 初始化

- 启动应用后，WebR 会自动初始化（首次约需 10-20 秒）
- 初始化完成后，会自动安装 ggplot2 包

### 2. 创建图表

1. 从左侧拖拽积木到画布
2. 连接积木构建完整的 ggplot2 代码
3. 切换到"图表预览"标签
4. 点击"运行代码"按钮

### 3. 查看结果

- **成功**: 图表将显示在预览区域
- **错误**: 显示详细的错误信息，可点击"重试"
- **加载**: 显示加载动画和状态提示

### 4. 下载图表

- 点击图表上方的"下载"按钮
- 图表将以 PNG 格式保存到本地

## 技术实现

### WebR 运行器

位置: `src/core/rRunner/webRRunner.ts`

主要功能:
- WebR 实例管理
- R 代码执行
- 图表生成（PNG 格式）
- 错误处理

### 状态管理

新增 store 状态:
- `isRunning`: 代码是否正在运行
- `runError`: 运行错误信息
- `isWebRInitialized`: WebR 是否已初始化

### 组件更新

`PlotPreview` 组件现在支持:
- WebR 初始化状态显示
- 代码执行进度提示
- 错误信息展示
- 图表下载功能

## 配置说明

### Webpack 配置

为支持 WebR 的 SharedArrayBuffer，已添加必要的 HTTP 头:

```javascript
headers: {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin'
}
```

## 注意事项

1. **首次加载**: 首次使用需要下载 WebR 运行环境（约 10-20 秒）
2. **网络要求**: 初次使用需要网络连接下载 WebR 和 ggplot2
3. **浏览器兼容**: 推荐使用 Chrome、Firefox、Edge 等现代浏览器
4. **性能**: 复杂图表可能需要几秒钟生成

## 示例代码

生成的 R 代码会自动运行，例如:

```r
library(ggplot2)

# 图层链 1
ggplot(mtcars, aes(x = wt, y = mpg))
  +geom_point(color = "blue", size = 3)
  +theme_minimal()
```

## 故障排除

### WebR 初始化失败

- 检查网络连接
- 刷新页面重试
- 查看浏览器控制台错误信息

### 图表生成失败

- 检查生成的 R 代码是否正确
- 确保积木连接完整
- 查看错误信息提示

### 图表不显示

- 确保有完整的 ggplot2 代码链
- 检查是否包含数据和几何对象
- 尝试重新运行

## 未来改进

- [ ] 支持更多图表格式（SVG、PDF）
- [ ] 添加图表尺寸自定义
- [ ] 支持自定义数据集导入
- [ ] 提供代码编辑和调试功能
- [ ] 优化大数据集性能

## 相关资源

- [WebR 官方文档](https://docs.r-wasm.org/webr/latest/)
- [ggplot2 文档](https://ggplot2.tidyverse.org/)
- [项目 GitHub](https://github.com/yourusername/ggplotchim)

## 贡献

欢迎提交 Issue 和 Pull Request！

