import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { AppSettings, PainRecord } from './types'

interface PainDiaryDB extends DBSchema {
  records: {
    key: string
    value: PainRecord
    indexes: { timestamp: number }
  }
  settings: {
    key: string
    value: AppSettings[keyof AppSettings]
  }
}

const DB_NAME = 'pain-diary'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PainDiaryDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PainDiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('records', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}

function newId(): string {
  if ('randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function createQuickRecord(severity: PainRecord['severity']): Promise<PainRecord> {
  const record: PainRecord = {
    id: newId(),
    timestamp: Date.now(),
    severity,
  }
  const db = await getDb()
  await db.put('records', record)
  return record
}

export type RecordPatch = Partial<PainRecord> | ((current: PainRecord) => Partial<PainRecord>)

// Detail fields are updated one tap at a time (chip toggles, memo blur, etc.), often in
// quick succession before the UI has re-rendered with the previous tap's result. Serializing
// per record AND resolving each patch against the just-committed value (rather than a
// snapshot the caller took earlier) means a toggle can never overwrite an unrelated field,
// and two toggles on the same multi-select field never clobber each other.
const updateQueues = new Map<string, Promise<unknown>>()

export function updateRecord(id: string, patch: RecordPatch): Promise<void> {
  const previous = updateQueues.get(id) ?? Promise.resolve()
  const next = previous.then(
    () => applyUpdate(id, patch),
    () => applyUpdate(id, patch),
  )
  updateQueues.set(
    id,
    next.catch(() => undefined),
  )
  return next
}

async function applyUpdate(id: string, patch: RecordPatch): Promise<void> {
  const db = await getDb()
  const existing = await db.get('records', id)
  if (!existing) return
  const resolvedPatch = typeof patch === 'function' ? patch(existing) : patch
  await db.put('records', { ...existing, ...resolvedPatch, id: existing.id, timestamp: existing.timestamp })
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('records', id)
}

export async function getAllRecords(): Promise<PainRecord[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('records', 'timestamp')
  return all.reverse()
}

export async function getRecord(id: string): Promise<PainRecord | undefined> {
  const db = await getDb()
  return db.get('records', id)
}

export async function replaceAllRecords(records: PainRecord[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('records', 'readwrite')
  await tx.store.clear()
  for (const record of records) {
    await tx.store.put(record)
  }
  await tx.done
}

export async function getSetting<K extends keyof AppSettings>(
  key: K,
  fallback: AppSettings[K],
): Promise<AppSettings[K]> {
  const db = await getDb()
  const value = await db.get('settings', key)
  return value === undefined ? fallback : (value as AppSettings[K])
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const db = await getDb()
  await db.put('settings', value, key)
}

export async function exportBackup(): Promise<string> {
  const records = await getAllRecords()
  const notificationsEnabled = await getSetting('notificationsEnabled', false)
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    settings: { notificationsEnabled },
  }
  return JSON.stringify(payload, null, 2)
}

export async function importBackup(json: string): Promise<number> {
  const payload = JSON.parse(json) as {
    records?: PainRecord[]
    settings?: Partial<AppSettings>
  }
  if (!Array.isArray(payload.records)) {
    throw new Error('バックアップファイルの形式が正しくありません')
  }
  await replaceAllRecords(payload.records)
  if (payload.settings?.notificationsEnabled !== undefined) {
    await setSetting('notificationsEnabled', payload.settings.notificationsEnabled)
  }
  return payload.records.length
}
