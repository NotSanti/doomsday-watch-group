import {
  MEDIA_TYPE_CHIP_LABEL,
  type MediaType,
} from '@/features/watchlist/title-schemas'
import { chipClasses, type ChipTone } from '@/lib/chip-styles'

const MEDIA_CHIP_TONE: Record<MediaType, ChipTone> = {
  movie: 'green',
  series: 'violet',
  special: 'gold',
}

type TitleTypeChipProps = {
  mediaType: MediaType
  className?: string
}

export function TitleTypeChip({ mediaType, className }: TitleTypeChipProps) {
  return (
    <span
      aria-hidden="true"
      className={chipClasses(MEDIA_CHIP_TONE[mediaType], 'square', className)}
    >
      {MEDIA_TYPE_CHIP_LABEL[mediaType]}
    </span>
  )
}
