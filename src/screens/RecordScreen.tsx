import { useEffect, useState } from 'react'
import { BackdatedRecordSheet } from '../components/BackdatedRecordSheet'
import { DetailForm } from '../components/DetailForm'
import { type RecordPatch, createQuickRecord, createRecordAt, updateRecord } from '../db'
import { type PainRecord, type Severity, formatSeverity, rangeFromTaps, severityBounds } from '../types'
import { formatDateJp, formatTime } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import './RecordScreen.css'

const SEVERITIES: Severity[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface RecordScreenProps {
  onRecordCreated: (record: PainRecord) => void
}

interface Draft {
  record: PainRecord
  first: Severity
}

export function RecordScreen({ onRecordCreated }: RecordScreenProps) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [completed, setCompleted] = useState<PainRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showBackdated, setShowBackdated] = useState(false)

  // If the app is put away mid-entry, the next tap should start a fresh record
  // rather than silently widening the earlier one. The first tap is already
  // saved, so nothing is lost by dropping the half-finished selection.
  useEffect(() => {
    function handleHidden() {
      if (document.hidden) setDraft(null)
    }
    document.addEventListener('visibilitychange', handleHidden)
    return () => document.removeEventListener('visibilitychange', handleHidden)
  }, [])

  async function handleTap(severity: Severity) {
    if (saving) return
    setSaving(true)
    try {
      if (draft) {
        const patch = rangeFromTaps(draft.first, severity)
        const updated = { ...draft.record, ...patch }
        setDraft(null)
        setCompleted(updated)
        await updateRecord(draft.record.id, patch)
        onRecordCreated(updated)
        return
      }
      // Saved on the first tap too, so an interrupted entry still leaves a record.
      const record = await createQuickRecord(severity)
      setDraft({ record, first: severity })
      setCompleted(null)
      setShowDetail(false)
      onRecordCreated(record)
    } finally {
      setSaving(false)
    }
  }

  async function handleBackdatedSave(severity: Severity, severityMax: Severity | undefined, timestamp: number) {
    const record = await createRecordAt(severity, timestamp)
    let saved = record
    if (severityMax !== undefined && severityMax !== severity) {
      const patch = { severityMax }
      saved = { ...record, ...patch }
      await updateRecord(record.id, patch)
    }
    setDraft(null)
    setCompleted(saved)
    setShowDetail(false)
    onRecordCreated(saved)
    return saved
  }

  async function handleDetailUpdate(patch: RecordPatch) {
    if (!completed) return
    setCompleted((prev) => (prev ? { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) } : prev))
    await updateRecord(completed.id, patch)
    onRecordCreated(completed)
  }

  function markClass(n: Severity): string {
    if (draft) return n === draft.first ? ' is-picked' : ''
    if (completed) {
      const { min, max } = severityBounds(completed)
      if (n === min || n === max) return ' is-end'
      if (n > min && n < max) return ' is-inside'
    }
    return ''
  }

  return (
    <div className="record-screen">
      <div className="record-screen__heading">
        <h1>今の痛みの強さは？</h1>
        <p>数字を2つタップすると記録します</p>
      </div>

      <div className="severity-grid">
        {SEVERITIES.map((n) => (
          <button
            key={n}
            type="button"
            className={`severity-button${markClass(n)}`}
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

      {draft ? (
        <div className="pending-card">
          <p className="pending-card__main">
            <strong>{draft.first}</strong> を選びました。あと1つタップしてください
          </p>
          <p className="pending-card__sub">
            強さが変わらないときは、同じ <strong>{draft.first}</strong> をもう一度タップします
          </p>
        </div>
      ) : (
        <p className="record-hint">
          いちばん弱いときと強いときを1つずつ。変わらないときは同じ数字を2回タップします
        </p>
      )}

      <button type="button" className="backdated-entry-button" onClick={() => setShowBackdated(true)}>
        さっきの痛みをあとから記録する
      </button>

      {completed && (
        <>
          <div className="confirmation-card">
            <span className="confirmation-card__main">
              <span className="confirmation-card__text">記録しました</span>
              <span className="confirmation-card__time">
                {formatDateJp(completed.timestamp)} {formatTime(completed.timestamp)}
              </span>
            </span>
            <span className="confirmation-card__severity">強さ {formatSeverity(completed)}</span>
          </div>

          {!showDetail && (
            <button type="button" className="detail-toggle-button" onClick={() => setShowDetail(true)}>
              詳細を追加する（任意）
            </button>
          )}

          {showDetail && (
            <div className="detail-panel">
              <DetailForm record={completed} onUpdate={handleDetailUpdate} />
              <button type="button" className="detail-panel__done" onClick={() => setShowDetail(false)}>
                閉じる
              </button>
            </div>
          )}
        </>
      )}

      {showBackdated && (
        <BackdatedRecordSheet onSave={handleBackdatedSave} onClose={() => setShowBackdated(false)} />
      )}
    </div>
  )
}
