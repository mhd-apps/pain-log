import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarHeatmap } from '../components/CalendarHeatmap'
import type { PainRecord } from '../types'
import {
  cycleBreakdown,
  hourlyDistribution,
  last30DaysStats,
  maxSeverityByDate,
  triggerTally,
} from '../utils/reviewStats'
import './ReviewScreen.css'

interface ReviewScreenProps {
  records: PainRecord[]
}

export function ReviewScreen({ records }: ReviewScreenProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const monthRecords = useMemo(
    () =>
      records.filter((r) => {
        const d = new Date(r.timestamp)
        return d.getFullYear() === year && d.getMonth() === month
      }),
    [records, year, month],
  )

  const heatmapData = useMemo(() => maxSeverityByDate(monthRecords), [monthRecords])
  const hourly = useMemo(() => hourlyDistribution(records), [records])
  const cycles = useMemo(() => cycleBreakdown(records), [records])
  const triggers = useMemo(() => triggerTally(records), [records])
  const recent = useMemo(() => last30DaysStats(records), [records])
  const maxTriggerCount = triggers[0]?.count ?? 1

  function goPrevMonth() {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function goNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <div className="review-screen">
      <h1>ふりかえり</h1>

      <section className="review-section">
        <h2>直近30日</h2>
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="stat-tile__value">{recent.count}</div>
            <div className="stat-tile__label">記録件数</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{recent.avgSeverity.toFixed(1)}</div>
            <div className="stat-tile__label">平均強度</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{recent.maxSeverity}</div>
            <div className="stat-tile__label">最大強度</div>
          </div>
        </div>
        <p className="review-note">
          ※ 「5〜7」のように幅で記録したものは、最大強度には上限（7）を、平均強度には真ん中の値（6）を使っています。
        </p>
      </section>

      <section className="review-section">
        <h2>月ごとのカレンダー（日ごとの最大強度）</h2>
        <CalendarHeatmap
          year={year}
          month={month}
          maxSeverityByDate={heatmapData}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
        />
      </section>

      <section className="review-section">
        <h2>時刻別の分布（全期間）</h2>
        {records.length === 0 ? (
          <p className="review-section__empty">記録がまだありません</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} tickFormatter={(h) => `${h}時`} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v}件`, '記録数']} labelFormatter={(h) => `${h}時台`} />
              <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="review-section">
        <h2>月経周期との重なり</h2>
        {cycles.length === 0 ? (
          <p className="review-section__empty">月経周期の記録がまだありません</p>
        ) : (
          <table className="cycle-table">
            <thead>
              <tr>
                <th>時期</th>
                <th>件数</th>
                <th>平均強度</th>
                <th>最大強度</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c) => (
                <tr key={c.phase}>
                  <td>{c.label}</td>
                  <td>{c.count}</td>
                  <td>{c.avgSeverity.toFixed(1)}</td>
                  <td>{c.maxSeverity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="review-section">
        <h2>痛みの前後にあったこと（同時に記録された回数）</h2>
        {triggers.length === 0 ? (
          <p className="review-section__empty">まだ記録がありません</p>
        ) : (
          <>
            {triggers.map((t) => (
              <div className="trigger-tally-row" key={t.trigger}>
                <span className="trigger-tally-row__label">{t.label}</span>
                <span className="trigger-tally-row__bar-wrap">
                  <span
                    className="trigger-tally-row__bar"
                    style={{ width: `${(t.count / maxTriggerCount) * 100}%` }}
                  />
                </span>
                <span className="trigger-tally-row__count">{t.count}</span>
              </div>
            ))}
            <p className="review-note">
              ※ これは「同時に記録された回数」であり、原因を示すものではありません。判断は診察時に医師にご相談ください。
            </p>
          </>
        )}
      </section>
    </div>
  )
}
