import { delCacheData } from '@/lib/cache/cache_manager'
import { redisClient } from '@/lib/cache/redis_cache'
import { cleanCache } from '@/lib/cache/local_file_cache'
import BLOG from '@/blog.config'

/**
 * 定时缓存清理API
 * 
 * 使用方法：
 * 1. Vercel Cron: 在vercel.json中配置定时任务
 * 2. 手动调用: GET /api/cron/clear-cache
 * 3. 外部定时器: 使用cron服务定时调用此API
 * 
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  // 验证请求来源（Vercel Cron 或授权密钥）
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  const { secret } = req.query

  // 检查是否为Vercel Cron请求或包含正确密钥
  const isVercelCron = authHeader === `Bearer ${cronSecret}`
  const isAuthorized = secret === cronSecret
  
  if (cronSecret && !isVercelCron && !isAuthorized) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Unauthorized. Invalid cron secret.' 
    })
  }

  try {
    console.log('🕐 定时缓存清理开始...', new Date().toISOString())

    // 清理应用层缓存
    await clearApplicationCaches()

    // 记录清理时间
    const timestamp = new Date().toISOString()
    
    console.log('✅ 定时缓存清理完成:', timestamp)

    res.status(200).json({ 
      status: 'success', 
      message: 'Scheduled cache clearing completed successfully',
      timestamp,
      clearedCaches: {
        redis: !!BLOG.REDIS_URL,
        file: !!process.env.ENABLE_FILE_CACHE,
        memory: true
      }
    })

  } catch (error) {
    console.error('❌ 定时缓存清理失败:', error)
    res.status(500).json({ 
      status: 'error', 
      message: 'Scheduled cache clearing failed', 
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 清理应用层缓存
 */
async function clearApplicationCaches() {
  const promises = []

  // 清理Redis中的Notion相关缓存
  if (BLOG.REDIS_URL && redisClient.keys) {
    const notionCachePatterns = [
      'site_data_*',
      'page_content_*', 
      'page_block_*'
    ]

    for (const pattern of notionCachePatterns) {
      promises.push(
        redisClient.keys(pattern).then(keys => {
          if (keys.length > 0) {
            console.log(`清理Redis缓存键: ${keys.length} 个匹配 ${pattern}`)
            return redisClient.del(...keys)
          }
        }).catch(error => {
          console.error(`清理Redis缓存失败 (${pattern}):`, error)
        })
      )
    }
  }

  // 清理文件缓存
  if (process.env.ENABLE_FILE_CACHE) {
    promises.push(
      cleanCache().then(() => {
        console.log('文件缓存已清理')
      }).catch(error => {
        console.error('清理文件缓存失败:', error)
      })
    )
  }

  await Promise.allSettled(promises)
}
