# 中文字体显示问题排查指南

## 🔍 问题诊断

如果您发现图表中的中文字符显示为方框□、问号？或其他乱码，这是**字体渲染问题**，而不是编码问题。

## 📊 原因分析

### WebR 环境的字体限制

GGplotChim 使用 WebR 在浏览器中运行 R 代码。在这个环境中：

1. **WebR 本身不包含字体**
   - WebR 是轻量级的 WASM 运行时，不包含任何字体文件
   - 所有字体渲染都依赖于**浏览器和操作系统**

2. **SVG 依赖系统字体**
   - R 的 `svg()` 设备生成矢量图
   - SVG 中的文本使用 `font-family` 属性指定字体
   - 浏览器会在**本地系统**中查找这些字体

3. **字体可用性因系统而异**
   - Windows：通常有 SimSun（宋体）、SimHei（黑体）等
   - macOS：通常有 PingFang SC、Heiti SC 等
   - Linux：可能需要手动安装中文字体

## ✅ 解决方案

### 方案 1：使用字体选择器（推荐）⭐

1. **打开字体配置**
   - 点击界面右上角的 **"🔤 字体"** 按钮
   - 或在设置中找到字体配置选项

2. **选择合适的字体**
   
   **Windows 用户推荐：**
   - 中文：**SimHei（黑体）** 或 **Microsoft YaHei（微软雅黑）**
   - 英文：**Arial** 或 **Times New Roman**
   
   **macOS 用户推荐：**
   - 中文：**PingFang SC** 或 **Heiti SC**
   - 英文：**Helvetica** 或 **Times**
   
   **Linux 用户推荐：**
   - 中文：**Noto Sans CJK SC** 或 **WenQuanYi Micro Hei**
   - 英文：**DejaVu Sans** 或 **Liberation Sans**

3. **测试预览**
   - 在字体选择器中查看预览："混合示例：Scientific Research 科学研究"
   - 如果预览显示正常，说明该字体在您的系统上可用

4. **应用并重新运行**
   - 点击 **"✓ 确认应用"**
   - 重新运行 R 代码生成图表

---

### 方案 2：检查系统字体

#### Windows

1. **打开字体设置**
   - 按 `Win + R`，输入 `control fonts`，回车
   - 或：设置 → 个性化 → 字体

2. **确认已安装的中文字体**
   - 查找：宋体、黑体、微软雅黑、楷体等
   - 如果缺少，可以从 Windows 更新中下载

3. **推荐安装的字体**
   - [思源黑体（Source Han Sans）](https://github.com/adobe-fonts/source-han-sans/releases)
   - [思源宋体（Source Han Serif）](https://github.com/adobe-fonts/source-han-serif/releases)
   - 这些是开源字体，支持简繁日韩多种字符

#### macOS

1. **打开字体册**
   - 应用程序 → 字体册（Font Book）

2. **确认中文字体**
   - macOS 通常预装 PingFang SC（苹方）、Heiti SC（黑体）等

3. **如果字体缺失**
   - 在字体册中，文件 → 恢复标准字体

#### Linux

1. **检查已安装字体**
   ```bash
   fc-list :lang=zh
   ```

2. **安装中文字体（Ubuntu/Debian）**
   ```bash
   sudo apt update
   sudo apt install fonts-wqy-zenhei fonts-wqy-microhei
   sudo apt install fonts-noto-cjk fonts-noto-cjk-extra
   ```

3. **刷新字体缓存**
   ```bash
   sudo fc-cache -fv
   ```

4. **重启浏览器**
   - 安装字体后，重启浏览器使字体生效

---

### 方案 3：使用字体回退机制

我们已经在 SVG 中内置了**字体回退链**，会按以下顺序尝试：

```
您选择的中文字体
  ↓ (如果不可用)
您选择的英文字体
  ↓
SimSun（宋体）
  ↓
SimHei（黑体）
  ↓
Microsoft YaHei（微软雅黑）
  ↓
PingFang SC（苹方）
  ↓
Hiragino Sans GB
  ↓
Source Han Sans CN（思源黑体）
  ↓
Noto Sans CJK SC
  ↓
WenQuanYi Micro Hei（文泉驿微米黑）
  ↓
Arial
  ↓
Helvetica
  ↓
sans-serif（浏览器默认无衬线字体）
```

**这意味着**：只要您的系统中有**任何一款**常见的中文字体，中文就应该能正常显示。

---

### 方案 4：在 R 代码中手动指定字体

如果全局字体设置不起作用，可以在 R 代码的 `theme()` 中明确指定：

```r
library(ggplot2)

# 创建图表
p <- ggplot(data, aes(x = x, y = y)) +
  geom_point() +
  labs(
    title = "中文标题",
    x = "X轴",
    y = "Y轴"
  ) +
  theme_minimal(base_family = "SimHei") +  # ← 明确指定字体
  theme(
    text = element_text(family = "SimHei"),  # 所有文本
    plot.title = element_text(family = "SimHei", size = 16, face = "bold"),
    axis.title = element_text(family = "SimHei", size = 14),
    axis.text = element_text(family = "SimHei", size = 12)
  )

print(p)
```

**常见字体名称**：
- `"SimSun"` - 宋体
- `"SimHei"` - 黑体
- `"Microsoft YaHei"` - 微软雅黑
- `"PingFang SC"` - 苹方（macOS）
- `"Noto Sans CJK SC"` - 思源黑体（Linux）

---

## 🧪 测试字体是否可用

### 方法 1：在字体选择器中预览

1. 打开 **"🔤 字体"** 配置
2. 选择一个字体
3. 查看预览区域的 **"示例：科研数据可视化"**
4. 如果显示正常，说明字体可用

### 方法 2：在浏览器中测试

1. 按 `F12` 打开浏览器开发者工具
2. 切换到 **Console（控制台）** 标签
3. 粘贴并运行以下代码：

```javascript
// 测试字体是否在系统中可用
function testFont(fontName) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 测试默认字体渲染
  context.font = '72px monospace';
  const defaultWidth = context.measureText('中文测试').width;
  
  // 测试指定字体渲染
  context.font = `72px "${fontName}", monospace`;
  const testWidth = context.measureText('中文测试').width;
  
  // 如果宽度不同，说明字体可用
  return defaultWidth !== testWidth;
}

// 测试常见中文字体
const fonts = ['SimSun', 'SimHei', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC'];
fonts.forEach(font => {
  const available = testFont(font);
  console.log(`${font}: ${available ? '✅ 可用' : '❌ 不可用'}`);
});
```

4. 查看输出，看哪些字体可用

### 方法 3：运行简单的测试代码

在 GGplotChim 中运行以下 R 代码：

```r
library(ggplot2)

# 创建测试数据
data <- data.frame(
  x = c("第一组", "第二组", "第三组"),
  y = c(10, 20, 15)
)

# 创建柱状图
p <- ggplot(data, aes(x = x, y = y, fill = x)) +
  geom_col() +
  labs(
    title = "中文字体测试",
    x = "类别",
    y = "数值"
  ) +
  theme_minimal(base_family = "SimHei") +
  theme(
    text = element_text(family = "SimHei", size = 14),
    plot.title = element_text(size = 18, face = "bold"),
    legend.position = "none"
  )

print(p)
```

如果中文正常显示，说明字体配置成功！

---

## 🔧 高级配置

### 为不同元素设置不同字体

```r
library(ggplot2)

p <- ggplot(data, aes(x = x, y = y)) +
  geom_point() +
  labs(title = "标题（黑体）", x = "X轴（宋体）", y = "Y轴（楷体）") +
  theme_minimal() +
  theme(
    plot.title = element_text(family = "SimHei", size = 18, face = "bold"),
    axis.title.x = element_text(family = "SimSun", size = 14),
    axis.title.y = element_text(family = "KaiTi", size = 14),
    axis.text = element_text(family = "SimHei", size = 12),
    legend.text = element_text(family = "Microsoft YaHei")
  )

print(p)
```

### 中英文混合字体优化

```r
# 使用字体回退
theme(
  text = element_text(family = "SimHei, Arial, sans-serif")
)

# 这样英文会使用 Arial，中文使用黑体
```

---

## ⚠️ 已知问题

### 1. **字体在 PNG/JPEG 导出中显示异常**

**原因**：PNG/JPEG 导出时，我们使用 Canvas API 将 SVG 转换为位图。Canvas 的字体渲染依赖于浏览器。

**解决方案**：
- 优先使用 **SVG 格式**（矢量图，字体最准确）
- 如果需要 PNG，确保在字体选择器中选择了系统中**真实存在**的字体
- 测试：在字体选择器预览区看到正常显示，PNG 就应该也正常

### 2. **在其他设备上打开 SVG，中文消失**

**原因**：SVG 包含的是字体名称，不包含字体文件本身。如果目标设备没有该字体，会回退到默认字体。

**解决方案**：
- **方案 A**：导出为 PNG/JPEG（字体被渲染为像素）
- **方案 B**：使用跨平台字体（如 Arial，或安装思源黑体）
- **方案 C**：在专业软件（Illustrator）中将文字转为路径

### 3. **部分中文显示，部分显示为方框**

**原因**：字体不完整，缺少某些 Unicode 字符。

**解决方案**：
- 使用**完整版中文字体**（如思源黑体，支持 CJK 全字符集）
- 避免使用生僻字或特殊符号
- 检查字体版本是否过旧

### 4. **macOS 上字体粗细不一致**

**原因**：macOS 的字体渲染算法与 Windows 不同。

**解决方案**：
- 在 `theme()` 中明确指定 `face = "bold"` 或 `face = "plain"`
- 使用 `element_text(size = 14, face = "bold")` 设置粗体

---

## 📚 推荐字体

### 开源免费字体（推荐）

| 字体名称 | 类型 | 特点 | 下载链接 |
|---------|------|------|---------|
| **思源黑体** (Source Han Sans) | 无衬线 | Adobe 开发，支持简繁日韩，字形优美 | [GitHub](https://github.com/adobe-fonts/source-han-sans/releases) |
| **思源宋体** (Source Han Serif) | 衬线 | 古典风格，适合学术论文 | [GitHub](https://github.com/adobe-fonts/source-han-serif/releases) |
| **Noto Sans CJK** | 无衬线 | Google 开发，与思源黑体同源 | [Google Fonts](https://www.google.com/get/noto/) |
| **文泉驿微米黑** | 无衬线 | Linux 常用，开源免费 | [网站](http://wenq.org/) |

### 系统自带字体

**Windows：**
- 宋体（SimSun） - 经典衬线
- 黑体（SimHei） - 无衬线，清晰
- 微软雅黑（Microsoft YaHei） - 现代无衬线
- 楷体（KaiTi） - 书法风格

**macOS：**
- 苹方（PingFang SC） - 现代无衬线，推荐
- 华文黑体（STHeiti） - 无衬线
- 华文宋体（STSong） - 衬线

**Linux：**
- 文泉驿微米黑（WenQuanYi Micro Hei）
- Noto Sans CJK SC
- 需手动安装

---

## 🎯 最佳实践

### 1. **学术论文**

```r
# 宋体 + Times New Roman（经典组合）
theme_minimal(base_family = "SimSun") +
  theme(
    text = element_text(family = "SimSun, Times New Roman, serif", size = 12),
    plot.title = element_text(size = 16, face = "bold"),
    axis.title = element_text(size = 14)
  )
```

### 2. **PPT 演示**

```r
# 黑体 + Arial（清晰易读）
theme_minimal(base_family = "SimHei") +
  theme(
    text = element_text(family = "SimHei, Arial, sans-serif", size = 14),
    plot.title = element_text(size = 20, face = "bold")
  )
```

### 3. **网页展示**

```r
# 微软雅黑 + Helvetica（现代风格）
theme_minimal(base_family = "Microsoft YaHei") +
  theme(
    text = element_text(family = "Microsoft YaHei, Helvetica, sans-serif", size = 13)
  )
```

### 4. **打印海报**

```r
# 黑体 + Helvetica（醒目大方）
theme_minimal(base_family = "SimHei") +
  theme(
    text = element_text(family = "SimHei, Helvetica, sans-serif", size = 16, face = "bold"),
    plot.title = element_text(size = 24, face = "bold")
  )
```

---

## 💡 常见问题

### Q1: 为什么字体选择器中预览正常，但生成的图表还是乱码？

**A**: 可能原因：
1. 字体配置没有生效 → 点击"确认应用"后，**重新运行代码**
2. R 代码中硬编码了字体 → 检查代码中的 `theme(text = element_text(family = "..."))`
3. 浏览器缓存 → 刷新页面（Ctrl+F5 / Cmd+Shift+R）

---

### Q2: 导出的 PNG 中文正常，但 SVG 打开后乱码？

**A**: SVG 在另一个设备上打开，该设备可能没有相应的字体。
- **解决方案 1**：使用 PNG 格式分享
- **解决方案 2**：在 Illustrator 等软件中打开 SVG，选择"对象 → 扩展"，将文字转为路径
- **解决方案 3**：使用跨平台字体（如思源黑体）

---

### Q3: Linux 上所有中文都显示为方框？

**A**: Linux 默认可能没有安装中文字体。

**快速解决**（Ubuntu/Debian）：
```bash
sudo apt install fonts-noto-cjk fonts-wqy-zenhei
sudo fc-cache -fv
```

然后重启浏览器，在字体选择器中选择 **Noto Sans CJK SC** 或 **WenQuanYi Zen Hei**。

---

### Q4: macOS 上中文显示偏细？

**A**: 在 theme 中设置粗体：
```r
theme(
  text = element_text(family = "PingFang SC", size = 14, face = "bold")
)
```

---

### Q5: 能不能支持网络字体（Web Fonts）？

**A**: 理论上可以，但：
1. WebR 环境中 R 的 SVG 设备不支持 `@font-face`
2. 需要在浏览器中预加载字体
3. 可能会增加加载时间

目前推荐使用**系统字体**或**手动安装开源字体**。

---

## 📞 获取帮助

如果尝试了以上所有方法仍无法解决，请：

1. **检查浏览器控制台**
   - 按 `F12`，切换到 Console 标签
   - 查看是否有字体相关的警告或错误

2. **提供信息**
   - 操作系统和版本
   - 浏览器和版本
   - 您选择的字体
   - 字体选择器预览是否正常
   - SVG 图表和 PNG 图表的显示情况

3. **测试系统字体**
   - 运行本文档中的"测试字体是否可用"脚本
   - 提供可用字体列表

---

## ✅ 总结

**核心要点**：
1. ✅ 中文显示依赖于**系统中已安装的字体**
2. ✅ 使用 **"🔤 字体"** 选择器选择正确的字体
3. ✅ 优先使用**系统自带字体**（SimHei、PingFang SC等）
4. ✅ 字体选择器预览正常 = 图表应该正常
5. ✅ 安装**思源黑体**可解决大部分问题
6. ✅ 在 R 代码中使用 `theme(text = element_text(family = "..."))`

**快速修复**：
```
打开"🔤 字体" → 选择 SimHei（黑体）→ 确认应用 → 重新运行代码
```

现在您应该能够正常显示中文图表了！🎉

---

**最后更新**：2025-10-05  
**版本**：v1.2.0

