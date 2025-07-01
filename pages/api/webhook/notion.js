import { delCacheData } from '@/lib/cache/cache_manager'
import { redisClient } from '@/lib/cache/redis_cache'
import { cleanCache } from '@/lib/cache/local_file_cache'
import BLOG from '@/blog.config'

/**
 * Notion Webhook处理器
 * 当Notion数据库发生变化时自动清理相关缓存
 * 
 * 使用方法：
 * 1. 在Notion中设置Webhook指向: https://yourdomain.com/api/webhook/notion
 * 2. 或者手动调用: POST /api/webhook/notion
 * 
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error', 
      message: 'Method not allowed. Use POST.' 
    })
  }

  try {
    const { secret } = req.query
    const body = req.body

    // 验证Webhook密钥（可选但推荐）
    if (process.env.NOTION_WEBHOOK_SECRET && secret !== process.env.NOTION_WEBHOOK_SECRET) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Unauthorized webhook request' 
      })
    }

    console.log('Notion webhook received:', body)

    // 清理相关缓存
    await clearNotionCaches()

    // 触发ISR重新验证关键页面
    const pathsToRevalidate = [
      '/', // 首页
      '/archive', // 归档页
      '/tag', // 标签页
      '/category' // 分类页
    ]

    const revalidatePromises = pathsToRevalidate.map(async (path) => {
      try {
        await res.revalidate(path)
        console.log(`Revalidated: ${path}`)
      } catch (error) {
        console.error(`Failed to revalidate ${path}:`, error)
      }
    })

    await Promise.allSettled(revalidatePromises)

    res.status(200).json({ 
      status: 'success', 
      message: 'Notion webhook processed successfully. Caches cleared and pages revalidated.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Notion webhook processing failed:', error)
    res.status(500).json({ 
      status: 'error', 
      message: 'Webhook processing failed', 
      error: error.message 
    })
  }
}

/**
 * 清理Notion相关的缓存
 */
async function clearNotionCaches() {
  const cacheKeysToDelete = [
    'site_data_*',
    'page_content_*',
    'page_block_*',
    'posts_*',
    'categories_*',
    'tags_*'
  ]

  const promises = []

  // 如果使用Redis，清理匹配的键
  if (BLOG.REDIS_URL && redisClient.keys) {
    for (const pattern of cacheKeysToDelete) {
      promises.push(
        redisClient.keys(pattern).then(keys => {
          if (keys.length > 0) {
            return redisClient.del(...keys)
          }
        })
      )
    }
  }

  // 清理文件缓存
  if (process.env.ENABLE_FILE_CACHE) {
    promises.push(cleanCache())
  }

  await Promise.all(promises)
  console.log('Notion caches cleared')
}
