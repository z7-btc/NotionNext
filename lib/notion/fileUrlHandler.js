import BLOG from '@/blog.config'

/**
 * 现代化的Notion文件URL处理器
 * 支持多种Notion文件格式和新的API
 */

/**
 * 检测是否为Notion文件URL
 * @param {string} url - 要检测的URL
 * @returns {boolean} 是否为Notion文件URL
 */
export function isNotionFileUrl(url) {
  if (!url || typeof url !== 'string') return false
  
  return (
    url.includes('amazonaws.com') ||
    url.includes('secure.notion-static.com') ||
    url.includes('prod-files-secure') ||
    url.includes('file.notion.so') ||
    url.indexOf('attachment') === 0 ||
    url.includes('notion.site/files/') ||
    url.includes('s3.us-west-2.amazonaws.com/secure.notion-static.com')
  )
}

/**
 * 获取文件的直接下载URL
 * @param {string} originalUrl - 原始文件URL
 * @param {string} blockId - 块ID
 * @param {string} blockType - 块类型 (file, pdf, video, audio等)
 * @returns {string} 处理后的URL
 */
export function getFileDownloadUrl(originalUrl, blockId, blockType = 'file') {
  if (!originalUrl) return originalUrl

  console.log('🔧 [FileHandler] 处理文件URL:', {
    originalUrl,
    blockId,
    blockType,
    isNotionFile: isNotionFileUrl(originalUrl)
  })

  // 如果不是Notion文件，直接返回
  if (!isNotionFileUrl(originalUrl)) {
    return originalUrl
  }

  try {
    // 处理attachment格式
    if (originalUrl.indexOf('attachment') === 0) {
      // attachment:${id}:${name} 格式
      const encodedUrl = encodeURIComponent(originalUrl)
      const signedUrl = `https://www.notion.so/signed/${encodedUrl}?table=block&id=${blockId}`

      // 对于视频和音频，添加额外的参数以确保流媒体播放
      if (blockType === 'video' || blockType === 'audio') {
        return `${signedUrl}&cache=v2&width=2048`
      }

      return signedUrl
    }

    // 处理新的file.notion.so格式
    if (originalUrl.includes('file.notion.so')) {
      // 对于视频，尝试添加流媒体参数
      if (blockType === 'video' || blockType === 'audio') {
        const url = new URL(originalUrl)
        url.searchParams.set('cache', 'v2')
        url.searchParams.set('width', '2048')
        return url.toString()
      }
      return originalUrl
    }

    // 处理传统AWS S3格式
    if (originalUrl.includes('amazonaws.com') ||
        originalUrl.includes('secure.notion-static.com') ||
        originalUrl.includes('prod-files-secure')) {
      const encodedUrl = encodeURIComponent(originalUrl)
      const signedUrl = `https://notion.so/signed/${encodedUrl}?table=block&id=${blockId}`

      // 对于视频和音频，添加额外的参数
      if (blockType === 'video' || blockType === 'audio') {
        return `${signedUrl}&cache=v2&width=2048`
      }

      return signedUrl
    }

    // 默认返回原URL
    return originalUrl

  } catch (error) {
    console.error('🚨 [FileHandler] URL处理失败:', error)
    return originalUrl
  }
}

/**
 * 为文件块生成下载链接
 * @param {object} fileBlock - 文件块对象
 * @returns {string} 下载链接
 */
export function generateFileDownloadLink(fileBlock) {
  if (!fileBlock?.value?.properties?.source?.[0]?.[0]) {
    return null
  }
  
  const originalUrl = fileBlock.value.properties.source[0][0]
  const blockId = fileBlock.value.id
  const blockType = fileBlock.value.type
  
  return getFileDownloadUrl(originalUrl, blockId, blockType)
}

/**
 * 检查文件URL是否可访问
 * @param {string} url - 要检查的URL
 * @returns {Promise<boolean>} URL是否可访问
 */
export async function checkFileUrlAccessibility(url) {
  if (!url) return false
  
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.warn('🔍 [FileHandler] URL可访问性检查失败:', error)
    return false
  }
}

/**
 * 获取文件的元数据
 * @param {string} url - 文件URL
 * @returns {Promise<object>} 文件元数据
 */
export async function getFileMetadata(url) {
  if (!url) return null
  
  try {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) return null
    
    return {
      size: response.headers.get('content-length'),
      type: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified'),
      accessible: true
    }
  } catch (error) {
    console.warn('🔍 [FileHandler] 获取文件元数据失败:', error)
    return { accessible: false }
  }
}

/**
 * 为文件添加下载属性
 * @param {string} url - 文件URL
 * @param {string} filename - 文件名
 * @returns {string} 带下载属性的URL
 */
export function addDownloadAttribute(url, filename) {
  if (!url) return url
  
  try {
    const urlObj = new URL(url)
    if (filename) {
      urlObj.searchParams.set('download', filename)
    }
    return urlObj.toString()
  } catch (error) {
    console.warn('🔧 [FileHandler] 添加下载属性失败:', error)
    return url
  }
}
