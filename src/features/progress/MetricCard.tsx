type MetricCardProps = {
  label: string
  value: string
  description: string
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article
      className="elevated-card rounded-xl p-4"
      title={description}
    >
      <h3 className="text-xs tracking-[0.14em] text-secondary uppercase">
        {label}
      </h3>
      <p className="mt-2 font-display text-2xl tracking-[0.06em] text-heading">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{description}</p>
    </article>
  )
}
