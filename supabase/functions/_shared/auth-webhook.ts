export function getWebhookHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const needle = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === needle) {
      return value
    }
  }

  return undefined
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes)
  let binary = ''
  for (const byte of view) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

/** Verify a Standard Webhooks payload without pulling npm:standardwebhooks on cold start. */
export async function verifyStandardWebhookPayload(
  payload: string,
  headers: Record<string, string>,
  secret: string,
): Promise<unknown> {
  const id = getWebhookHeader(headers, 'webhook-id')
  const timestamp = getWebhookHeader(headers, 'webhook-timestamp')
  const signatureHeader = getWebhookHeader(headers, 'webhook-signature')

  if (!id || !timestamp || !signatureHeader) {
    throw new Error('Missing Standard Webhooks signature headers')
  }

  const keyBytes = decodeBase64(secret)
  const keyMaterial = new Uint8Array(keyBytes)
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = new TextEncoder().encode(`${id}.${timestamp}.${payload}`)
  const expected = bytesToBase64(await crypto.subtle.sign('HMAC', key, signed))
  const signatures = signatureHeader.split(' ').map((part) => {
    const prefix = 'v1,'
    return part.startsWith(prefix) ? part.slice(prefix.length) : part
  })

  if (!signatures.includes(expected)) {
    throw new Error('Invalid webhook signature')
  }

  return JSON.parse(payload) as unknown
}
