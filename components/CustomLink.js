import Link from 'next/link'
import { forwardRef } from 'react'

/**
 * 自定义Link组件，所有链接都在新窗口打开
 * @param {*} props 
 * @returns 
 */
const CustomLink = forwardRef(({ children, target = '_blank', rel = 'noopener noreferrer', ...props }, ref) => {
  return (
    <Link {...props} target={target} rel={rel} ref={ref}>
      {children}
    </Link>
  )
})

CustomLink.displayName = 'CustomLink'

export default CustomLink
