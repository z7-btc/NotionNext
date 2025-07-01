'use client'
import { useEffect, useState } from 'react'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import Link from 'next/link'

/**
 * 随机文章包装器 - 客户端组件，避免水合错误
 */
export default function RandomPostsWrapper({ posts, siteInfo, maxCount = 6 }) {
  const { locale } = useGlobal()
  const [randomPosts, setRandomPosts] = useState([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (posts && posts.length > 0) {
      // 在客户端生成随机文章列表
      const shuffled = [...posts].sort(() => Math.random() - 0.5)
      setRandomPosts(shuffled.slice(0, maxCount))
    }
  }, [posts, maxCount])

  // 服务端渲染时显示最新文章，避免水合错误
  const displayPosts = isClient ? randomPosts : posts?.slice(0, maxCount) || []

  if (!displayPosts || displayPosts.length === 0) {
    return null
  }

  return (
    <>
      {displayPosts.map((p, index) => {
        return (
          <Link href={`${siteConfig('SUB_PATH', '')}/${p?.slug}`} key={p?.id || index}>
            <div className='cursor-pointer h-[164px] group relative flex flex-col w-52 xl:w-full overflow-hidden shadow bg-white dark:bg-black dark:text-white rounded-xl'>
              <LazyImage
                priority={index === 0}
                className='h-24 object-cover'
                alt={p?.title}
                src={p?.pageCoverThumbnail || siteInfo?.pageCover}
              />
              <div className='group-hover:text-indigo-600 dark:group-hover:text-yellow-600 line-clamp-2 overflow-hidden m-2 font-semibold'>
                {p?.title}
              </div>
              {/* hover 悬浮的 '荐' 字 */}
              <div className='opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-200 transition-all absolute -top-2 -left-2 bg-indigo-600 dark:bg-yellow-600  text-white rounded-xl overflow-hidden pr-2 pb-2 pl-4 pt-4 text-xs'>
                {locale.COMMON.RECOMMEND_BADGES}
              </div>
            </div>
          </Link>
        )
      })}
    </>
  )
}
