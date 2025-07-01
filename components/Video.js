import React, { useEffect, useRef, useState } from 'react'
import { isNotionFileUrl, getFileDownloadUrl } from '@/lib/notion/fileUrlHandler'

/**
 * 自定义视频组件，用于处理Notion视频块
 * 支持新的Notion文件URL格式
 */
export const Video = ({ block, className = '' }) => {
  const videoRef = useRef(null)
  const [videoSrc, setVideoSrc] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!block?.properties?.source?.[0]?.[0]) {
      console.warn('🎥 [Video] 没有找到视频源URL')
      setHasError(true)
      setIsLoading(false)
      return
    }

    const originalUrl = block.properties.source[0][0]
    const blockId = block.id
    
    console.log('🎥 [Video] 处理视频块:', {
      originalUrl,
      blockId,
      blockType: 'video',
      isNotionFile: isNotionFileUrl(originalUrl)
    })

    // 如果是Notion文件，使用我们的URL处理器
    if (isNotionFileUrl(originalUrl)) {
      const processedUrl = getFileDownloadUrl(originalUrl, blockId, 'video')
      console.log('🎥 [Video] 视频URL已处理:', {
        originalUrl,
        processedUrl
      })
      setVideoSrc(processedUrl)
    } else {
      // 外部视频直接使用
      console.log('🎥 [Video] 使用外部视频URL:', originalUrl)
      setVideoSrc(originalUrl)
    }

    setIsLoading(false)
  }, [block])

  const handleLoadStart = () => {
    console.log('🎥 [Video] 开始加载视频:', videoSrc)
  }

  const handleCanPlay = () => {
    console.log('🎥 [Video] 视频可以播放:', videoSrc)
    setHasError(false)
  }

  const handleError = (e) => {
    console.error('🎥 [Video] 视频加载失败:', {
      src: videoSrc,
      error: e.target.error
    })
    setHasError(true)
  }

  const handleLoadedData = () => {
    console.log('🎥 [Video] 视频数据加载完成:', videoSrc)
  }

  if (isLoading) {
    return (
      <div className={`notion-video ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">
            加载视频中...
          </div>
        </div>
      </div>
    )
  }

  if (hasError || !videoSrc) {
    return (
      <div className={`notion-video ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              ⚠️ 视频加载失败
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              {videoSrc ? '无法播放此视频文件' : '未找到视频源'}
            </div>
            {videoSrc && (
              <a 
                href={videoSrc} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-block"
              >
                尝试直接访问视频
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`notion-video ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        preload="metadata"
        className="w-full h-auto max-w-full rounded-lg shadow-lg"
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onLoadedData={handleLoadedData}
        style={{ maxHeight: '70vh' }}
      >
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc} type="video/webm" />
        <source src={videoSrc} type="video/ogg" />
        您的浏览器不支持视频播放。
        <a href={videoSrc} target="_blank" rel="noopener noreferrer">
          点击这里下载视频
        </a>
      </video>
      
      {/* 调试信息 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
          <div>视频源: {videoSrc}</div>
          <div>块ID: {block?.id}</div>
        </div>
      )}
    </div>
  )
}

export default Video
