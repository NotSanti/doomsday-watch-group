import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, id, ...props }: InputProps) {
  return (
    <input
      id={id}
      className={cn(
        'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-heading placeholder:text-muted',
        'hover:border-border-strong focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}
