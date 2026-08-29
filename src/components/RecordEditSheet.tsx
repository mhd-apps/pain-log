import type { RecordPatch } from '../db'
import { type PainRecord, type Severity, applySeverityTap, formatSeverity, severityBounds } from '../types'
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
          強さ {formatSeverity(record)}
        </div>
        <div className="sheet__severity-row">
          {SEVERITIES.map((n) => {
            const { min, max } = severityBounds(record)
            const isEnd = n === min || n === max
            const isInside = n > min && n < max
            return (
              <button
                key={n}
                type="button"
                className={`sheet__severity-button${isEnd ? ' active' : ''}${isInside ? ' inside' : ''}`}
                style={{ background: severityColor(n), color: severityTextColor(n) }}
                onClick={() => onUpdate((current) => applySeverityTap(current, n))}
              >
                {n}
              </button>
            )
          })}
        </div>
        <p className="sheet__severity-hint">
          2つの数字をタップすると「5〜7」のように幅で記録できます。端の数字をもう一度タップすると幅が外れます。
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
