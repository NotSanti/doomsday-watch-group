export function getAppVersionLabel(): string {
  const version = __APP_VERSION__
  const sha = __APP_GIT_SHA__
  if (sha && sha !== 'local') {
    return `v${version} · ${sha}`
  }

  return `v${version}`
}
