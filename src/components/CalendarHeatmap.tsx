import { getMonthMatrix, toDateKey } from '../utils/date'
import { severityColor, severityTextColor } from '../utils/severityColor'
import './CalendarHeatmap.css'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

interface CalendarHeatmapProps {
  year: number
  month: number
  maxSeverityByDate: Map<string, number>
  onPrevMonth?: () => void
  onNextMonth?: () => void
}

export function CalendarHeatmap({ year, month, maxSeverityByDate, onPrevMonth, onNextMonth }: CalendarHeatmapProps) {
  const weeks = getMonthMatrix(year, month)

  return (
    <div className="heatmap">
      <div className="heatmap__nav">
        {onPrevMonth && (
          <button type="button" onClick={onPrevMonth}>
            ← 前の月
          </button>
        )}
        <h3>
          {year}年{month + 1}月
        </h3>
        {onNextMonth && (
          <button type="button" onClick={onNextMonth}>
            次の月 →
          </button>
        )}
      </div>
      <div className="heatmap__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      {weeks.map((week, i) => (
        <div className="heatmap__week" key={i}>
          {week.map((date, j) => {
            if (!date) return <div className="heatmap__day" key={j} />
            const severity = maxSeverityByDate.get(toDateKey(date.getTime()))
            const hasData = severity !== undefined
            return (
              <div
                className={`heatmap__day${hasData ? ' has-data' : ''}`}
                key={j}
                style={
                  hasData
                    ? { background: severityColor(severity), color: severityTextColor(severity) }
                    : undefined
                }
              >
                {date.getDate()}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
