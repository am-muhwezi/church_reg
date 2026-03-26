import { useEffect, useRef, useState } from 'react'
import { getReportData } from '../../api/saints'
import type { ReportData } from '../../api/types'

type Period = 'weekly' | 'monthly' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'This Week',
  monthly: 'This Month',
  all: 'All Time',
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>('all')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    getReportData(period)
      .then(setData)
      .finally(() => setLoading(false))
  }, [period])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Date', 'Attendance', 'New Visitors'],
      ...data.attendance_log.map((r) => [r.date, r.count, r.new_visitors]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manifest-attendance-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  const total = data ? data.total_registered : 0

  return (
    <div className="p-6 md:p-10 space-y-10 print:p-4 print:space-y-6" ref={printRef}>
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">Data Intelligence</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Reports</h1>
        </div>

        {/* Period + actions */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex gap-2 bg-surface-container rounded-lg p-1">
            {(['weekly', 'monthly', 'all'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  period === p
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            disabled={!data || loading}
            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            disabled={!data || loading}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print
          </button>
        </div>
      </section>

      {/* Print header (only shows on print) */}
      <div className="hidden print:block mb-4">
        <p className="text-lg font-bold">Manifest Fellowship Kenya — Attendance Report</p>
        <p className="text-sm text-gray-500">
          Period: {PERIOD_LABELS[period]} · Generated {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-md shadow-card p-5 h-28 animate-pulse" />
            ))
          : [
              { label: 'Total Registered', value: data?.total_registered.toLocaleString() ?? '—', icon: 'group' },
              { label: 'Today', value: data?.today_checkins.toLocaleString() ?? '—', icon: 'today' },
              { label: 'This Month', value: data?.this_month.toLocaleString() ?? '—', icon: 'calendar_month' },
              { label: 'On WhatsApp', value: data?.whatsapp_count.toLocaleString() ?? '—', icon: 'chat' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-surface-container-lowest rounded-md shadow-card p-5">
                <span
                  className="material-symbols-outlined text-primary-container text-[22px] mb-2 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
                <p className="text-2xl font-extrabold text-on-surface">{value}</p>
              </div>
            ))}
      </section>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gender */}
        <div className="bg-surface-container-lowest rounded-md shadow-card p-6">
          <p className="section-label mb-5">Gender Distribution</p>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-surface-container-high rounded" />
              <div className="h-6 bg-surface-container-high rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Male', count: data?.male_count ?? 0, bar: 'bg-primary-container' },
                { label: 'Female', count: data?.female_count ?? 0, bar: 'bg-tertiary-container' },
              ].map(({ label, count, bar }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1.5">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all duration-500`}
                      style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-surface-container-lowest rounded-md shadow-card p-6">
          <p className="section-label mb-5">Member Categories</p>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-surface-container-high rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Students', count: data?.student_count ?? 0, bar: 'bg-secondary-container' },
                { label: 'Working Professionals', count: data?.professional_count ?? 0, bar: 'bg-primary-container/40' },
                { label: 'WhatsApp Members', count: data?.whatsapp_count ?? 0, bar: 'bg-tertiary-container' },
                { label: 'First-time Visitors Today', count: data?.first_time_today ?? 0, bar: 'bg-error-container/60' },
              ].map(({ label, count, bar }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1.5">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all duration-500`}
                      style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance log */}
      <div className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden">
        <div className="px-6 py-4 bg-surface-container flex items-center justify-between">
          <p className="section-label">Service Attendance Log</p>
          {!loading && data && (
            <span className="text-xs text-on-surface-variant font-medium">
              {data.attendance_log.length} service{data.attendance_log.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-surface-container-low">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-3.5 bg-surface-container-high rounded w-48" />
                  <div className="h-2.5 bg-surface-container-high rounded w-28" />
                </div>
                <div className="h-7 bg-surface-container-high rounded w-16" />
              </div>
            ))}
          </div>
        ) : data && data.attendance_log.length > 0 ? (
          <div className="divide-y divide-surface-container-low">
            {data.attendance_log.map((rec) => {
              const maxCount = Math.max(...data.attendance_log.map((r) => r.count), 1)
              return (
                <div
                  key={rec.date}
                  className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-on-surface">{formatDate(rec.date)}</p>
                    <p className="text-xs text-on-surface-variant">{rec.new_visitors} new visitor{rec.new_visitors !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-on-surface">{rec.count.toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Attendance</p>
                    </div>
                    <div className="w-1.5 h-10 rounded-full bg-surface-container-high overflow-hidden relative">
                      <div
                        className="absolute bottom-0 w-full bg-primary-container rounded-full transition-all duration-500"
                        style={{ height: `${(rec.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-outline">event_busy</span>
            <p className="text-sm text-on-surface-variant font-medium">No attendance records for this period.</p>
          </div>
        )}
      </div>
    </div>
  )
}
