import { Suspense, lazy, useEffect, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { getAllRecords, getSetting, setSetting } from './db'
import { ListScreen } from './screens/ListScreen'
import { RecordScreen } from './screens/RecordScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import type { PainRecord } from './types'
import { toDateKey } from './utils/date'
import { maybeShowEveningReminder } from './utils/notifications'

// Charting pulls in a large dependency. Keep it off the startup path so the
// record screen — the one that has to be usable in three seconds — loads first.
const ReviewScreen = lazy(() => import('./screens/ReviewScreen').then((m) => ({ default: m.ReviewScreen })))
const ExportScreen = lazy(() => import('./screens/ExportScreen').then((m) => ({ default: m.ExportScreen })))

function App() {
  const [tab, setTab] = useState<Tab>('record')
  const [records, setRecords] = useState<PainRecord[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  async function refresh() {
    setRecords(await getAllRecords())
  }

  useEffect(() => {
    refresh()
    getSetting('notificationsEnabled', false).then(setNotificationsEnabled)
  }, [])

  useEffect(() => {
    if (!notificationsEnabled) return
    const todayKey = toDateKey(Date.now())
    getSetting('lastReviewPromptDate', undefined).then((last) => {
      const shown = maybeShowEveningReminder(todayKey, last)
      if (shown) setSetting('lastReviewPromptDate', todayKey)
    })
  }, [notificationsEnabled])

  return (
    <div className="app-shell">
      {tab === 'record' && <RecordScreen onRecordCreated={refresh} />}
      {tab === 'list' && <ListScreen records={records} onChange={refresh} />}
      {(tab === 'review' || tab === 'export') && (
        <Suspense fallback={<p className="screen-loading">読み込んでいます…</p>}>
          {tab === 'review' ? <ReviewScreen records={records} /> : <ExportScreen records={records} />}
        </Suspense>
      )}
      {tab === 'settings' && (
        <SettingsScreen
          notificationsEnabled={notificationsEnabled}
          onNotificationsEnabledChange={setNotificationsEnabled}
          recordCount={records.length}
          onDataChanged={refresh}
        />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
