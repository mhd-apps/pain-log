import type { Severity } from '../types'

// 0 = calm pale blue, 10 = deep warm red. Interpolated through hue + saturation + lightness.
export function severityColor(severity: number): string {
  const t = Math.max(0, Math.min(10, severity)) / 10
  const hue = 210 - t * 210 // 210 (blue) -> 0 (red)
  const saturation = 55 + t * 25
  const lightness = 82 - t * 34
  return `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`
}

export function severityTextColor(severity: number): string {
  return severity >= 6 ? '#fff' : '#2c2a26'
}

export function severityLabel(severity: Severity): string {
  return String(severity)
}
