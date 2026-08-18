import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-crimson text-heading hover:bg-crimson-hover shadow-[0_0_24px_color-mix(in_srgb,var(--color-crimson)_28%,transparent)]',
        secondary:
          'border border-border bg-surface-2 text-heading hover:border-crimson/60',
        ghost: 'text-heading hover:bg-surface-2',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const classNames = cn(buttonVariants({ variant, size }), className)

  if (asChild) {
    return <Slot className={classNames} {...props} />
  }

  return <button className={classNames} type={type} {...props} />
}
