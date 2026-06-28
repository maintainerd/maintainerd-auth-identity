import { afterEach, describe, expect, it } from 'vitest'
import { applyBranding, getBrandingBackground } from './branding'

afterEach(() => {
  document.documentElement.removeAttribute('style')
})

describe('applyBranding', () => {
  it('maps the complete tenant palette and font to auth theme variables', () => {
    const cleanup = applyBranding(
      {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#0ea5e9',
        appBackground: '#f8fafc',
        topPanelBackground: '#ffffff',
        sidePanelBackground: '#0f172a',
        cardBackground: '#fefefe',
        textPrimary: '#111827',
        textMuted: '#6b7280',
        border: '#e5e7eb',
      },
      { family: 'Inter, system-ui, sans-serif' },
      '#f8fafc',
    )

    const style = document.documentElement.style
    expect(style.getPropertyValue('--primary')).toBe('#2563eb')
    expect(style.getPropertyValue('--ring')).toBe('#2563eb')
    expect(style.getPropertyValue('--secondary')).toBe('#64748b')
    expect(style.getPropertyValue('--accent')).toBe('#0ea5e9')
    expect(style.getPropertyValue('--background')).toBe('#f8fafc')
    expect(style.getPropertyValue('--popover')).toBe('#ffffff')
    expect(style.getPropertyValue('--sidebar')).toBe('#0f172a')
    expect(style.getPropertyValue('--branding-side-panel-foreground')).toBe('#ffffff')
    expect(style.getPropertyValue('--card')).toBe('#fefefe')
    expect(style.getPropertyValue('--foreground')).toBe('#111827')
    expect(style.getPropertyValue('--muted-foreground')).toBe('#6b7280')
    expect(style.getPropertyValue('--border')).toBe('#e5e7eb')
    expect(style.getPropertyValue('--font-family')).toBe('Inter, system-ui, sans-serif')
    expect(style.getPropertyValue('--auth-page-background')).toBe('#f8fafc')

    cleanup()
    expect(style.getPropertyValue('--primary')).toBe('')
    expect(style.getPropertyValue('--font-family')).toBe('')
  })

  it('restores pre-existing inline theme values during cleanup', () => {
    document.documentElement.style.setProperty('--primary', '#123456')

    const cleanup = applyBranding({ primary: '#abcdef' }, undefined, undefined)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#abcdef')

    cleanup()
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#123456')
  })

  it('ignores unsafe or malformed theme values', () => {
    applyBranding(
      { primary: 'url(https://example.test/pixel)', appBackground: 'red; color: transparent' },
      { family: 'Inter; display: none' },
      'url(https://example.test/background)',
    )

    const style = document.documentElement.style
    expect(style.getPropertyValue('--primary')).toBe('')
    expect(style.getPropertyValue('--font-family')).toBe('')
    expect(style.getPropertyValue('--auth-page-background')).toBe('')
  })
})

describe('getBrandingBackground', () => {
  it('prefers a gradient, then a background, then appBackground', () => {
    expect(getBrandingBackground({
      gradient: 'linear-gradient(180deg, #ffffff 0%, #2563eb 100%)',
      background: '#abcdef',
      colors: { appBackground: '#f8fafc' },
    })).toBe('linear-gradient(180deg, #ffffff 0%, #2563eb 100%)')

    expect(getBrandingBackground({
      background: '#abcdef',
      colors: { appBackground: '#f8fafc' },
    })).toBe('#abcdef')

    expect(getBrandingBackground({ colors: { appBackground: '#f8fafc' } })).toBe('#f8fafc')
  })
})
