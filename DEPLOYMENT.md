# GitHub Pages 部署指南

## 自动部署设置

本项目已配置 GitHub Actions 自动部署到 GitHub Pages。

### 启用步骤

1. **启用 GitHub Pages**
   - 进入 GitHub 仓库的 Settings > Pages
   - 在 "Source" 下选择 "GitHub Actions"
   - 保存设置

2. **触发部署**
   - 推送代码到 `main` 分支会自动触发部署
   - 或在 Actions 标签页手动触发 "Deploy to GitHub Pages" workflow

3. **查看部署状态**
   - 在 Actions 标签页查看部署进度
   - 部署成功后，可以通过 `https://<username>.github.io/ggplotchim` 访问

### 自定义配置

#### 修改部署路径
如果你的仓库名称不是 `ggplotchim`，需要修改以下文件：

1. `.github/workflows/deploy.yml`
   ```yaml
   env:
     PUBLIC_URL: /<你的仓库名>
   ```

#### 部署到自定义域名
如果要使用自定义域名：

1. 在 Settings > Pages 中配置自定义域名
2. 修改 `.github/workflows/deploy.yml`：
   ```yaml
   env:
     PUBLIC_URL: /
   ```

## 重要提醒：WebR 跨域限制

本项目使用 WebR，需要特定的 HTTP headers：
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

**GitHub Pages 限制**：
- GitHub Pages 不支持自定义 HTTP headers
- 这可能导致 WebR 功能无法正常工作

### 解决方案

如果 WebR 在 GitHub Pages 上无法正常运行，可以考虑：

1. **使用 Vercel 或 Netlify**
   - 这些平台支持自定义 headers
   - 可以通过配置文件设置所需的 CORS headers

2. **Vercel 部署示例**
   创建 `vercel.json`：
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Cross-Origin-Embedder-Policy",
             "value": "require-corp"
           },
           {
             "key": "Cross-Origin-Opener-Policy",
             "value": "same-origin"
           }
         ]
       }
     ]
   }
   ```

3. **Netlify 部署示例**
   创建 `netlify.toml`：
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       Cross-Origin-Embedder-Policy = "require-corp"
       Cross-Origin-Opener-Policy = "same-origin"
   ```

## 本地测试生产构建

在部署前，建议本地测试生产构建：

```bash
# 构建
npm run build

# 使用静态服务器测试（需要安装 serve）
npx serve -s dist --cors -p 3000
```

注意：本地测试时，需要确保服务器设置了正确的 CORS headers。

## 故障排除

### 构建失败
- 检查 Node.js 版本是否为 18+
- 确保所有依赖都在 `package.json` 中正确声明
- 查看 Actions 日志获取详细错误信息

### 页面无法访问
- 确认 GitHub Pages 已启用
- 检查 `PUBLIC_URL` 设置是否与仓库名称匹配
- 等待几分钟让 DNS 传播

### WebR 不工作
- 这很可能是由于 GitHub Pages 不支持自定义 headers
- 考虑使用 Vercel 或 Netlify 部署

