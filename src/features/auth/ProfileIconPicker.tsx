import { ProfileIcon } from '@/features/auth/ProfileIcon'
import {
  PROFILE_ICONS,
  type ProfileIconId,
} from '@/features/auth/profile-icons'
import { cn } from '@/lib/utils'

type ProfileIconPickerProps = {
  value: ProfileIconId | null
  onChange: (id: ProfileIconId) => void
  disabled?: boolean
}

export function ProfileIconPicker({
  value,
  onChange,
  disabled = false,
}: ProfileIconPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Profile icon"
      className="grid grid-cols-5 justify-items-center gap-3 sm:grid-cols-6"
    >
      {PROFILE_ICONS.map((icon) => {
        const selected = value === icon.id

        return (
          <button
            key={icon.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={icon.label}
            disabled={disabled}
            onClick={() => {
              onChange(icon.id)
            }}
            className={cn(
              'rounded-full p-0 transition-shadow',
              'focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none',
              selected
                ? 'ring-2 ring-primary-emphasis ring-offset-2 ring-offset-surface-elevated'
                : 'ring-0 hover:ring-2 hover:ring-border-strong hover:ring-offset-2 hover:ring-offset-surface-elevated',
            )}
          >
            <ProfileIcon id={icon.id} />
          </button>
        )
      })}
    </div>
  )
}
