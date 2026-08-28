import { useRef, useState } from 'react'
import { exportBackup, importBackup, setSetting } from '../db'
import { notificationsSupported, requestNotificationPermission } from '../utils/notifications'
import './SettingsScreen.css'

interface SettingsScreenProps {
  notificationsEnabled: boolean
  onNotificationsEnabledChange: (enabled: boolean) => void
  recordCount: number
  onDataChanged: () => void
}

export function SettingsScreen({
  notificationsEnabled,
  onNotificationsEnabledChange,
  recordCount,
  onDataChanged,
}: SettingsScreenProps) {
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleToggleNotifications() {
    if (notificationsEnabled) {
      await setSetting('notificationsEnabled', false)
      onNotificationsEnabledChange(false)
      return
    }
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      setMessage('通知を有効にするには、ブラウザの通知を許可してください。')
      return
    }
    await setSetting('notificationsEnabled', true)
    onNotificationsEnabledChange(true)
  }

  async function handleExportBackup() {
    const json = await exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `痛み日誌_バックアップ_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const count = await importBackup(text)
      setMessage(`${count}件の記録を読み込みました。`)
      onDataChanged()
    } catch {
      setMessage('読み込みに失敗しました。ファイルの形式をご確認ください。')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="settings-screen">
      <h1>設定</h1>

      <div className="settings-section">
        <h2>夜のふりかえり通知</h2>
        <div className="settings-row">
          <p>1日1回、夜に記録をふりかえる通知を送る</p>
          <button
            type="button"
            className={`toggle-switch${notificationsEnabled ? ' on' : ''}`}
            onClick={handleToggleNotifications}
            aria-pressed={notificationsEnabled}
            aria-label="通知の切り替え"
          />
        </div>
        <p className="settings-hint">
          痛みが出た瞬間の通知はしません。「記録してください」という催促ではなく、夜に一度だけ穏やかにお知らせします。
          {!notificationsSupported() && ' このブラウザは通知に対応していません。'}
          {' '}
          なお、ブラウザの仕様上、アプリを開いていない間の通知は届かない場合があります（詳しくはREADMEをご参照ください）。
        </p>
      </div>

      <div className="settings-section">
        <h2>データのバックアップ</h2>
        <p className="settings-hint" style={{ marginBottom: 12 }}>
          現在の記録数: {recordCount}件。すべてのデータは端末内にのみ保存されています。機種変更やブラウザデータの消去に備えて、定期的にバックアップをおすすめします。
        </p>
        <button type="button" className="settings-button" onClick={handleExportBackup}>
          全データをJSONで書き出す
        </button>
        <button type="button" className="settings-button" onClick={() => fileInputRef.current?.click()}>
          JSONから復元する
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        {message && <p className="settings-hint">{message}</p>}
        <p className="settings-hint">※ 復元すると、現在端末にある記録はすべて置き換えられます。</p>
      </div>

      <p className="settings-app-info">痛み日誌 — データはすべて端末内に保存され、外部には送信されません。</p>
    </div>
  )
}
