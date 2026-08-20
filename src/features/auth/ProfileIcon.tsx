import type { ProfileIconId } from '@/features/auth/profile-icons'
import { profileIconSrc } from '@/features/auth/profile-icons'
import { cn } from '@/lib/utils'

const SIZE_CLASS = {
  xs: 'size-8',
  sm: 'size-10',
  md: 'size-14',
  lg: 'size-24',
} as const

type ProfileIconProps = {
  id: ProfileIconId
  label?: string
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function ProfileIcon({
  id,
  label,
  size = 'md',
  className,
}: ProfileIconProps) {
  return (
    <img
      src={profileIconSrc(id)}
      alt={label ?? ''}
      className={cn(
        'rounded-full object-cover',
        SIZE_CLASS[size],
        className,
      )}
    />
  )
}
