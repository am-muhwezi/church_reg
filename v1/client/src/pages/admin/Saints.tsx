import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_SAINTS, Saint } from '../../data/mockData'

export default function Saints() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'student' | 'whatsapp' | 'new'>('all')

  const filtered = MOCK_SAINTS.filter((s) => {
    const q = query.toLowerCase()
    const matchSearch =
      !q ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.occupation.toLowerCase().includes(q)

    const matchFilter =
      filter === 'all' ||
      (filter === 'student' && s.student) ||
      (filter === 'whatsapp' && s.whatsApp_group_consent) ||
      (filter === 'new' && s.first_time)

    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 md:p-10 animate-fade-up">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="section-label mb-1">Member Registry</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Saints</h1>
          <p className="text-sm text-on-surface-variant mt-1">{MOCK_SAINTS.length} registered members</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Register New
        </button>
      </section>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="field-input pl-10 w-full"
            placeholder="Search by name, email, or occupation…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'new', label: 'First-time' },
            { key: 'student', label: 'Students' },
            { key: 'whatsapp', label: 'WhatsApp' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === key
                  ? 'bg-primary-container text-on-primary-fixed'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">person_search</span>
          <p className="text-sm text-on-surface-variant font-medium">No saints found matching your search.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden">
          {/* Table header — desktop */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-6 py-3 bg-surface-container text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant">
            <span>Name</span>
            <span>Occupation / Residence</span>
            <span>Status</span>
            <span>Services</span>
            <span />
          </div>

          <div className="divide-y divide-surface-container-low">
            {filtered.map((saint) => (
              <SaintRow key={saint.id} saint={saint} onClick={() => navigate(`/admin/saints/${saint.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SaintRow({ saint, onClick }: { saint: Saint; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-6 py-4 hover:bg-surface-container-low/60 transition-colors group flex md:grid md:grid-cols-[2fr_2fr_1fr_1fr_80px] items-center gap-4"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-sm">
          {saint.first_name[0]}{saint.last_name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
            {saint.first_name} {saint.last_name}
          </p>
          <p className="text-xs text-on-surface-variant truncate">{saint.email}</p>
        </div>
      </div>

      {/* Occupation — hidden on mobile */}
      <div className="hidden md:block min-w-0">
        <p className="text-sm text-on-surface truncate">{saint.occupation || '—'}</p>
        <p className="text-xs text-on-surface-variant truncate">{saint.residence || '—'}</p>
      </div>

      {/* Badges */}
      <div className="hidden md:flex flex-wrap gap-1.5">
        {saint.first_time && (
          <span className="px-2 py-0.5 bg-tertiary-container/40 text-tertiary text-[9px] font-black uppercase tracking-wider rounded">
            New
          </span>
        )}
        {saint.student && (
          <span className="px-2 py-0.5 bg-secondary-container/40 text-secondary text-[9px] font-black uppercase tracking-wider rounded">
            Student
          </span>
        )}
        {saint.whatsApp_group_consent && (
          <span className="px-2 py-0.5 bg-primary-container/20 text-primary text-[9px] font-black uppercase tracking-wider rounded">
            WA
          </span>
        )}
      </div>

      {/* Attendance */}
      <div className="hidden md:block">
        <span className="text-sm font-bold text-on-surface">{saint.attendance_count}</span>
        <span className="text-xs text-on-surface-variant ml-1">sessions</span>
      </div>

      {/* Chevron */}
      <div className="flex justify-end ml-auto md:ml-0">
        <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">
          chevron_right
        </span>
      </div>
    </button>
  )
}
