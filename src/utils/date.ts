export function toDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDateJp(timestamp: number): string {
  const d = new Date(timestamp)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekday}）`
}

export function formatDateTimeJp(timestamp: number): string {
  return `${formatDateJp(timestamp)} ${formatTime(timestamp)}`
}

// <input type="date"> / <input type="time"> round-trip helpers.
export function toDateInputValue(timestamp: number): string {
  return toDateKey(timestamp)
}

export function toTimeInputValue(timestamp: number): string {
  return formatTime(timestamp)
}

export function combineDateTime(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  if ([y, m, d, hh, mm].some(Number.isNaN)) return Number.NaN
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime()
}

export function daysAgo(days: number): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.getTime()
}

export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(timestamp: number): number {
  const d = new Date(timestamp)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function getMonthMatrix(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
