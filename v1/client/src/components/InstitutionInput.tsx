import { useId, useMemo, useState, type Ref } from 'react'
import { filterInstitutions, useInstitutions } from '../api/institutions'
import type { Institution } from '../api/types'

type Props = {
  value: string
  onChange: (text: string) => void
  /** Fired when a suggestion is chosen (use it to prefill location from campus). */
  onPick?: (inst: Institution) => void
  placeholder?: string
  className?: string
  dataField?: string
  inputRef?: Ref<HTMLInputElement>
  required?: boolean
}

export default function InstitutionInput({ value, onChange, onPick, placeholder, className = 'field-input', dataField, inputRef, required }: Props) {
  const all = useInstitutions()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const matches = useMemo(() => filterInstitutions(all, value), [all, value])
  const exact = matches.length === 1 && matches[0].name.toLowerCase() === value.trim().toLowerCase()
  const show = open && matches.length > 0 && !exact

  const pick = (inst: Institution) => {
    onChange(inst.name)
    onPick?.(inst)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        data-field={dataField}
        className={className}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        required={required}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!show) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length) }
          else if (e.key === 'Enter') { e.preventDefault(); pick(matches[active]) }
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md bg-surface-container-lowest shadow-card border border-outline-variant/40"
        >
          {matches.map((m, i) => (
            <li
              key={m.name}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so it fires before the input's blur closes the list
              onMouseDown={(e) => { e.preventDefault(); pick(m) }}
              onMouseEnter={() => setActive(i)}
              className={`px-4 py-2.5 text-sm cursor-pointer ${i === active ? 'bg-primary-container/15 text-primary font-semibold' : 'text-on-surface'}`}
            >
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
