const CREATE_FALLBACK = 'Your group could not be saved. Please try again.'
const LIST_FALLBACK = 'Your groups could not be loaded. Please try again.'
const DETAIL_FALLBACK = 'This group could not be loaded. Please try again.'
const MEMBERS_FALLBACK = 'Members could not be loaded. Please try again.'
const SETTINGS_FALLBACK = 'Group settings could not be saved. Please try again.'
const REMOVE_FALLBACK = 'That member could not be removed. Please try again.'
const LEAVE_FALLBACK = 'You could not leave this group. Please try again.'
const TRANSFER_FALLBACK = 'Ownership could not be transferred. Please try again.'
const DELETE_FALLBACK = 'This group could not be deleted. Please try again.'

type ErrorLike = {
  code?: string | null
  message?: string | null
}

function readError(error: unknown): ErrorLike {
  if (!error || typeof error !== 'object') {
    return {}
  }

  return error as ErrorLike
}

export function toFriendlyCreateGroupError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Sign in again to create a group.'
  }

  if (code === '23514') {
    return 'Group name must be 3 to 60 characters. Description can be 280 characters or fewer.'
  }

  return CREATE_FALLBACK
}

export function toFriendlyGroupListError(): string {
  return LIST_FALLBACK
}

export function toFriendlyGroupDetailError(): string {
  return DETAIL_FALLBACK
}

export function toFriendlyGroupMembersError(): string {
  return MEMBERS_FALLBACK
}

export function toFriendlyGroupSettingsError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Only the group owner can change these settings.'
  }

  if (code === '23514') {
    return 'Group name must be 3 to 60 characters. Description can be 280 characters or fewer.'
  }

  return SETTINGS_FALLBACK
}

export function toFriendlyRemoveMemberError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Only the group owner can remove members.'
  }

  return REMOVE_FALLBACK
}

export function toFriendlyLeaveGroupError(error: unknown): string {
  const { code, message } = readError(error)

  if (code === '42501' && message?.toLowerCase().includes('transfer')) {
    return 'Transfer ownership or delete the group before leaving.'
  }

  if (code === '42501') {
    return 'You cannot leave this group right now.'
  }

  return LEAVE_FALLBACK
}

export function toFriendlyTransferOwnershipError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Only the group owner can transfer ownership.'
  }

  if (code === '22023') {
    return 'Choose a current member to become the new owner.'
  }

  return TRANSFER_FALLBACK
}

export function toFriendlyDeleteGroupError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Only the group owner can delete this group.'
  }

  return DELETE_FALLBACK
}
