import './BottomNav.css'

export type Tab = 'record' | 'list' | 'review' | 'export' | 'settings'

const TABS: { key: Tab; label: string }[] = [
  { key: 'record', label: '記録' },
  { key: 'list', label: '一覧' },
  { key: 'review', label: 'ふりかえり' },
  { key: 'export', label: '出力' },
  { key: 'settings', label: '設定' },
]

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`bottom-nav__item${active === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="bottom-nav__dot" />
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
