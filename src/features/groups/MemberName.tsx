import type { ElementType } from 'react'
import { cn } from '@/lib/utils'

export const MEMBER_NAME_CLASS = 'uppercase'

export function MemberName({
  children,
  className,
  as: Tag = 'span',
}: {
  children: string
  className?: string
  as?: ElementType
}) {
  return <Tag className={cn(MEMBER_NAME_CLASS, className)}>{children}</Tag>
}
