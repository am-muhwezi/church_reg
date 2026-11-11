import { useEffect, useState } from 'react'
import { getInstitutionTally } from '../api/institutions'
import type { InstitutionTally as Tally } from '../api/types'

const POLL_MS = 10_000

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** `serviceDate` omitted = today. Polls only while the date is today; past days are fixed. */
export default function InstitutionTally({ serviceDate }: { serviceDate?: string }) {
  const isToday = !serviceDate || serviceDate === todayISO()
  const [tally, setTally] = useState<Tally | null>(null)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let live = true
    const load = () =>
      getInstitutionTally(serviceDate)
        .then((t) => { if (live) { setTally(t); setStale(false) } })
        .catch(() => { if (live) setStale(true) })
    load()
    const timer = isToday ? setInterval(() => { if (!document.hidden) load() }, POLL_MS) : undefined
    const onVisible = () => { if (isToday && !document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { live = false; if (timer) clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [serviceDate, isToday])

  const max = tally ? Math.max(...tally.institutions.map((i) => i.count), 1) : 1

  return (
    <div className="bg-surface-container-lowest rounded-md shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="section-label mb-0.5">Students by Institution</p>
          <p className="text-xs text-on-surface-variant">
            {tally ? `${tally.total_students.toLocaleString()} students ${isToday ? 'today' : 'that day'}` : 'Loading…'}
            {stale && ' · connection lost, retrying'}
          </p>
        </div>
        {isToday && (
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            <span className="live-dot" /> Live
          </span>
        )}
      </div>

      {tally && tally.institutions.length === 0 && (
        <p className="text-sm text-on-surface-variant py-4">No students checked in yet.</p>
      )}

      <ul className="space-y-2.5" aria-live="polite">
        {tally?.institutions.map((i) => (
          <li key={i.code} className="flex items-center gap-3">
            <span className="w-28 sm:w-44 text-sm font-bold text-on-surface truncate" title={i.code}>{i.code}</span>
            <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full bg-primary-container transition-all duration-500" style={{ width: `${(i.count / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-sm font-extrabold text-on-surface tabular-nums">{i.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
