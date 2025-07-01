import { cleanCache } from '@/lib/cache/local_file_cache'
import { delCacheData } from '@/lib/cache/cache_manager'
import { redisClient } from '@/lib/cache/redis_cache'
import BLOG from '@/blog.config'

/**
 * 清理缓存API
 * 支持清理所有类型的缓存：Redis、Memory、File
 * 使用方法：
 * POST /api/cache?action=clear
 * POST /api/cache?action=clear&key=specific_key
 * GET /api/cache?action=revalidate&path=/
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  const { action, key, path, secret } = req.query

  // 可选：添加密钥验证，防止恶意清理缓存
  if (process.env.CACHE_SECRET && secret !== process.env.CACHE_SECRET) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized. Please provide valid secret.'
    })
  }

  try {
    switch (action) {
      case 'clear':
        if (key) {
          // 清理特定缓存键
          await delCacheData(key)
          res.status(200).json({
            status: 'success',
            message: `Cache key '${key}' cleared successfully!`
          })
        } else {
          // 清理所有缓存
          await clearAllCaches()
          res.status(200).json({
            status: 'success',
            message: 'All caches cleared successfully!'
          })
        }
        break

      case 'revalidate':
        // ISR重新验证特定路径
        if (!path) {
          return res.status(400).json({
            status: 'error',
            message: 'Path parameter is required for revalidation'
          })
        }

        try {
          await res.revalidate(path)
          res.status(200).json({
            status: 'success',
            message: `Path '${path}' revalidated successfully!`
          })
        } catch (revalidateError) {
          res.status(500).json({
            status: 'error',
            message: 'Revalidation failed',
            error: revalidateError.message
          })
        }
        break

      default:
        res.status(400).json({
          status: 'error',
          message: 'Invalid action. Use "clear" or "revalidate"'
        })
    }
  } catch (error) {
    console.error('Cache operation failed:', error)
    res.status(500).json({
      status: 'error',
      message: 'Cache operation failed!',
      error: error.message
    })
  }
}

/**
 * 清理所有类型的缓存
 */
async function clearAllCaches() {
  const promises = []

  // 清理Redis缓存
  if (BLOG.REDIS_URL && redisClient.flushdb) {
    promises.push(redisClient.flushdb())
  }

  // 清理文件缓存
  if (process.env.ENABLE_FILE_CACHE) {
    promises.push(cleanCache())
  }

  // 清理内存缓存（Memory cache会在重启时自动清理）
  // 这里可以添加特定的内存缓存清理逻辑

  await Promise.all(promises)
}
