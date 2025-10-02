# 📸 GGplotChim 界面截图

> **注意**：本文件用于记录应用截图位置。实际截图请在应用运行后添加。

---

## 建议截图列表

### 1. 主界面全览
**文件名**: `screenshots/main-interface.png`

展示内容：
- 三栏布局完整视图
- 左侧积木面板
- 中间画布区域
- 右侧预览面板

---

### 2. 积木面板特写
**文件名**: `screenshots/block-palette.png`

展示内容：
- 9 大类积木分类
- 积木列表展示
- 分类切换效果

---

### 3. 画布工作区
**文件名**: `screenshots/canvas-workspace.png`

展示内容：
- 多个积木组合
- 积木连接关系
- 选中状态展示

---

### 4. 代码预览
**文件名**: `screenshots/code-preview.png`

展示内容：
- Monaco Editor 代码高亮
- 生成的 R 代码
- 复制/下载按钮

---

### 5. 完整工作流
**文件名**: `screenshots/workflow-demo.gif`

展示内容：
- 从拖拽积木到生成代码的完整流程
- 动态演示（GIF 动画）

---

## 如何添加截图

### 方法 1: 手动截图

1. 启动应用 `npm start`
2. 使用截图工具捕获界面
3. 保存到 `screenshots/` 目录
4. 更新 README.md 中的图片链接

### 方法 2: 浏览器开发工具

```javascript
// 在浏览器控制台执行
document.body.style.zoom = '0.8'  // 调整缩放
// 然后使用浏览器截图功能
```

### 方法 3: 使用 Playwright/Puppeteer

```javascript
// 自动化截图脚本（可选）
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');
  await page.screenshot({ 
    path: 'screenshots/main-interface.png',
    fullPage: true 
  });
  await browser.close();
})();
```

---

## 在 README 中使用截图

```markdown
## 界面预览

### 主界面
![主界面](screenshots/main-interface.png)

### 代码预览
![代码预览](screenshots/code-preview.png)

### 工作流演示
![工作流](screenshots/workflow-demo.gif)
```

---

## 推荐工具

### Windows
- **Snipping Tool** - Windows 自带
- **Snipaste** - 功能强大的截图工具
- **ShareX** - 开源截图工具

### macOS
- **Command + Shift + 4** - 系统快捷键
- **CleanShot X** - 专业截图工具

### 录制 GIF
- **ScreenToGif** (Windows)
- **LICEcap** (跨平台)
- **Kap** (macOS)

---

## 截图规范

1. **分辨率**: 建议 1920x1080 或更高
2. **格式**: PNG（静态）/ GIF（动画）
3. **文件大小**: 单张 < 2MB，GIF < 5MB
4. **命名**: 使用小写字母和连字符
5. **压缩**: 使用 TinyPNG 等工具压缩

---

## 待办事项

- [ ] 添加主界面截图
- [ ] 添加积木面板特写
- [ ] 添加画布工作区截图
- [ ] 添加代码预览截图
- [ ] 录制完整工作流 GIF
- [ ] 更新 README.md 图片链接

