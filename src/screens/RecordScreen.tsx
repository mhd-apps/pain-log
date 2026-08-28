import { useState } from 'react'
import { DetailForm } from '../components/DetailForm'
import { type RecordPatch, createQuickRecord, updateRecord } from '../db'
import type { PainRecord, Severity } from '../types'
import { formatDateJp, formatTime } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import './RecordScreen.css'

const SEVERITIES: Severity[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface RecordScreenProps {
  onRecordCreated: (record: PainRecord) => void
}

export function RecordScreen({ onRecordCreated }: RecordScreenProps) {
  const [lastRecord, setLastRecord] = useState<PainRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleTap(severity: Severity) {
    if (saving) return
    setSaving(true)
    try {
      const record = await createQuickRecord(severity)
      setLastRecord(record)
      setShowDetail(false)
      onRecordCreated(record)
    } finally {
      setSaving(false)
    }
  }

  async function handleDetailUpdate(patch: RecordPatch) {
    if (!lastRecord) return
    setLastRecord((prev) => (prev ? { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) } : prev))
    await updateRecord(lastRecord.id, patch)
    onRecordCreated(lastRecord)
  }

  return (
    <div className="record-screen">
      <div className="record-screen__heading">
        <h1>今の痛みの強さは？</h1>
        <p>タップするだけで記録されます</p>
      </div>

      <div className="severity-grid">
        {SEVERITIES.map((n) => (
          <button
            key={n}
            type="button"
            className="severity-button"
            style={{ background: severityColor(n), color: severityTextColor(n) }}
            onClick={() => handleTap(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="severity-scale-labels">
        <span>0 = 痛みなし</span>
        <span>10 = 最悪の痛み</span>
      </div>

      {lastRecord && (
        <>
          <div className="confirmation-card">
            <span className="confirmation-card__main">
              <span className="confirmation-card__text">記録しました</span>
              <span className="confirmation-card__time">
                {formatDateJp(lastRecord.timestamp)} {formatTime(lastRecord.timestamp)}
              </span>
            </span>
            <span className="confirmation-card__severity">強さ {lastRecord.severity}</span>
          </div>

          {!showDetail && (
            <button type="button" className="detail-toggle-button" onClick={() => setShowDetail(true)}>
              詳細を追加する（任意）
            </button>
          )}

          {showDetail && (
            <div className="detail-panel">
              <DetailForm record={lastRecord} onUpdate={handleDetailUpdate} />
              <button type="button" className="detail-panel__done" onClick={() => setShowDetail(false)}>
                閉じる
              </button>
            </div>
          )}

          <p className="record-again-hint">もう一度記録するには、上の数字をタップしてください</p>
        </>
      )}
    </div>
  )
}
