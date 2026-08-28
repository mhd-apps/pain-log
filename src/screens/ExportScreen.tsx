import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { PrintReport } from '../components/PrintReport'
import type { PainRecord } from '../types'
import { downloadCsv } from '../utils/csv'
import { endOfDay, formatDateJp, startOfDay, toDateKey } from '../utils/date'
import './ExportScreen.css'

interface ExportScreenProps {
  records: PainRecord[]
}

function isoDate(timestamp: number): string {
  return toDateKey(timestamp)
}

export function ExportScreen({ records }: ExportScreenProps) {
  const today = new Date()
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)

  const [startDate, setStartDate] = useState(isoDate(monthAgo.getTime()))
  const [endDate, setEndDate] = useState(isoDate(today.getTime()))

  const filtered = useMemo(() => {
    const start = startOfDay(new Date(startDate).getTime())
    const end = endOfDay(new Date(endDate).getTime())
    return records.filter((r) => r.timestamp >= start && r.timestamp <= end)
  }, [records, startDate, endDate])

  function setPreset(days: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(isoDate(start.getTime()))
    setEndDate(isoDate(end.getTime()))
  }

  function handleCsv() {
    downloadCsv(filtered, `痛み記録_${startDate}_${endDate}.csv`)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="export-screen">
      <h1>受診用に出力</h1>

      <div className="export-section">
        <h2>期間を選ぶ</h2>
        <div className="export-preset-row">
          <button type="button" onClick={() => setPreset(7)}>
            直近7日
          </button>
          <button type="button" onClick={() => setPreset(30)}>
            直近30日
          </button>
          <button type="button" onClick={() => setPreset(90)}>
            直近90日
          </button>
        </div>
        <div className="date-range-row">
          <input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
          <span>〜</span>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <p className="export-count">この期間の記録: {filtered.length}件</p>
      </div>

      <div className="export-section">
        <h2>PDF・印刷</h2>
        <button type="button" className="export-action-button" onClick={handlePrint}>
          PDFを作成 / 印刷する
        </button>
        <p className="export-hint">
          印刷ダイアログが開きます。「PDFに保存」を選ぶとA4サイズのPDFとして保存できます。サマリー・カレンダー・強い痛み（強さ7以上）の記録がまとまります。
        </p>
      </div>

      <div className="export-section">
        <h2>CSV出力</h2>
        <button type="button" className="export-action-button secondary" onClick={handleCsv}>
          CSVをダウンロード
        </button>
        <p className="export-hint">全項目を含むデータをファイルに保存します。手元にデータを残したいときにご利用ください。</p>
      </div>

      {createPortal(
        <PrintReport
          records={filtered}
          startLabel={formatDateJp(new Date(startDate).getTime())}
          endLabel={formatDateJp(new Date(endDate).getTime())}
        />,
        document.getElementById('print-root')!,
      )}
    </div>
  )
}
