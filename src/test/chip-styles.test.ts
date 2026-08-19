import { chipClasses, chipButtonClasses, chipToneClasses } from '@/lib/chip-styles'

describe('chipStyles', () => {
  it('pairs matching border and text colors with a darkened background', () => {
    for (const tone of ['gold', 'green', 'violet', 'metal', 'danger'] as const) {
      const classes = chipToneClasses(tone)
      expect(classes).toContain(`border-chip-${tone}-fg`)
      expect(classes).toContain(`text-chip-${tone}-fg`)
      expect(classes).toContain(`bg-chip-${tone}-bg`)
    }
  })

  it('builds pill and square chip variants from the shared base', () => {
    expect(chipClasses('gold', 'pill')).toContain('rounded-full')
    expect(chipClasses('green', 'square')).toContain('size-10')
  })

  it('builds chip-styled button classes with hover feedback', () => {
    expect(chipButtonClasses('danger')).toContain('border-chip-danger-fg')
    expect(chipButtonClasses('danger')).toContain('text-chip-danger-fg')
    expect(chipButtonClasses('danger')).toContain('bg-chip-danger-bg')
  })
})
