import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />
}

export function SelectValue(
  props: ComponentProps<typeof SelectPrimitive.Value>,
) {
  return <SelectPrimitive.Value {...props} />
}

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'inline-flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm text-heading uppercase tracking-[0.08em]',
        'hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-placeholder:text-muted',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-70" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border/40 bg-surface-elevated/70 text-heading shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer items-center rounded-sm py-2 pr-8 pl-2 text-sm text-heading uppercase tracking-[0.08em] outline-none select-none',
        'focus:bg-surface-hover data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex size-3.5 items-center justify-center">
        <Check aria-hidden="true" className="size-3.5 text-primary-emphasis" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  id?: string
  label: string
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  disabled?: boolean
  className?: string
  triggerClassName?: string
  'aria-label'?: string
}

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  disabled = false,
  className,
  triggerClassName,
  'aria-label': ariaLabel,
}: SelectFieldProps) {
  return (
    <div className={cn('block', className)}>
      <label
        className="mb-1 block text-sm text-secondary uppercase tracking-[0.08em]"
        htmlFor={id}
      >
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-label={ariaLabel ?? label}
          className={triggerClassName}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
