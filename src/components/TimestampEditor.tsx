import { combineDateTime, toDateInputValue, toTimeInputValue } from '../utils/date'
import './TimestampEditor.css'

const PRESETS = [
  { label: '30分前', minutes: 30 },
  { label: '1時間前', minutes: 60 },
  { label: '2時間前', minutes: 120 },
  { label: '3時間前', minutes: 180 },
]

interface TimestampEditorProps {
  title: string
  value: number
  onChange: (timestamp: number) => void
}

export function TimestampEditor({ title, value, onChange }: TimestampEditorProps) {
  // A pain episode can only have happened already, so the future is out of range.
  const now = Date.now()
  const isFuture = value > now

  function applyPreset(minutes: number) {
    onChange(now - minutes * 60_000)
  }

  function handleDate(dateStr: string) {
    if (!dateStr) return
    const next = combineDateTime(dateStr, toTimeInputValue(value))
    if (!Number.isNaN(next)) onChange(next)
  }

  function handleTime(timeStr: string) {
    if (!timeStr) return
    const next = combineDateTime(toDateInputValue(value), timeStr)
    if (!Number.isNaN(next)) onChange(next)
  }

  return (
    <div className="timestamp-editor">
      <h3>{title}</h3>

      <div className="timestamp-editor__presets">
        <button type="button" onClick={() => onChange(now)}>
          今
        </button>
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => applyPreset(p.minutes)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="timestamp-editor__fields">
        <input
          type="date"
          value={toDateInputValue(value)}
          max={toDateInputValue(now)}
          onChange={(e) => handleDate(e.target.value)}
          aria-label="日付"
        />
        <input
          type="time"
          value={toTimeInputValue(value)}
          onChange={(e) => handleTime(e.target.value)}
          aria-label="時刻"
        />
      </div>

      {isFuture && (
        <p className="timestamp-editor__note">
          これから先の日時が選ばれています。痛みがあった時刻に直してください。
        </p>
      )}
    </div>
  )
}
