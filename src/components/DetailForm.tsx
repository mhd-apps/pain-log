import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CYCLE_LABELS,
  DURATION_LABELS,
  LOCATION_LABELS,
  type CyclePhase,
  type Duration,
  type Location,
  type PainRecord,
  type Quality,
  QUALITY_LABELS,
  RELIEF_LABELS,
  type Relief,
  type Trigger,
  TRIGGER_LABELS,
  type Urination,
  URINATION_LABELS,
} from '../types'
import type { RecordPatch } from '../db'
import { ChipGroupMulti, ChipGroupSingle } from './ChipGroup'
import './DetailForm.css'

interface DetailFormProps {
  record: PainRecord
  onUpdate: (patch: RecordPatch) => void
}

function toOptions<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

const durationOptions = toOptions<Duration>(DURATION_LABELS)
const qualityOptions = toOptions<Quality>(QUALITY_LABELS)
const locationOptions = toOptions<Location>(LOCATION_LABELS)
const triggerOptions = toOptions<Trigger>(TRIGGER_LABELS)
const urinationOptions = toOptions<Urination>(URINATION_LABELS)
const cycleOptions = toOptions<CyclePhase>(CYCLE_LABELS)
const reliefOptions = toOptions<Relief>(RELIEF_LABELS)

export function DetailForm({ record, onUpdate }: DetailFormProps) {
  const [memo, setMemo] = useState(record.memo ?? '')
  const savedMemoRef = useRef(record.memo ?? '')

  function toggleMulti<K extends 'qualities' | 'locations' | 'triggers'>(key: K, value: string) {
    onUpdate((current) => {
      const list = (current[key] as string[] | undefined) ?? []
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { [key]: next } as Partial<PainRecord>
    })
  }

  const onUpdateRef = useRef(onUpdate)
  const memoRef = useRef(memo)
  const locationOtherTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    onUpdateRef.current = onUpdate
    memoRef.current = memo
  })

  const commitMemo = useCallback(() => {
    const current = memoRef.current
    if (current === savedMemoRef.current) return
    savedMemoRef.current = current
    onUpdateRef.current({ memo: current.trim() ? current : undefined })
  }, [])

  // Save while typing, not only on blur: on a phone the app is often backgrounded
  // mid-sentence, and a blur event is not guaranteed to arrive before that.
  useEffect(() => {
    const timer = setTimeout(commitMemo, 600)
    return () => clearTimeout(timer)
  }, [memo, commitMemo])

  return (
    <div className="detail-form">
      <ChipGroupSingle
        title="持続時間"
        options={durationOptions}
        value={record.duration}
        onSelect={(v) => onUpdate({ duration: v })}
      />

      <ChipGroupMulti
        title="痛みの性質（複数選択可）"
        options={qualityOptions}
        selected={record.qualities ?? []}
        onToggle={(v) => toggleMulti('qualities', v)}
      />

      <ChipGroupMulti
        title="部位（複数選択可）"
        options={locationOptions}
        selected={record.locations ?? []}
        onToggle={(v) => toggleMulti('locations', v)}
      />

      {(record.locations ?? []).includes('other') && (
        <div className="field-block">
          <input
            className="text-input"
            placeholder="部位を入力"
            defaultValue={record.locationOther ?? ''}
            onChange={(e) => {
              const value = e.target.value
              clearTimeout(locationOtherTimer.current)
              locationOtherTimer.current = setTimeout(
                () => onUpdateRef.current({ locationOther: value.trim() || undefined }),
                600,
              )
            }}
            onBlur={(e) => {
              clearTimeout(locationOtherTimer.current)
              onUpdate({ locationOther: e.target.value.trim() || undefined })
            }}
          />
        </div>
      )}

      <ChipGroupMulti
        title="痛みの前後にあったこと（複数選択可）"
        options={triggerOptions}
        selected={record.triggers ?? []}
        onToggle={(v) => toggleMulti('triggers', v)}
      />

      <ChipGroupSingle
        title="排尿の様子"
        options={urinationOptions}
        value={record.urination}
        onSelect={(v) => onUpdate({ urination: v })}
      />

      <ChipGroupSingle
        title="月経周期"
        options={cycleOptions}
        value={record.cycle}
        onSelect={(v) => onUpdate({ cycle: v })}
      />

      <div className="field-block">
        <h3>頓服</h3>
        <div className="chip-group">
          <button
            type="button"
            className={`chip${record.medication?.taken === true ? ' selected' : ''}`}
            onClick={() =>
              onUpdate({
                medication:
                  record.medication?.taken === true ? undefined : { taken: true, relief: record.medication?.relief },
              })
            }
          >
            飲んだ
          </button>
          <button
            type="button"
            className={`chip${record.medication?.taken === false ? ' selected' : ''}`}
            onClick={() => onUpdate({ medication: record.medication?.taken === false ? undefined : { taken: false } })}
          >
            飲んでいない
          </button>
        </div>
      </div>

      {record.medication?.taken === true && (
        <ChipGroupSingle
          title="服薬後の変化"
          options={reliefOptions}
          value={record.medication.relief}
          onSelect={(v) => onUpdate({ medication: { taken: true, relief: v } })}
        />
      )}

      <div className="field-block">
        <h3>メモ</h3>
        <textarea
          className="text-input text-input--memo"
          value={memo}
          rows={3}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={commitMemo}
          placeholder="気になったことを自由に（改行できます）"
        />
      </div>
    </div>
  )
}
