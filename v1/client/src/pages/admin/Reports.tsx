import { useState } from 'react'
import { MOCK_ATTENDANCE, MOCK_SAINTS, MOCK_STATS } from '../../data/mockData'

type Period = 'weekly' | 'monthly' | 'all'

export default function Reports() {
  const [period, setPeriod] = useState<Period>('weekly')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 1000))
    setGenerating(false)
    setGenerated(true)
  }

  const totalMale = MOCK_SAINTS.filter((s) => s.gender).length
  const totalFemale = MOCK_SAINTS.filter((s) => !s.gender).length
  const totalStudents = MOCK_SAINTS.filter((s) => s.student).length
  const totalWhatsApp = MOCK_SAINTS.filter((s) => s.whatsApp_group_consent).length

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })

  return (
    <div className="p-6 md:p-10 animate-fade-up space-y-10">
      {/* Header */}
      <section>
        <p className="section-label mb-1">Data Intelligence</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Reports</h1>
      </section>

      {/* Report generator */}
      <div className="sacred-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-on-surface mb-1">Generate Attendance Report</h2>
            <p className="text-sm text-on-surface-variant">Export a detailed record of service attendance and member registrations.</p>
          </div>

          <div className="flex gap-2">
            {([
              { key: 'weekly', label: 'This Week' },
              { key: 'monthly', label: 'This Month' },
              { key: 'all', label: 'All Time' },
            ] as { key: Period; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setPeriod(key); setGenerated(false) }}
                className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${
                  period === key
                    ? 'bg-primary-container text-on-primary-fixed'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-4">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {generating ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">download</span>
            )}
            {generating ? 'Generating…' : 'Generate Report'}
          </button>

          {generated && (
            <div className="flex items-center gap-2 text-sm font-semibold text-primary animate-fade-in">
              <span className="material-symbols-outlined text-[18px] filled text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Report ready — click to download (mock)
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', value: MOCK_STATS.total_registered, icon: 'group' },
          { label: 'Today', value: MOCK_STATS.today_checkins, icon: 'today' },
          { label: 'This Month', value: MOCK_STATS.this_month.toLocaleString(), icon: 'calendar_month' },
          { label: 'On WhatsApp', value: totalWhatsApp, icon: 'chat' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-surface-container-lowest rounded-md shadow-card p-5">
            <span className="material-symbols-outlined text-primary-container text-[22px] mb-2 block">{icon}</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-on-surface">{value}</p>
          </div>
        ))}
      </section>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gender split */}
        <div className="bg-surface-container-lowest rounded-md shadow-card p-6">
          <p className="section-label mb-4">Gender Distribution</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1">
                <span>Male</span>
                <span>{totalMale}</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full"
                  style={{ width: `${(totalMale / MOCK_SAINTS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1">
                <span>Female</span>
                <span>{totalFemale}</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary-container rounded-full"
                  style={{ width: `${(totalFemale / MOCK_SAINTS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Member categories */}
        <div className="bg-surface-container-lowest rounded-md shadow-card p-6">
          <p className="section-label mb-4">Member Categories</p>
          <div className="space-y-3">
            {[
              { label: 'Students', count: totalStudents, color: 'bg-secondary-container' },
              { label: 'Working Professionals', count: MOCK_SAINTS.length - totalStudents, color: 'bg-primary-container/40' },
              { label: 'WhatsApp Members', count: totalWhatsApp, color: 'bg-tertiary-container' },
              { label: 'First-time Visitors Today', count: MOCK_STATS.new_today, color: 'bg-error-container/30' },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1">
                  <span>{label}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${(count / MOCK_SAINTS.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance table */}
      <div className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden">
        <div className="px-6 py-4 bg-surface-container">
          <p className="section-label">Service Attendance Log</p>
        </div>
        <div className="divide-y divide-surface-container-low">
          {MOCK_ATTENDANCE.map((rec) => (
            <div key={rec.date} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {new Date(rec.date).toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-on-surface-variant">{rec.new_members} new visitors</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-extrabold text-on-surface">{rec.count.toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Attendance</p>
                </div>
                <div className="w-1.5 h-10 rounded-full bg-surface-container-high overflow-hidden relative">
                  <div
                    className="absolute bottom-0 w-full bg-primary-container rounded-full"
                    style={{ height: `${(rec.count / 450) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
