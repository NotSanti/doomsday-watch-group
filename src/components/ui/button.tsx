import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { chipButtonClasses } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium uppercase tracking-[0.08em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: chipButtonClasses('green'),
        secondary: chipButtonClasses('metal'),
        ghost:
          'border border-transparent bg-transparent text-chip-metal-fg hover:border-chip-metal-fg hover:bg-chip-metal-bg',
        danger: chipButtonClasses('danger'),
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
