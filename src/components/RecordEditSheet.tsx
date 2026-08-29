import { useState } from 'react'
import type { RecordPatch } from '../db'
import { type PainRecord, type Severity, formatSeverity, rangeFromTaps, severityBounds } from '../types'
import { formatDateTimeJp } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import { DetailForm } from './DetailForm'
import { TimestampEditor } from './TimestampEditor'
import './RecordEditSheet.css'

const SEVERITIES: Severity[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface RecordEditSheetProps {
  record: PainRecord
  onUpdate: (patch: RecordPatch) => void
  onDelete: () => void
  onClose: () => void
}

export function RecordEditSheet({ record, onUpdate, onDelete, onClose }: RecordEditSheetProps) {
  // Same rule as the record screen: two taps decide the strength.
  const [first, setFirst] = useState<Severity | null>(null)

  function handleTap(severity: Severity) {
    if (first === null) {
      setFirst(severity)
      return
    }
    onUpdate(rangeFromTaps(first, severity))
    setFirst(null)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__header">
          <h2>{formatDateTimeJp(record.timestamp)}</h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="sheet__severity-label">
          {first === null ? `強さ ${formatSeverity(record)}` : `${first} を選びました。あと1つタップしてください`}
        </div>
        <div className="sheet__severity-row">
          {SEVERITIES.map((n) => {
            const { min, max } = severityBounds(record)
            const picked = first === n
            const isEnd = first === null && (n === min || n === max)
            const isInside = first === null && n > min && n < max
            return (
              <button
                key={n}
                type="button"
                className={`sheet__severity-button${isEnd || picked ? ' active' : ''}${isInside ? ' inside' : ''}`}
                style={{ background: severityColor(n), color: severityTextColor(n) }}
                onClick={() => handleTap(n)}
              >
                {n}
              </button>
            )
          })}
        </div>
        <p className="sheet__severity-hint">
          強さを変えるときは数字を2つタップします。同じ数字を2回タップすると、その数値だけの記録になります。
        </p>

        <TimestampEditor
          title="日時（痛みがあった時刻に直せます）"
          value={record.timestamp}
          onChange={(timestamp) => onUpdate({ timestamp })}
        />

        <DetailForm record={record} onUpdate={onUpdate} />

        <button
          type="button"
          className="sheet__delete"
          onClick={() => {
            if (confirm('この記録を削除しますか？')) onDelete()
          }}
        >
          この記録を削除する
        </button>
      </div>
    </div>
  )
}
