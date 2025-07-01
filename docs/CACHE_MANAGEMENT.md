# NotionNext 缓存管理指南

## 问题描述

当您在Notion中发布或修改文章后，网站可能不会立即显示更新的内容，需要刷新多次或重新部署才能看到变化。这是由于多层缓存机制导致的。

## 缓存层级

NotionNext使用了多层缓存来提高性能：

1. **Next.js ISR缓存** - 静态页面增量再生成缓存
2. **应用层缓存** - Redis/Memory/File缓存
3. **CDN缓存** - Vercel等平台的边缘缓存
4. **浏览器缓存** - 客户端缓存

## 解决方案

### 方法一：使用缓存清理API（推荐）

#### 1. 清理所有缓存
```bash
# POST请求清理所有缓存
curl -X POST "https://yourdomain.com/api/cache?action=clear"

# 如果设置了密钥
curl -X POST "https://yourdomain.com/api/cache?action=clear&secret=your_secret"
```

#### 2. 重新验证特定页面
```bash
# 重新验证首页
curl "https://yourdomain.com/api/cache?action=revalidate&path=/"

# 重新验证归档页
curl "https://yourdomain.com/api/cache?action=revalidate&path=/archive"
```

#### 3. 清理特定缓存键
```bash
curl -X POST "https://yourdomain.com/api/cache?action=clear&key=site_data_your_page_id"
```

### 方法二：使用命令行脚本

```bash
# 本地开发环境
npm run clear-cache:local

# 生产环境（需要设置SITE_URL环境变量）
npm run clear-cache
```

### 方法三：设置Webhook自动清理

1. 在环境变量中设置：
```env
NOTION_WEBHOOK_SECRET=your_webhook_secret
```

2. 在Notion中设置Webhook（如果支持）：
```
https://yourdomain.com/api/webhook/notion?secret=your_webhook_secret
```

3. 或者手动触发：
```bash
curl -X POST "https://yourdomain.com/api/webhook/notion?secret=your_webhook_secret"
```

## 环境变量配置

在您的`.env.local`或部署平台中添加以下环境变量：

```env
# 缓存清理密钥（可选，但推荐用于生产环境）
CACHE_SECRET=your_cache_secret

# Notion Webhook密钥（可选）
NOTION_WEBHOOK_SECRET=your_webhook_secret

# 网站URL（用于脚本）
SITE_URL=https://yourdomain.com

# 缓存重新验证间隔（秒）
NEXT_PUBLIC_REVALIDATE_SECOND=60
```

## 最佳实践

### 1. 开发环境
- 设置较短的缓存时间：`NEXT_PUBLIC_REVALIDATE_SECOND=5`
- 使用本地缓存清理脚本：`npm run clear-cache:local`

### 2. 生产环境
- 设置合理的缓存时间：`NEXT_PUBLIC_REVALIDATE_SECOND=60`
- 设置缓存清理密钥保护API
- 在发布文章后手动调用缓存清理API

### 3. 自动化流程
1. 发布/修改Notion文章
2. 调用缓存清理API：`POST /api/cache?action=clear`
3. 重新验证关键页面：`GET /api/cache?action=revalidate&path=/`

## 故障排除

### 1. 缓存仍未清理
- 检查CDN缓存设置（如Vercel的Edge Cache）
- 清理浏览器缓存
- 检查Redis连接状态

### 2. API调用失败
- 检查密钥是否正确
- 确认API路径是否正确
- 查看服务器日志

### 3. 部分页面未更新
- 手动重新验证特定页面
- 检查页面的ISR配置
- 确认页面路径是否正确

## 监控和日志

缓存操作会在服务器控制台输出日志，您可以通过以下方式查看：

```bash
# Vercel
vercel logs

# 本地开发
# 查看终端输出
```

## 注意事项

1. 频繁清理缓存会影响性能，建议合理使用
2. 生产环境务必设置密钥保护缓存清理API
3. 大型网站建议使用Redis缓存以获得更好的性能
4. 定期监控缓存命中率和清理频率
