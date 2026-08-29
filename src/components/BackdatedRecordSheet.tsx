import { useState } from 'react'
import { type PainRecord, type Severity, rangeFromTaps } from '../types'
import { formatDateJp, formatTime } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import { TimestampEditor } from './TimestampEditor'
import './BackdatedRecordSheet.css'

const SEVERITIES: Severity[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface BackdatedRecordSheetProps {
  onSave: (
    severity: Severity,
    severityMax: Severity | undefined,
    timestamp: number,
  ) => Promise<PainRecord | void>
  onClose: () => void
}

export function BackdatedRecordSheet({ onSave, onClose }: BackdatedRecordSheetProps) {
  const [timestamp, setTimestamp] = useState(() => Date.now())
  const [first, setFirst] = useState<Severity | null>(null)
  const [saving, setSaving] = useState(false)

  const isFuture = timestamp > Date.now()

  async function handlePick(severity: Severity) {
    if (saving || isFuture) return
    if (first === null) {
      setFirst(severity)
      return
    }
    setSaving(true)
    try {
      const { severity: min, severityMax } = rangeFromTaps(first, severity)
      await onSave(min, severityMax, timestamp)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__header">
          <h2>あとから記録する</h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <TimestampEditor title="痛みがあったのはいつですか？" value={timestamp} onChange={setTimestamp} />

        <div className="backdated__selected">
          {formatDateJp(timestamp)} {formatTime(timestamp)} の記録として保存します
        </div>

        <div className="backdated__severity-label">
          {first === null ? '痛みの強さを2つタップしてください' : `${first} を選びました。あと1つタップすると保存します`}
        </div>
        <div className="backdated__severity-grid">
          {SEVERITIES.map((n) => (
            <button
              key={n}
              type="button"
              className={`backdated__severity-button${first === n ? ' is-picked' : ''}`}
              style={{ background: severityColor(n), color: severityTextColor(n) }}
              onClick={() => handlePick(n)}
              disabled={isFuture}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="backdated__severity-hint">
          強さが変わらないときは、同じ数字を2回タップします
        </p>
      </div>
    </div>
  )
}
