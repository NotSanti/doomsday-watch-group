import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import { tmdbImageUrl } from '@/lib/tmdb-image'
import { cn } from '@/lib/utils'

type TitleArtworkProps = {
  path: string | null
  alt: string
  kind?: 'poster' | 'backdrop'
  className?: string
}

export function TitleArtwork({
  path,
  alt,
  kind = 'poster',
  className,
}: TitleArtworkProps) {
  const src = tmdbImageUrl(path, kind === 'backdrop' ? 'w780' : 'w342')
  const [failed, setFailed] = useState(false)
  const showFallback = !src || failed

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-elevated',
        kind === 'backdrop' ? 'aspect-16/9' : 'aspect-2/3',
        className,
      )}
    >
      {showFallback ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-metal"
          aria-hidden={alt.length === 0}
        >
          <Clapperboard className="size-8" aria-hidden="true" />
          {alt ? <span className="sr-only">{alt}</span> : null}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
