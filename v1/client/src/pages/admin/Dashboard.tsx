import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminStats } from '../../api/saints'
import type { AdminStats } from '../../api/types'

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-md shadow-card ${accent ? 'border-t-4 border-primary-container' : ''}`}>
      <span
        className="material-symbols-outlined text-primary-container mb-3 block"
        style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-on-surface tracking-tight">{value}</p>
      {sub && <p className="text-xs text-outline font-medium mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then(setStats).finally(() => setLoading(false))
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })

  const maxBar = stats ? Math.max(...stats.attendance_trend.map((a) => a.count), 1) : 1

  return (
    <div className="p-6 md:p-10 space-y-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">Institutional Oversight</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Admin Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-sm px-4 py-2.5">Download Report</button>
          <button onClick={() => navigate('/')} className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            Live Check-in
          </button>
        </div>
      </section>

      {/* Live banner */}
      <div className="flex items-center gap-3 bg-inverse-surface px-5 py-3.5 rounded-md">
        <span className="live-dot flex-shrink-0" />
        <p className="text-white/90 text-sm font-semibold">
          <span className="font-extrabold text-primary-container">Live Service</span>
          {stats
            ? ` — ${stats.today_checkins.toLocaleString()} checked in today | ${stats.new_today.length} new today`
            : ' — Loading…'}
        </p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-md shadow-card animate-pulse h-36" />
          ))
        ) : stats ? (
          <>
            <StatCard icon="groups" label="Total Registered" value={stats.total_registered.toLocaleString()} accent />
            <StatCard icon="how_to_reg" label="Today's Check-ins" value={stats.today_checkins.toLocaleString()} sub={`${stats.new_today.length} new today`} accent />
            <StatCard icon="calendar_month" label="This Month" value={stats.this_month.toLocaleString()} />
            <StatCard icon="trending_up" label="Avg Attendance" value={stats.avg_attendance.toLocaleString()} sub="per service" />
          </>
        ) : null}
      </section>

      {/* Attendance chart + new today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-md shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="section-label mb-0.5">Attendance Trend</p>
              <p className="text-xs text-on-surface-variant">Last 8 services</p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline" onClick={() => navigate('/admin/reports')}>
              View full report
            </button>
          </div>
          {loading ? (
            <div className="h-40 animate-pulse bg-surface-container-high rounded-md" />
          ) : stats && stats.attendance_trend.length > 0 ? (
            <div className="flex items-end gap-2 h-40">
              {[...stats.attendance_trend].reverse().map((rec) => {
                const pct = (rec.count / maxBar) * 100
                return (
                  <div key={rec.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-bold text-on-surface-variant">{rec.count}</span>
                    <div className="w-full rounded-sm bg-surface-container-high relative overflow-hidden" style={{ height: '7rem' }}>
                      <div className="absolute bottom-0 left-0 w-full bg-primary-container rounded-sm transition-all" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-outline font-medium">{formatDate(rec.date)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-on-surface-variant text-sm">
              No attendance data yet
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-md shadow-card p-6">
          <div className="mb-5">
            <p className="section-label mb-0.5">New Today</p>
            <p className="text-xs text-on-surface-variant">{stats?.new_today.length ?? 0} first-time visitors</p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-surface-container-low rounded-md" />)}
            </div>
          ) : stats?.new_today.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-6">No new visitors today</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats?.new_today.slice(0, 5).map((s) => (
                <button key={s.id} onClick={() => navigate(`/admin/saints/${s.id}`)} className="flex items-center gap-3 p-3 rounded-md hover:bg-surface-container-low transition-colors text-left group">
                  <div className="w-9 h-9 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {s.student ? s.university || 'Student' : s.occupation || '—'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/admin/saints')} className="btn-tertiary text-xs w-full mt-4">
            View all saints →
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <p className="section-label mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'person_add', label: 'Register Saint', to: '/' },
            { icon: 'group', label: 'View Saints', to: '/admin/saints' },
            { icon: 'bar_chart', label: 'Generate Report', to: '/admin/reports' },
            { icon: 'admin_panel_settings', label: 'Manage Admins', to: '/admin/settings' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-3 p-6 bg-surface-container-lowest rounded-md shadow-card hover:bg-surface-container-low transition-colors group"
            >
              <span
                className="material-symbols-outlined text-primary group-hover:text-primary-container transition-colors"
                style={{ fontSize: '28px' }}
              >
                {action.icon}
              </span>
              <span className="text-xs font-bold text-on-surface text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
