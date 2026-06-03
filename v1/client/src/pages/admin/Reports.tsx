import { useEffect, useRef, useState } from 'react'
import { getReportData, getDetailedReport } from '../../api/saints'
import type { ReportData, DateRangeReport, AttendanceDetail } from '../../api/types'

type Period = 'weekly' | 'monthly' | 'all'
type Mode = 'preset' | 'custom' | 'date-detail'

const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'This Week',
  monthly: 'This Month',
  all: 'All Time',
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateShort(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getYesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

type CategoryFilter = 'all' | 'first_time' | 'student' | 'whatsapp' | 'institution'

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'first_time', label: 'First-time' },
  { key: 'student', label: 'Students' },
  { key: 'institution', label: 'Institutions' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

export default function Reports() {
  const [mode, setMode] = useState<Mode>('preset')
  const [period, setPeriod] = useState<Period>('all')
  const [startDate, setStartDate] = useState(getYesterdayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [data, setData] = useState<ReportData | null>(null)
  const [detailedData, setDetailedData] = useState<DateRangeReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        if (mode === 'date-detail' && selectedDate) {
          const result = await getDetailedReport(selectedDate, selectedDate)
          setDetailedData(result)
          setData(result.summary)
          setViewMode('details')
        } else if (mode === 'custom') {
          const result = await getDetailedReport(startDate, endDate)
          setDetailedData(result)
          setData(result.summary)
        } else {
          const result = await getReportData(period)
          setData(result)
          setDetailedData(null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [mode, period, startDate, endDate, selectedDate])

  const getPeriodLabel = (): string => {
    if (mode === 'date-detail' && selectedDate) {
      return formatDate(selectedDate)
    }
    if (mode === 'custom') {
      return `${formatDateShort(startDate)} — ${formatDateShort(endDate)}`
    }
    return PERIOD_LABELS[period]
  }

  const getExportLabel = (): string => {
    if (mode === 'date-detail' && selectedDate) return selectedDate
    if (mode === 'custom') return `${startDate}-to-${endDate}`
    return period
  }

  const escapeCSV = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const exportCSV = () => {
    if (!data) return

    const rows: string[] = []
    const generatedDate = new Date().toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    rows.push('Manifest Fellowship Kenya — Attendance Report')
    rows.push(`Period:,${getPeriodLabel()}`)
    rows.push(`Generated:,${generatedDate}`)
    rows.push('')

    rows.push('=== SUMMARY STATISTICS ===')
    rows.push('')
    rows.push('Category,Value')
    rows.push(`Total Registered,${data.total_registered.toLocaleString()}`)
    rows.push(`Today's Check-ins,${data.today_checkins.toLocaleString()}`)
    rows.push(`This Month,${data.this_month.toLocaleString()}`)
    rows.push(`On WhatsApp,${data.whatsapp_count.toLocaleString()}`)
    rows.push(`Average Attendance,${data.avg_attendance}`)
    rows.push('')

    rows.push('=== GENDER DISTRIBUTION ===')
    rows.push('')
    rows.push('Gender,Count')
    rows.push(`Male,${data.male_count}`)
    rows.push(`Female,${data.female_count}`)
    rows.push('')

    rows.push('=== MEMBER CATEGORIES ===')
    rows.push('')
    rows.push('Category,Count')
    rows.push(`Students,${data.student_count}`)
    rows.push(`Working Professionals,${data.professional_count}`)
    rows.push(`WhatsApp Members,${data.whatsapp_count}`)
    rows.push(`First-time Visitors (in period),${data.first_time_today}`)
    rows.push('')

    rows.push('=== SERVICE ATTENDANCE LOG ===')
    rows.push('')
    rows.push('Date,Day of Week,Attendance,New Visitors')
    data.attendance_log.forEach((r) => {
      const dayName = new Date(r.date + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long' })
      rows.push(`${r.date},${dayName},${r.count},${r.new_visitors}`)
    })
    rows.push('')

    if (filteredDetails.length > 0) {
      rows.push('=== DETAILED ATTENDANCE LIST ===')
      rows.push('')
      rows.push([
        'Service Date',
        'First Name',
        'Last Name',
        'Gender',
        'Phone Number',
        'Email',
        'Residence',
        'Student',
        'Institution',
        'Institution Location',
        'Occupation',
        'First Time',
        'Consent',
        'WhatsApp Member',
        'Action',
      ].join(','))

      filteredDetails.forEach((r) => {
        const phone = r.phone_number ? `="${r.phone_number}"` : ''
        rows.push([
          escapeCSV(r.service_date),
          escapeCSV(r.first_name),
          escapeCSV(r.last_name),
          escapeCSV(r.gender ? 'Male' : 'Female'),
          phone,
          escapeCSV(r.email),
          escapeCSV(r.residence),
          escapeCSV(r.student ? 'Yes' : 'No'),
          escapeCSV(r.university),
          escapeCSV(r.institution_location),
          escapeCSV(r.occupation),
          escapeCSV(r.first_time ? 'Yes' : 'No'),
          escapeCSV(r.consent_to_share_info ? 'Yes' : 'No'),
          escapeCSV(r.whatsApp_group_consent ? 'ToBeAddedToWhatsAppGroup' : ''),
          escapeCSV(
            r.action === 'new_registration' ? 'New Registration' :
            r.action === 'updated' ? 'Updated' : 'Confirmed'
          ),
        ].join(','))
      })
    }

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manifest-attendance-${getExportLabel()}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  const handleLogEntryClick = (date: string) => {
    setSelectedDate(date)
    setMode('date-detail')
  }

  const handleBackToSummary = () => {
    setSelectedDate(null)
    setMode('custom')
    setViewMode('summary')
  }

  const handlePresetChange = (p: Period) => {
    setPeriod(p)
    setMode('preset')
    setSelectedDate(null)
    setViewMode('summary')
  }

  const handleCustomMode = () => {
    setMode('custom')
    setSelectedDate(null)
    setViewMode('summary')
  }

  const total = data ? data.total_registered : 0
  const hasDetails = detailedData && detailedData.attendance_details.length > 0

  const filteredDetails = detailedData?.attendance_details.filter((p) => {
    if (categoryFilter === 'all') return true
    if (categoryFilter === 'first_time') return p.first_time
    if (categoryFilter === 'student') return p.student
    if (categoryFilter === 'institution') return p.student && !!p.university
    if (categoryFilter === 'whatsapp') return p.whatsApp_group_consent
    return true
  }) || []

  return (
    <div className="p-6 md:p-10 space-y-10 print:p-4 print:space-y-6" ref={printRef}>
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">Data Intelligence</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Reports</h1>
        </div>

        {/* Period + actions */}
        <div className="flex flex-col gap-3 print:hidden">
          {/* Preset buttons and Custom toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 bg-surface-container rounded-lg p-1">
              {(['weekly', 'monthly', 'all'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePresetChange(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    mode === 'preset' && period === p
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button
              onClick={handleCustomMode}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                mode === 'custom' || mode === 'date-detail'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Date inputs — show when in custom or date-detail mode */}
          {(mode === 'custom' || mode === 'date-detail') && (
            <div className="flex flex-wrap items-center gap-3">
              {mode === 'date-detail' && selectedDate ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackToSummary}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                    Back
                  </button>
                  <span className="text-sm font-bold text-on-surface">
                    Viewing: {formatDate(selectedDate)}
                  </span>
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="field-input text-sm px-3 py-1.5 w-auto"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="field-input text-sm px-3 py-1.5 w-auto"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setStartDate(getYesterdayISO())
                      setEndDate(getYesterdayISO())
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => {
                      setStartDate(getTodayISO())
                      setEndDate(getTodayISO())
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Today
                  </button>
                </>
              )}
            </div>
          )}

          {/* View mode toggle + Export/Print */}
          <div className="flex flex-wrap items-center gap-3">
            {hasDetails && (
              <div className="flex gap-2 bg-surface-container rounded-lg p-1">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setViewMode('details')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    viewMode === 'details'
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Attendance List
                </button>
              </div>
            )}

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
        </div>
      </section>

      {/* Print header (only shows on print) */}
      <div className="hidden print:block mb-4">
        <p className="text-lg font-bold">Manifest Fellowship Kenya — Attendance Report</p>
        <p className="text-sm text-gray-500">
          Period: {getPeriodLabel()} · Generated {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {viewMode === 'details' && hasDetails ? (
        /* Detailed attendance list view */
        <section className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden">
          <div className="px-6 py-4 bg-surface-container flex items-center justify-between">
            <p className="section-label">
              Attendance List — {getPeriodLabel()}
            </p>
            <span className="text-xs text-on-surface-variant font-medium">
              {filteredDetails.length} attendee{filteredDetails.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Category filter for detail view */}
          <div className="px-6 py-3 bg-surface-container/50 flex flex-wrap gap-2 border-b border-surface-container-low">
            {CATEGORY_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors ${
                  categoryFilter === key
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="divide-y divide-surface-container-low">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 bg-surface-container-high rounded w-1/3 mb-2" />
                  <div className="h-3 bg-surface-container-high rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="bg-surface-container text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Gender</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Occupation</th>
                    <th className="text-left px-4 py-3">Residence</th>
                    <th className="text-left px-4 py-3">New</th>
                    <th className="text-left px-4 py-3">WA</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredDetails.map((person) => (
                    <DetailRowDesktop key={`${person.id}-${person.service_date}`} person={person} />
                  ))}
                </tbody>
              </table>

              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-surface-container-low">
                {filteredDetails.map((person) => (
                  <DetailRowMobile key={`${person.id}-${person.service_date}`} person={person} />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Summary view */
        <>
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
                    { label: 'First-time Visitors', count: data?.first_time_today ?? 0, bar: 'bg-error-container/60' },
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
              <div>
                <p className="section-label">Service Attendance Log</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Click a day to view full attendance list
                </p>
              </div>
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
                    <button
                      key={rec.date}
                      onClick={() => handleLogEntryClick(rec.date)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                          visibility
                        </span>
                        <div>
                          <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            {formatDate(rec.date)}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {rec.new_visitors} new visitor{rec.new_visitors !== 1 ? 's' : ''}
                          </p>
                        </div>
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
                    </button>
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
        </>
      )}
    </div>
  )
}

function DetailRowDesktop({ person }: { person: AttendanceDetail }) {
  const actionLabel =
    person.action === 'new_registration' ? 'New Registration' :
    person.action === 'updated' ? 'Updated' : 'Confirmed'

  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-xs">
            {person.first_name[0]}{person.last_name[0]}
          </div>
          <span className="font-bold text-on-surface text-sm">
            {person.first_name} {person.last_name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-on-surface-variant">{person.email || '—'}</td>
      <td className="px-4 py-3 text-on-surface-variant">{person.phone_number || '—'}</td>
      <td className="px-4 py-3 text-on-surface-variant">{person.gender ? 'Male' : 'Female'}</td>
      <td className="px-4 py-3">
        {person.student ? (
          <span className="px-2 py-0.5 bg-secondary-container/40 text-secondary text-[9px] font-black uppercase tracking-wider rounded">
            Student
          </span>
        ) : (
          <span className="text-on-surface-variant text-xs">Professional</span>
        )}
      </td>
      <td className="px-4 py-3 text-on-surface-variant">{person.occupation || person.university || '—'}</td>
      <td className="px-4 py-3 text-on-surface-variant">{person.residence || '—'}</td>
      <td className="px-4 py-3">
        {person.first_time && (
          <span className="px-2 py-0.5 bg-tertiary-container/40 text-tertiary text-[9px] font-black uppercase tracking-wider rounded">
            New
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {person.whatsApp_group_consent && (
          <span className="px-2 py-0.5 bg-primary-container/20 text-primary text-[9px] font-black uppercase tracking-wider rounded">
            WA
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
          person.action === 'new_registration'
            ? 'bg-tertiary-container/40 text-tertiary'
            : person.action === 'updated'
            ? 'bg-secondary-container/40 text-secondary'
            : 'bg-primary-container/20 text-primary'
        }`}>
          {actionLabel}
        </span>
      </td>
    </tr>
  )
}

function DetailRowMobile({ person }: { person: AttendanceDetail }) {
  const actionLabel =
    person.action === 'new_registration' ? 'New Registration' :
    person.action === 'updated' ? 'Updated' : 'Confirmed'

  return (
    <div className="px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-sm">
          {person.first_name[0]}{person.last_name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-on-surface">
              {person.first_name} {person.last_name}
            </p>
            {person.first_time && (
              <span className="px-2 py-0.5 bg-tertiary-container/40 text-tertiary text-[9px] font-black uppercase tracking-wider rounded">
                New
              </span>
            )}
            {person.student && (
              <span className="px-2 py-0.5 bg-secondary-container/40 text-secondary text-[9px] font-black uppercase tracking-wider rounded">
                Student
              </span>
            )}
            {person.whatsApp_group_consent && (
              <span className="px-2 py-0.5 bg-primary-container/20 text-primary text-[9px] font-black uppercase tracking-wider rounded">
                WA
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
              person.action === 'new_registration'
                ? 'bg-tertiary-container/40 text-tertiary'
                : person.action === 'updated'
                ? 'bg-secondary-container/40 text-secondary'
                : 'bg-primary-container/20 text-primary'
            }`}>
              {actionLabel}
            </span>
          </div>
          <div className="mt-1 grid gap-1 text-xs text-on-surface-variant">
            {person.email && <p>Email: {person.email}</p>}
            {person.phone_number && <p>Phone: {person.phone_number}</p>}
            <p>Gender: {person.gender ? 'Male' : 'Female'}</p>
            {(person.occupation || person.university) && (
              <p>{person.student ? 'University' : 'Occupation'}: {person.occupation || person.university}</p>
            )}
            {person.residence && <p>Residence: {person.residence}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
