import type { WeeklyReport, WeeklyService } from '../../api/serviceReports'

const NAVY = '#04003f'
const GREEN = '#92c83e'

export function longDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Row({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <tr>
      <th style={{ textAlign: 'left', padding: '7px 12px', width: '45%', background: '#f1f3f3', border: '1px solid #cfd5d5', fontWeight: 600 }}>{label}</th>
      <td style={{ padding: '7px 12px', border: '1px solid #cfd5d5', fontWeight: strong ? 800 : 500 }}>{value}</td>
    </tr>
  )
}

function ServiceTable({ s }: { s: WeeklyService }) {
  return (
    <section style={{ breakInside: 'avoid', marginBottom: 28 }}>
      <h2 style={{ background: NAVY, color: '#fff', margin: 0, padding: '10px 14px', fontSize: 18, fontWeight: 800 }}>
        {s.heading} <span style={{ fontWeight: 500, fontSize: 14, opacity: 0.85 }}>· {cap(s.service_type)} · {longDate(s.service_date)}</span>
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <tbody>
          <Row label="Residential / Institution Center" value={s.center} />
          <Row label="Date of Service" value={longDate(s.service_date)} />
          <Row label="Venue of Service" value={s.venue} />
          <Row label="Male" value={s.male} />
          <Row label="Female" value={s.female} />
          <Row label="Children" value={s.children} />
          <Row label="Total Attendance" value={s.total_attendance} strong />
          <Row label="Serving Team" value={s.serving_team} />
          <Row label="First Timers" value={s.first_timers} />
          <Row label="New Converts" value={s.new_converts} />
        </tbody>
      </table>
    </section>
  )
}

export default function WeeklyDoc({ report, logoSrc = '/logo.png' }: { report: WeeklyReport; logoSrc?: string }) {
  const t = report.totals
  return (
    <div style={{ fontFamily: 'Manrope, "Helvetica Neue", Arial, sans-serif', color: '#2a1f2d', background: '#fff', padding: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: `4px solid ${GREEN}`, paddingBottom: 14, marginBottom: 22 }}>
        <img src={logoSrc} alt="Manifest Kenya" style={{ height: 56 }} />
        <div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Weekly Service Report</p>
          <p style={{ margin: 0, fontSize: 13 }}>
            {report.center} · {longDate(report.week_start)} to {longDate(report.week_end)}
          </p>
        </div>
      </header>
      {report.services.length === 0 ? (
        <p style={{ fontSize: 15 }}>No service reports were filed for this week.</p>
      ) : (
        <>
          {report.services.map((s) => (
            <ServiceTable key={`${s.service_date}-${s.service_number}`} s={s} />
          ))}
          {report.services.length > 1 && (
            <section style={{ breakInside: 'avoid' }}>
              <h2 style={{ background: GREEN, color: NAVY, margin: 0, padding: '10px 14px', fontSize: 18, fontWeight: 800 }}>Week Totals</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  <Row label="Services held" value={report.services.length} />
                  <Row label="Male / Female / Children" value={`${t.male} / ${t.female} / ${t.children}`} />
                  <Row label="Total Attendance" value={t.total_attendance} strong />
                  <Row label="Serving Team" value={t.serving_team} />
                  <Row label="First Timers" value={t.first_timers} />
                  <Row label="New Converts" value={t.new_converts} />
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  )
}
