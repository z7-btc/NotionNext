#!/usr/bin/env node

/**
 * 缓存清理脚本
 * 
 * 使用方法：
 * node scripts/clear-cache.js
 * npm run clear-cache (需要在package.json中添加脚本)
 */

const https = require('https')
const http = require('http')

// 配置
const config = {
  // 您的网站域名
  domain: process.env.SITE_URL || 'localhost:3000',
  // 缓存清理密钥（可选）
  secret: process.env.CACHE_SECRET || '',
  // 是否使用HTTPS
  useHttps: process.env.NODE_ENV === 'production'
}

/**
 * 发送HTTP请求
 */
function makeRequest(path, method = 'POST') {
  return new Promise((resolve, reject) => {
    const protocol = config.useHttps ? https : http
    const url = `${config.useHttps ? 'https' : 'http'}://${config.domain}${path}`
    
    console.log(`${method} ${url}`)
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NotionNext-Cache-Cleaner'
      }
    }

    const req = protocol.request(url, options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve({ status: res.statusCode, data: result })
        } catch (error) {
          resolve({ status: res.statusCode, data: { message: data } })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

/**
 * 清理所有缓存
 */
async function clearAllCaches() {
  try {
    console.log('🧹 开始清理缓存...')
    
    const secretParam = config.secret ? `&secret=${config.secret}` : ''
    const response = await makeRequest(`/api/cache?action=clear${secretParam}`)
    
    if (response.status === 200) {
      console.log('✅ 缓存清理成功:', response.data.message)
    } else {
      console.error('❌ 缓存清理失败:', response.data.message)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

/**
 * 重新验证关键页面
 */
async function revalidatePages() {
  const pages = ['/', '/archive', '/tag', '/category']
  
  console.log('🔄 开始重新验证页面...')
  
  for (const page of pages) {
    try {
      const secretParam = config.secret ? `&secret=${config.secret}` : ''
      const response = await makeRequest(`/api/cache?action=revalidate&path=${page}${secretParam}`, 'GET')
      
      if (response.status === 200) {
        console.log(`✅ 页面 ${page} 重新验证成功`)
      } else {
        console.error(`❌ 页面 ${page} 重新验证失败:`, response.data.message)
      }
    } catch (error) {
      console.error(`❌ 页面 ${page} 请求失败:`, error.message)
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 NotionNext 缓存清理工具')
  console.log('================================')
  
  await clearAllCaches()
  await revalidatePages()
  
  console.log('================================')
  console.log('✨ 缓存清理完成！')
  console.log('💡 提示：如果问题仍然存在，请检查CDN缓存设置')
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { clearAllCaches, revalidatePages }
