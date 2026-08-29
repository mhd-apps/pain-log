import { useState } from 'react'
import { BackdatedRecordSheet } from '../components/BackdatedRecordSheet'
import { DetailForm } from '../components/DetailForm'
import { type RecordPatch, createQuickRecord, createRecordAt, updateRecord } from '../db'
import { type PainRecord, type Severity, applySeverityTap, formatSeverity, severityBounds } from '../types'
import { formatDateJp, formatTime } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import './RecordScreen.css'

const SEVERITIES: Severity[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// A second tap turns the record into a range (5〜7). Past this window a tap is
// treated as a new episode instead, so two separate pains never merge silently.
const RANGE_WINDOW_MS = 5 * 60 * 1000

interface RecordScreenProps {
  onRecordCreated: (record: PainRecord) => void
}

export function RecordScreen({ onRecordCreated }: RecordScreenProps) {
  const [lastRecord, setLastRecord] = useState<PainRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showBackdated, setShowBackdated] = useState(false)
  const [savedAt, setSavedAt] = useState(0)

  const canWiden = lastRecord !== null && Date.now() - savedAt < RANGE_WINDOW_MS

  async function handleTap(severity: Severity) {
    if (saving) return
    setSaving(true)
    try {
      if (lastRecord && canWiden) {
        const patch = applySeverityTap(lastRecord, severity)
        const updated = { ...lastRecord, ...patch }
        setLastRecord(updated)
        await updateRecord(lastRecord.id, patch)
        onRecordCreated(updated)
        return
      }
      const record = await createQuickRecord(severity)
      setLastRecord(record)
      setSavedAt(Date.now())
      setShowDetail(false)
      onRecordCreated(record)
    } finally {
      setSaving(false)
    }
  }

  function startNewRecord() {
    setLastRecord(null)
    setShowDetail(false)
    setSavedAt(0)
  }

  async function handleBackdatedSave(severity: Severity, timestamp: number) {
    const record = await createRecordAt(severity, timestamp)
    setLastRecord(record)
    setSavedAt(Date.now())
    setShowDetail(false)
    onRecordCreated(record)
    return record
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
        {SEVERITIES.map((n) => {
          const bounds = canWiden && lastRecord ? severityBounds(lastRecord) : null
          const isEnd = bounds !== null && (n === bounds.min || n === bounds.max)
          const isInside = bounds !== null && n > bounds.min && n < bounds.max
          return (
            <button
              key={n}
              type="button"
              className={`severity-button${isEnd ? ' is-end' : ''}${isInside ? ' is-inside' : ''}`}
              style={{ background: severityColor(n), color: severityTextColor(n) }}
              onClick={() => handleTap(n)}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="severity-scale-labels">
        <span>0 = 痛みなし</span>
        <span>10 = 最悪の痛み</span>
      </div>

      <button type="button" className="backdated-entry-button" onClick={() => setShowBackdated(true)}>
        さっきの痛みをあとから記録する
      </button>

      {lastRecord && (
        <>
          <div className="confirmation-card">
            <span className="confirmation-card__main">
              <span className="confirmation-card__text">記録しました</span>
              <span className="confirmation-card__time">
                {formatDateJp(lastRecord.timestamp)} {formatTime(lastRecord.timestamp)}
              </span>
            </span>
            <span className="confirmation-card__severity">強さ {formatSeverity(lastRecord)}</span>
          </div>

          {canWiden && (
            <p className="range-hint">
              {severityBounds(lastRecord).isRange
                ? 'もう一度いずれかの数字をタップすると、幅を変えたり取り消したりできます'
                : '痛みに幅があるときは、続けてもう一つの数字をタップしてください（例：5〜7）'}
            </p>
          )}

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

          {canWiden ? (
            <button type="button" className="new-record-button" onClick={startNewRecord}>
              別の痛みを記録する
            </button>
          ) : (
            <p className="record-again-hint">もう一度記録するには、上の数字をタップしてください</p>
          )}
        </>
      )}

      {showBackdated && (
        <BackdatedRecordSheet onSave={handleBackdatedSave} onClose={() => setShowBackdated(false)} />
      )}
    </div>
  )
}
