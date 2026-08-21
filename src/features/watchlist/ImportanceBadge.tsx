import { Badge } from '@/components/ui/badge'
import {
  IMPORTANCE_BADGE_TONE,
  IMPORTANCE_LABEL,
  type Importance,
} from '@/features/watchlist/title-schemas'

type ImportanceBadgeProps = {
  importance: Importance
  className?: string
}

export function ImportanceBadge({
  importance,
  className,
}: ImportanceBadgeProps) {
  return (
    <Badge tone={IMPORTANCE_BADGE_TONE[importance]} className={className}>
      {IMPORTANCE_LABEL[importance]}
    </Badge>
  )
}
