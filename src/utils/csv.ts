import {
  CYCLE_LABELS,
  DURATION_LABELS,
  LOCATION_LABELS,
  type PainRecord,
  formatSeverity,
  severityBounds,
  QUALITY_LABELS,
  RELIEF_LABELS,
  TRIGGER_LABELS,
  URINATION_LABELS,
} from '../types'
import { formatDateJp, formatTime } from './date'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function recordsToCsv(records: PainRecord[]): string {
  const headers = [
    '日付',
    '時刻',
    '強さ',
    '強さ下限',
    '強さ上限',
    '持続時間',
    '痛みの性質',
    '部位',
    '部位（その他）',
    '前後にあったこと',
    '排尿の様子',
    '月経周期',
    '頓服',
    '頓服の効果',
    'メモ',
  ]

  const rows = records.map((r) => [
    formatDateJp(r.timestamp),
    formatTime(r.timestamp),
    formatSeverity(r),
    String(severityBounds(r).min),
    String(severityBounds(r).max),
    r.duration ? DURATION_LABELS[r.duration] : '',
    (r.qualities ?? []).map((q) => QUALITY_LABELS[q]).join('/'),
    (r.locations ?? []).map((l) => LOCATION_LABELS[l]).join('/'),
    r.locationOther ?? '',
    (r.triggers ?? []).map((t) => TRIGGER_LABELS[t]).join('/'),
    r.urination ? URINATION_LABELS[r.urination] : '',
    r.cycle ? CYCLE_LABELS[r.cycle] : '',
    r.medication ? (r.medication.taken ? 'はい' : 'いいえ') : '',
    r.medication?.relief ? RELIEF_LABELS[r.medication.relief] : '',
    r.memo ?? '',
  ])

  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(','))
  // Leading BOM: without it Excel reads the file as Shift_JIS and the Japanese is mojibake.
  return `﻿${lines.join('\r\n')}`
}

export function downloadCsv(records: PainRecord[], filename: string): void {
  const csv = recordsToCsv(records)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
