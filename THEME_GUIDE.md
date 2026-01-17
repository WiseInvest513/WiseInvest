# 暗色模式使用指南

## 设计理念

我们使用 **CSS 变量 + 语义化类名** 的方式来实现暗色模式，而不是在每个地方都写 `dark:` 前缀。这样代码更优雅、更易维护。

## 可用的语义化类名

### 文本颜色
- `text-text-primary` - 主要文本（亮色模式：黑色，暗色模式：白色）
- `text-text-secondary` - 次要文本（亮色模式：slate-500，暗色模式：slate-400）
- `text-text-tertiary` - 三级文本（亮色模式：slate-600，暗色模式：slate-500）
- `text-text-muted` - 弱化文本（亮色模式：slate-400，暗色模式：slate-600）

### 背景颜色
- `bg-bg-primary` - 主背景（亮色模式：白色，暗色模式：slate-950）
- `bg-bg-secondary` - 次要背景（亮色模式：slate-50，暗色模式：slate-900）
- `bg-bg-tertiary` - 三级背景（亮色模式：slate-100，暗色模式：slate-800）

### 边框颜色
- `border-border-color` - 边框颜色（亮色模式：slate-200，暗色模式：slate-800）

## 使用示例

### ❌ 不好的写法（硬编码）
```tsx
<div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
  内容
</div>
```

### ✅ 好的写法（语义化）
```tsx
<div className="bg-bg-primary text-text-primary">
  内容
</div>
```

## 迁移指南

当需要更新页面时，请将：
- `bg-white` → `bg-bg-primary`
- `bg-slate-50` → `bg-bg-secondary`
- `text-slate-900` → `text-text-primary`
- `text-slate-500` → `text-text-secondary`
- `border-slate-200` → `border-border-color`

## 特殊颜色

对于品牌色（如黄色 `yellow-400`），仍然可以使用 `dark:` 前缀，因为它们是固定的品牌色：
```tsx
<button className="bg-yellow-400 dark:bg-yellow-500">
  按钮
</button>
```

