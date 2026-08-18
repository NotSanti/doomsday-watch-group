export function safeReturnTo(
  value: string | null | undefined,
  fallback = '/app',
): string {
  if (!value) {
    return fallback
  }

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return fallback
  }

  return value
}
