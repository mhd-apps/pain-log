import { useMemo, useState } from 'react'
import { RecordEditSheet } from '../components/RecordEditSheet'
import { type RecordPatch, deleteRecord, updateRecord } from '../db'
import { DURATION_LABELS, QUALITY_LABELS, hasDetail, type PainRecord } from '../types'
import { formatDateJp, formatTime, toDateKey } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import './ListScreen.css'

interface ListScreenProps {
  records: PainRecord[]
  onChange: () => void
}

function summarize(record: PainRecord): string {
  const parts: string[] = []
  if (record.duration) parts.push(DURATION_LABELS[record.duration])
  if (record.qualities?.length) parts.push(record.qualities.map((q) => QUALITY_LABELS[q]).join('・'))
  if (record.memo) parts.push(record.memo)
  return parts.join(' / ')
}

export function ListScreen({ records, onChange }: ListScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, PainRecord[]>()
    for (const r of records) {
      const key = toDateKey(r.timestamp)
      const list = map.get(key) ?? []
      list.push(r)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [records])

  const editingRecord = records.find((r) => r.id === editingId) ?? null

  async function handleUpdate(patch: RecordPatch) {
    if (!editingId) return
    await updateRecord(editingId, patch)
    onChange()
  }

  async function handleDelete() {
    if (!editingId) return
    await deleteRecord(editingId)
    setEditingId(null)
    onChange()
  }

  return (
    <div className="list-screen">
      <h1>記録一覧</h1>

      {records.length === 0 && (
        <p className="list-screen__empty">
          まだ記録がありません。
          <br />
          「記録」タブから痛みの強さをタップすると、ここに表示されます。
        </p>
      )}

      {groups.map(([dateKey, dayRecords]) => (
        <div className="date-group" key={dateKey}>
          <p className="date-group__heading">{formatDateJp(dayRecords[0].timestamp)}</p>
          {dayRecords.map((record) => (
            <button
              type="button"
              className="record-row"
              key={record.id}
              onClick={() => setEditingId(record.id)}
            >
              <span className="record-row__time">{formatTime(record.timestamp)}</span>
              <span
                className="record-row__severity"
                style={{ background: severityColor(record.severity), color: severityTextColor(record.severity) }}
              >
                {record.severity}
              </span>
              <span className="record-row__summary">{summarize(record)}</span>
              {!hasDetail(record) && <span className="record-row__unfilled-mark" title="詳細未記入" />}
            </button>
          ))}
        </div>
      ))}

      {editingRecord && (
        <RecordEditSheet
          record={editingRecord}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
