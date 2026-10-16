import { useState } from 'react'
import {
  DURATION_LABELS,
  QUALITY_LABELS,
  TRIGGER_LABELS,
  formatSeverity,
  type PainRecord,
  severityMid,
  severityPeak,
} from '../types'
import { formatDateJp, formatTime } from '../utils/date'
import { hourlyDistribution, maxSeverityByDate } from '../utils/reviewStats'
import { CalendarHeatmap } from './CalendarHeatmap'
import './PrintReport.css'

interface PrintReportProps {
  records: PainRecord[]
  startLabel: string
  endLabel: string
}

function monthsInRange(records: PainRecord[]): { year: number; month: number }[] {
  const seen = new Set<string>()
  const result: { year: number; month: number }[] = []
  for (const r of records) {
    const d = new Date(r.timestamp)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ year: d.getFullYear(), month: d.getMonth() })
    }
  }
  return result.sort((a, b) => (a.year - b.year) || (a.month - b.month))
}

export function PrintReport({ records, startLabel, endLabel }: PrintReportProps) {
  const [createdAt] = useState(() => Date.now())
  const count = records.length
  const avg = count ? records.reduce((s, r) => s + severityMid(r), 0) / count : 0
  const max = count ? Math.max(...records.map(severityPeak)) : 0
  const hourly = hourlyDistribution(records)
  const peakHour = hourly.reduce((best, cur) => (cur.count > best.count ? cur : best), hourly[0])
  const months = monthsInRange(records)
  const severe = records
    .filter((r) => severityPeak(r) >= 7)
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="print-report">
      <h1>痛みの記録 サマリー</h1>
        <p className="print-report__meta">
          対象期間: {startLabel} 〜 {endLabel}（作成日: {formatDateJp(createdAt)}）
        </p>

        <div className="print-report__summary">
          <div>
            <span className="value">{count}</span>
            記録件数
          </div>
          <div>
            <span className="value">{avg.toFixed(1)}</span>
            平均強度
          </div>
          <div>
            <span className="value">{max}</span>
            最大強度
          </div>
          <div>
            <span className="value">{count && peakHour ? `${peakHour.hour}時台` : '-'}</span>
            出やすい時間帯
          </div>
        </div>

        <p className="print-report__section-title">カレンダー（日ごとの最大強度）</p>
        <div className="print-heatmaps">
          {months.length === 0 && <p>データがありません</p>}
          {months.map(({ year, month }) => (
            <div className="print-heatmap" key={`${year}-${month}`}>
              <CalendarHeatmap year={year} month={month} maxSeverityByDate={maxSeverityByDate(records)} />
            </div>
          ))}
        </div>

        <p className="print-report__section-title">強い痛み（強さ7以上）の記録</p>
        {severe.length === 0 ? (
          <p>該当する記録はありません</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>時刻</th>
                <th>強さ</th>
                <th>持続時間</th>
                <th>性質</th>
                <th>前後の状況</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {severe.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateJp(r.timestamp)}</td>
                  <td>{formatTime(r.timestamp)}</td>
                  <td>{formatSeverity(r)}</td>
                  <td>{r.duration ? DURATION_LABELS[r.duration] : ''}</td>
                  <td>{(r.qualities ?? []).map((q) => QUALITY_LABELS[q]).join('・')}</td>
                  <td>{(r.triggers ?? []).map((t) => TRIGGER_LABELS[t]).join('・')}</td>
                  <td className="memo">{r.memo ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  )
}
