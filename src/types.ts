export type Severity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type Duration =
  | 'ongoing'
  | 'under5min'
  | 'under30min'
  | 'under1hour'
  | 'hours'
  | 'halfDayPlus'

export type Quality = 'dull' | 'throbbing' | 'stabbing' | 'squeezing' | 'burning'

export type Location = 'leftFlank' | 'leftBack' | 'leftLowerAbdomen' | 'other'

export type Trigger =
  | 'drankLots'
  | 'heldUrine'
  | 'afterUrination'
  | 'twistedOrBent'
  | 'sameposture'
  | 'exercised'
  | 'afterMeal'

export type Urination = 'normal' | 'frequent' | 'difficult' | 'residual' | 'darkColor'

export type CyclePhase = 'during' | 'before' | 'notApplicable'

export type Relief = 'noChange' | 'somewhatBetter' | 'muchBetter'

export interface Medication {
  taken: boolean
  relief?: Relief
}

export interface PainRecord {
  id: string
  timestamp: number
  /** Lower bound of the pain. For a single-value record this is the whole answer. */
  severity: Severity
  /** Upper bound, set only when the pain was recorded as a range such as 5〜7. */
  severityMax?: Severity
  duration?: Duration
  qualities?: Quality[]
  locations?: Location[]
  locationOther?: string
  triggers?: Trigger[]
  urination?: Urination
  cycle?: CyclePhase
  medication?: Medication
  memo?: string
}

export interface AppSettings {
  notificationsEnabled: boolean
  lastReviewPromptDate?: string
}

export const DURATION_LABELS: Record<Duration, string> = {
  ongoing: 'まだ続いている',
  under5min: '〜5分',
  under30min: '〜30分',
  under1hour: '〜1時間',
  hours: '数時間',
  halfDayPlus: '半日以上',
}

export const QUALITY_LABELS: Record<Quality, string> = {
  dull: 'ズーン（鈍い）',
  throbbing: 'ズキズキ',
  stabbing: '刺すような',
  squeezing: '締めつけられる',
  burning: '焼けるような',
}

export const LOCATION_LABELS: Record<Location, string> = {
  leftFlank: '左脇腹',
  leftBack: '左背中',
  leftLowerAbdomen: '左下腹部',
  other: 'その他',
}

export const TRIGGER_LABELS: Record<Trigger, string> = {
  drankLots: '水分をたくさん摂った',
  heldUrine: '長時間トイレを我慢した',
  afterUrination: '排尿の直後',
  twistedOrBent: '体をひねった・前かがみになった',
  sameposture: '長時間同じ姿勢でいた',
  exercised: '運動した',
  afterMeal: '食事の後',
}

export const URINATION_LABELS: Record<Urination, string> = {
  normal: 'いつもどおり',
  frequent: '回数が多い',
  difficult: '出にくい',
  residual: '残尿感',
  darkColor: '尿の色が濃い',
}

export const CYCLE_LABELS: Record<CyclePhase, string> = {
  during: '月経中',
  before: '月経前',
  notApplicable: '該当しない期間',
}

export const RELIEF_LABELS: Record<Relief, string> = {
  noChange: '変化なし',
  somewhatBetter: '少し楽',
  muchBetter: 'かなり楽',
}

export interface SeverityBounds {
  min: Severity
  max: Severity
  isRange: boolean
}

/** Records made before ranges existed, and single-value records, collapse to min === max. */
export function severityBounds(record: Pick<PainRecord, 'severity' | 'severityMax'>): SeverityBounds {
  const a = record.severity
  const b = record.severityMax ?? record.severity
  const min = (a <= b ? a : b) as Severity
  const max = (a <= b ? b : a) as Severity
  return { min, max, isRange: min !== max }
}

export function formatSeverity(record: Pick<PainRecord, 'severity' | 'severityMax'>): string {
  const { min, max, isRange } = severityBounds(record)
  return isRange ? `${min}〜${max}` : String(min)
}

/** The worst the pain got — what "最大強度" and the 7-and-above list are about. */
export function severityPeak(record: Pick<PainRecord, 'severity' | 'severityMax'>): Severity {
  return severityBounds(record).max
}

/** Midpoint of a range — used for averages, so 5〜7 counts as 6 rather than 5 or 7. */
export function severityMid(record: Pick<PainRecord, 'severity' | 'severityMax'>): number {
  const { min, max } = severityBounds(record)
  return (min + max) / 2
}

/**
 * Severity is always chosen with two taps. Two different numbers make a range;
 * the same number twice records that single value.
 */
export function rangeFromTaps(first: Severity, second: Severity): { severity: Severity; severityMax?: Severity } {
  if (first === second) return { severity: first, severityMax: undefined }
  return {
    severity: Math.min(first, second) as Severity,
    severityMax: Math.max(first, second) as Severity,
  }
}

export function hasDetail(record: PainRecord): boolean {
  return Boolean(
    record.duration ||
      (record.qualities && record.qualities.length > 0) ||
      (record.locations && record.locations.length > 0) ||
      record.locationOther ||
      (record.triggers && record.triggers.length > 0) ||
      record.urination ||
      record.cycle ||
      record.medication ||
      record.memo,
  )
}
