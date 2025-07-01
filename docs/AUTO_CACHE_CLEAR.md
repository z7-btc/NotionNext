# 自动缓存清理配置指南

## 概述

我为您提供了多种自动清理缓存的方案，解决文章更新后需要手动刷新的问题。

## 方案对比

| 方案 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| 短缓存时间 | 简单，自动生效 | 性能稍差 | 个人博客，更新频繁 |
| 定时清理 | 性能好，可控 | 需要配置 | 商业网站，定期更新 |
| 手动清理 | 精确控制 | 需要手动操作 | 重要更新时使用 |

## 当前配置

### 1. 缓存时间设置
```javascript
NEXT_REVALIDATE_SECOND: 10  // 10秒后访问会触发重新生成
```

### 2. 自动定时清理
```json
// vercel.json 中的配置
"crons": [
  {
    "path": "/api/cron/clear-cache",
    "schedule": "*/10 * * * *"  // 每10分钟清理一次
  }
]
```

## 定时清理配置选项

您可以根据需要修改 `vercel.json` 中的 `schedule` 参数：

```json
"*/5 * * * *"   // 每5分钟
"*/10 * * * *"  // 每10分钟（当前配置）
"*/30 * * * *"  // 每30分钟
"0 * * * *"     // 每小时
"0 */2 * * *"   // 每2小时
"0 0 * * *"     // 每天午夜
```

## 环境变量配置

在Vercel部署设置中添加：

```env
# 定时任务密钥（必需）
CRON_SECRET=your_random_secret_key

# 缓存时间（可选，默认10秒）
NEXT_PUBLIC_REVALIDATE_SECOND=10
```

## 使用建议

### 个人博客（推荐配置）
```javascript
// blog.config.js
NEXT_REVALIDATE_SECOND: 10  // 10秒缓存

// vercel.json
"schedule": "*/10 * * * *"   // 每10分钟清理
```

### 商业网站（性能优先）
```javascript
// blog.config.js  
NEXT_REVALIDATE_SECOND: 60  // 60秒缓存

// vercel.json
"schedule": "*/30 * * * *"   // 每30分钟清理
```

### 高频更新网站
```javascript
// blog.config.js
NEXT_REVALIDATE_SECOND: 5   // 5秒缓存

// vercel.json
"schedule": "*/5 * * * *"    // 每5分钟清理
```

## 工作原理

1. **ISR缓存**: 页面在设定时间内被缓存
2. **定时清理**: 定时任务清理应用层缓存
3. **自动重新生成**: 下次访问时自动获取最新数据

## 监控和调试

### 查看定时任务日志
```bash
# Vercel CLI
vercel logs --follow

# 或在Vercel Dashboard中查看Function Logs
```

### 手动测试定时清理
```bash
curl "https://yourdomain.com/api/cron/clear-cache?secret=your_secret"
```

### 检查缓存状态
```bash
curl "https://yourdomain.com/api/cache?action=clear&secret=your_secret"
```

## 故障排除

### 1. 定时任务不工作
- 检查 `CRON_SECRET` 环境变量是否设置
- 确认 `vercel.json` 格式正确
- 查看Vercel Function日志

### 2. 缓存仍未清理
- 检查Redis连接状态
- 确认缓存键名称匹配
- 查看API响应状态

### 3. 性能问题
- 适当增加缓存时间
- 减少定时清理频率
- 使用Redis缓存

## 最佳实践

1. **开发环境**: 使用短缓存时间（5-10秒）
2. **生产环境**: 平衡性能和实时性（10-60秒）
3. **定时清理**: 根据更新频率设置（5-30分钟）
4. **监控**: 定期检查日志和缓存命中率
5. **备用方案**: 保留手动清理API作为备用

## 注意事项

- Vercel Cron功能需要Pro计划
- 频繁清理会影响性能
- 建议在低峰时段进行清理
- 定期备份重要数据
