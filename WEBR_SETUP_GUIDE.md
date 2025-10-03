# WebR 设置指南

## 问题解决方案

### 1. 包安装问题

**问题：** `Error in install.packages("base64enc", repos = "https://repo.r-wasm.org/"): This version of R is not set up to install source packages`

**原因：** WebR 是一个在浏览器中运行的 R 环境，它不支持从源代码编译安装包。WebR 只能安装预编译的 WebAssembly 二进制包。

**解决方案：**
- ✅ 使用 `webR.installPackages(['package_name'])` 而不是 R 的 `install.packages()`
- ✅ WebR 维护了一个预编译包的仓库，包括 ggplot2 等常用包
- ✅ 使用 SVG 输出而不是 PNG（避免需要 base64enc 等额外依赖）

### 2. ggplot2 未找到问题

**问题：** `Error in library(ggplot2): there is no package called 'ggplot2'`

**原因：** ggplot2 需要通过 WebR 的 API 正确安装。

**解决方案：**
```typescript
// 正确的安装方法
await webR.installPackages(['ggplot2']);
await webR.evalR('library(ggplot2)');
```

## 实现改进

### 初始化时自动安装 ggplot2

```typescript
private async _doInitialize(): Promise<void> {
  this.webR = new WebR({
    baseUrl: 'https://webr.r-wasm.org/latest/',
    serviceWorkerUrl: '',
  });

  await this.webR.init();
  
  // 使用 WebR API 安装包
  await this.webR.installPackages(['ggplot2']);
  await this.webR.evalR('library(ggplot2)');
}
```

### 使用 SVG 而不是 PNG

WebR 原生支持 SVG 图形设备，无需额外的包依赖：

```typescript
const plotCode = `
library(ggplot2)

# 创建 SVG 设备
svg_data <- character(0)
svg_con <- textConnection("svg_data", "w", local = TRUE)
svg(svg_con, width = 8, height = 6)

# 生成图表
${code}

# 关闭设备并获取 SVG
dev.off()
svg_output <- textConnectionValue(svg_con)
close(svg_con)
paste(svg_output, collapse = "\\n")
`;
```

### 按需安装包

如果初始化时安装失败，可以在首次使用时再次尝试：

```typescript
async runPlot(code: string): Promise<RunResult> {
  // 确保 ggplot2 已加载
  try {
    await this.webR.evalR('if (!require("ggplot2", quietly = TRUE)) { stop("ggplot2 not available") }');
  } catch (e) {
    // 按需安装
    await this.webR.installPackages(['ggplot2']);
    await this.webR.evalR('library(ggplot2)');
  }
  
  // 执行绘图代码...
}
```

## WebR 限制

1. **只支持预编译包**：不是所有 CRAN 包都可用，只有 WebR 团队预编译的包
2. **文件系统限制**：虚拟文件系统，不能直接访问本地文件
3. **性能**：比原生 R 慢，因为运行在 WebAssembly 中
4. **包依赖**：某些需要系统库的包可能不可用

## 测试 WebR

启动应用后，打开浏览器控制台查看：
- 🚀 正在初始化 WebR...
- ✅ WebR 初始化成功！
- 📦 正在安装 ggplot2...
- ✅ ggplot2 安装成功！
- ✅ ggplot2 加载验证成功

## 故障排除

如果遇到问题：

1. **清除缓存**：WebR 使用 Service Worker，可能需要清除浏览器缓存
2. **检查网络**：确保可以访问 `https://webr.r-wasm.org/`
3. **查看控制台**：所有错误都会输出到浏览器控制台
4. **重新初始化**：刷新页面重新初始化 WebR

## 参考资源

- [WebR 官方文档](https://docs.r-wasm.org/webr/latest/)
- [WebR GitHub](https://github.com/r-wasm/webr)
- [可用包列表](https://repo.r-wasm.org/)

