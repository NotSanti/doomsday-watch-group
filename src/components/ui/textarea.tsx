import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, id, ...props }: TextareaProps) {
  return (
    <textarea
      id={id}
      className={cn(
        'min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-muted',
        'hover:border-border-strong focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}
