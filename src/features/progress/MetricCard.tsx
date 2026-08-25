import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string
  description: string
  highlight?: 'gold'
}

export function MetricCard({
  label,
  value,
  description,
  highlight,
}: MetricCardProps) {
  const highlighted = highlight === 'gold'

  return (
    <article
      className={cn(
        'elevated-card rounded-xl p-4',
        highlighted && 'border-chip-gold-fg bg-chip-gold-bg rating-glow',
      )}
      title={description}
      aria-label={`${label}: ${value}`}
    >
      <h3 className="text-xs tracking-[0.14em] text-secondary uppercase">
        {label}
      </h3>
      <p
        className={cn(
          'mt-2 font-display text-2xl tracking-[0.06em]',
          highlighted ? 'gold-text' : 'text-heading',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs tracking-[0.08em] text-muted uppercase">
        {description}
      </p>
    </article>
  )
}
