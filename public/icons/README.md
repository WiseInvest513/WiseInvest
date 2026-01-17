# 社交媒体图标文件夹

## 📁 文件夹位置
`/public/icons/`

## 📝 使用说明

### 1. 上传图标文件
将你的 PNG 图标文件放在这个文件夹中，文件名需要匹配代码中的路径：

- `x.png` - Twitter/X 图标
- `bilibili.png` - Bilibili 图标
- `youtube.png` - YouTube 图标
- `xhs.png` - 小红书图标
- `douyin.png` - 抖音图标
- `wechat.png` - 微信图标

### 2. 图标要求
- **格式**: PNG（支持透明背景）
- **尺寸**: 建议 512x512px 或更大（代码会自动缩放）
- **颜色**: 彩色图标效果最佳（悬停时会显示颜色）

### 3. 测试步骤

1. **上传图片**：
   - 将 PNG 文件拖拽到 `public/icons/` 文件夹
   - 或者使用文件管理器复制到该文件夹

2. **更新代码**：
   - 打开 `app/aboutme/page.tsx`
   - 找到对应的社交媒体配置
   - 取消注释 `pngPath` 行（如果被注释了）

3. **查看效果**：
   - 刷新浏览器页面 `http://localhost:3000/aboutme`
   - 你应该能看到右下角有半透明、旋转的图标水印
   - 悬停卡片时，图标会放大、旋转并显示颜色

### 4. 示例路径
代码中使用的路径格式：
```typescript
pngPath: "/icons/x.png"  // 注意：以 / 开头，不需要 public
```

### 5. 快速测试
如果你想快速测试效果，可以：
- 从网上下载任意一个彩色 PNG 图标
- 重命名为 `x.png`
- 放在 `public/icons/` 文件夹
- 刷新页面即可看到效果

## 🎨 图标来源推荐
- [Simple Icons](https://simpleicons.org/) - 免费品牌图标
- [Iconify](https://iconify.design/) - 大量图标库
- 各平台官方品牌资源页面

