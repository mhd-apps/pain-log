import {
  CYCLE_LABELS,
  type CyclePhase,
  type PainRecord,
  TRIGGER_LABELS,
  type Trigger,
  severityMid,
  severityPeak,
} from '../types'
import { daysAgo, toDateKey } from './date'

export function maxSeverityByDate(records: PainRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of records) {
    const key = toDateKey(r.timestamp)
    const peak = severityPeak(r)
    const current = map.get(key)
    if (current === undefined || peak > current) map.set(key, peak)
  }
  return map
}

export function hourlyDistribution(records: PainRecord[]): { hour: number; count: number }[] {
  const counts = new Array(24).fill(0)
  for (const r of records) {
    const hour = new Date(r.timestamp).getHours()
    counts[hour] += 1
  }
  return counts.map((count, hour) => ({ hour, count }))
}

export interface CycleStat {
  phase: CyclePhase
  label: string
  count: number
  avgSeverity: number
  maxSeverity: number
}

export function cycleBreakdown(records: PainRecord[]): CycleStat[] {
  const phases: CyclePhase[] = ['during', 'before', 'notApplicable']
  return phases
    .map((phase) => {
      const matching = records.filter((r) => r.cycle === phase)
      if (matching.length === 0) return null
      const avg = matching.reduce((sum, r) => sum + severityMid(r), 0) / matching.length
      const max = Math.max(...matching.map(severityPeak))
      return { phase, label: CYCLE_LABELS[phase], count: matching.length, avgSeverity: avg, maxSeverity: max }
    })
    .filter((v): v is CycleStat => v !== null)
}

export interface TriggerTally {
  trigger: Trigger
  label: string
  count: number
}

export function triggerTally(records: PainRecord[]): TriggerTally[] {
  const counts = new Map<Trigger, number>()
  for (const r of records) {
    for (const t of r.triggers ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([trigger, count]) => ({ trigger, label: TRIGGER_LABELS[trigger], count }))
    .sort((a, b) => b.count - a.count)
}

export interface RecentStats {
  count: number
  avgSeverity: number
  maxSeverity: number
}

export function last30DaysStats(records: PainRecord[]): RecentStats {
  const cutoff = daysAgo(30)
  const recent = records.filter((r) => r.timestamp >= cutoff)
  if (recent.length === 0) return { count: 0, avgSeverity: 0, maxSeverity: 0 }
  const avg = recent.reduce((sum, r) => sum + severityMid(r), 0) / recent.length
  const max = Math.max(...recent.map(severityPeak))
  return { count: recent.length, avgSeverity: avg, maxSeverity: max }
}
