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
  severity: Severity
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
