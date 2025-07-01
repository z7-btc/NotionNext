import { useEffect } from 'react'

/**
 * 文件下载处理组件
 * 在客户端处理Notion文件链接，确保文件可以正确下载
 */
const FileDownloadHandler = () => {
  useEffect(() => {
    // 处理页面中的文件链接
    const handleFileLinks = () => {
      const fileLinks = document.querySelectorAll('a[href*="notion.so/signed"], a[href*="file.notion.so"], a[href*="amazonaws.com"]')
      
      fileLinks.forEach(link => {
        // 如果链接还没有被处理过
        if (!link.dataset.processed) {
          const originalHref = link.href
          
          console.log('🔗 [FileDownload] 处理文件链接:', originalHref)
          
          // 添加下载属性
          link.setAttribute('download', '')
          link.setAttribute('target', '_blank')
          link.setAttribute('rel', 'noopener noreferrer')
          
          // 添加点击事件处理
          link.addEventListener('click', async (e) => {
            e.preventDefault()
            
            try {
              console.log('📥 [FileDownload] 开始下载文件:', originalHref)
              
              // 尝试直接下载
              const response = await fetch(originalHref)
              
              if (response.ok) {
                // 获取文件名
                const contentDisposition = response.headers.get('content-disposition')
                let filename = 'download'
                
                if (contentDisposition) {
                  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                  if (filenameMatch) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                  }
                }
                
                // 创建下载链接
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
                
                console.log('✅ [FileDownload] 文件下载成功:', filename)
              } else {
                console.warn('⚠️ [FileDownload] 文件下载失败，尝试直接打开:', response.status)
                // 如果下载失败，尝试在新窗口打开
                window.open(originalHref, '_blank')
              }
            } catch (error) {
              console.error('🚨 [FileDownload] 下载过程中出错:', error)
              // 出错时回退到直接打开链接
              window.open(originalHref, '_blank')
            }
          })
          
          // 标记为已处理
          link.dataset.processed = 'true'
        }
      })
    }
    
    // 初始处理
    handleFileLinks()
    
    // 监听DOM变化，处理动态添加的链接
    const observer = new MutationObserver(() => {
      handleFileLinks()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    return () => {
      observer.disconnect()
    }
  }, [])
  
  return null // 这是一个无UI组件
}

export default FileDownloadHandler
