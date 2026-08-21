import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemberAvatar } from '@/features/groups/MemberAvatar'
import { makeMember } from '@/test/supabase-mock'

describe('MemberAvatar', () => {
  it('shows the member name tooltip on touch press', async () => {
    render(
      <MemberAvatar
        member={makeMember({
          display_name: 'Member B',
          avatar_url: 'icon:spider-man',
        })}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Member B' })
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })

    expect(
      await screen.findByRole('tooltip', { name: 'Member B' }),
    ).toBeInTheDocument()
  })

  it('marks owners in the accessible label when highlighted', () => {
    render(
      <MemberAvatar
        member={makeMember({
          display_name: 'Owner A',
          role: 'owner',
        })}
        highlightOwner
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Owner A (owner)' }),
    ).toBeInTheDocument()
  })
})
