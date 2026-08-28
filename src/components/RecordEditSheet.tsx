import type { RecordPatch } from '../db'
import type { PainRecord, Severity } from '../types'
import { formatDateTimeJp } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import { DetailForm } from './DetailForm'
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

        <div className="sheet__severity-row">
          {SEVERITIES.map((n) => (
            <button
              key={n}
              type="button"
              className={`sheet__severity-button${record.severity === n ? ' active' : ''}`}
              style={{ background: severityColor(n), color: severityTextColor(n) }}
              onClick={() => onUpdate({ severity: n })}
            >
              {n}
            </button>
          ))}
        </div>

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
