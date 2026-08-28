import './ChipGroup.css'

interface Option<T extends string> {
  value: T
  label: string
}

interface ChipGroupProps<T extends string> {
  title: string
  options: Option<T>[]
  selected: T[]
  onToggle: (value: T) => void
}

export function ChipGroupMulti<T extends string>({ title, options, selected, onToggle }: ChipGroupProps<T>) {
  return (
    <div className="field-block">
      <h3>{title}</h3>
      <div className="chip-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`chip${selected.includes(opt.value) ? ' selected' : ''}`}
            onClick={() => onToggle(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface ChipGroupSingleProps<T extends string> {
  title: string
  options: Option<T>[]
  value: T | undefined
  onSelect: (value: T | undefined) => void
}

export function ChipGroupSingle<T extends string>({ title, options, value, onSelect }: ChipGroupSingleProps<T>) {
  return (
    <div className="field-block">
      <h3>{title}</h3>
      <div className="chip-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`chip${value === opt.value ? ' selected' : ''}`}
            onClick={() => onSelect(value === opt.value ? undefined : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
