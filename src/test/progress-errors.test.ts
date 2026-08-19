import {
  toFriendlyCurrentTitleError,
  toFriendlyProgressError,
} from '@/features/progress/progress-errors'

describe('progress errors', () => {
  it('hides permission failures behind owner/member copy', () => {
    expect(toFriendlyProgressError({ code: '42501' })).toBe(
      'You can only update your own watch status.',
    )
    expect(toFriendlyCurrentTitleError({ code: '42501' })).toBe(
      'Only the group owner can change the current title.',
    )
    expect(toFriendlyProgressError({ message: 'db exploded' })).toBe(
      'Progress could not be updated. Please try again.',
    )
  })
})
