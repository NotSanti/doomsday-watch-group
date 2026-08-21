import { getAppVersionLabel } from '@/lib/app-version'
import { cn } from '@/lib/utils'

type AppVersionLabelProps = {
  className?: string
}

/** Subtle build marker for footers and PWA menus. */
export function AppVersionLabel({ className }: AppVersionLabelProps) {
  return (
    <p
      className={cn(
        'font-mono text-[10px] tracking-[0.08em] text-muted/60',
        className,
      )}
    >
      {getAppVersionLabel()}
    </p>
  )
}
