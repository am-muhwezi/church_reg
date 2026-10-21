import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  createServiceReport, deleteServiceReport, getMonthlyReport, getMyCenter, getQuarterlyReport, getWeeklyReport,
  listCenters, listServiceReports,
} from '../../api/serviceReports'
import type { Center, MyCenter, PeriodReport, ServiceReport, ServiceReportInput, ServiceType, WeeklyReport } from '../../api/serviceReports'
import { buildSlides } from '../../components/reports/Deck'
import PrintPortal, { DECK_PAGE_CSS, DOC_PAGE_CSS, printAs } from '../../components/reports/PrintPortal'
import WeeklyDoc, { longDate } from '../../components/reports/WeeklyDoc'

type Tab = 'enter' | 'weekly' | 'monthly' | 'quarterly'
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'enter', label: 'Enter Report', icon: 'edit_note' },
  { key: 'weekly', label: 'Weekly', icon: 'view_week' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar_month' },
  { key: 'quarterly', label: 'Quarterly', icon: 'date_range' },
]

const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}
const typeFromDate = (iso: string): ServiceType => (new Date(iso + 'T00:00:00').getDay() === 4 ? 'thursday' : 'sunday')
const currentMonth = () => todayISO().slice(0, 7)
const currentQuarter = () => {
  const [y, m] = todayISO().split('-').map(Number)
  return { year: y, q: Math.floor((m - 1) / 3) + 1 }
}

const LABEL = 'text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  )
}

export default function ServiceReports() {
  const [tab, setTab] = useState<Tab>('enter')
  const [me, setMe] = useState<MyCenter | null>(null)
  const [centers, setCenters] = useState<Center[]>([])
  const [centerId, setCenterId] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([getMyCenter(), listCenters()])
      .then(([mine, list]) => {
        setMe(mine)
        setCenters(list)
        setCenterId(mine.center?.id ?? list.find((c) => c.is_main)?.id ?? list[0]?.id ?? '')
      })
      .catch(() => setLoadError('Could not load centers.'))
  }, [])

  const locked = !!me && !me.is_super_admin
  const noCenter = !!me && locked && !me.center

  return (
    <div className="p-6 md:p-10 space-y-8">
      <section className="print:hidden">
        <p className="section-label mb-1">Service Reporting</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Service Reports</h1>
      </section>

      <div className="flex gap-2 bg-surface-container rounded-lg p-1 w-fit max-w-full overflow-x-auto print:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.key ? 'bg-primary-container text-on-primary-fixed shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loadError && <p className="text-sm text-error font-semibold">{loadError}</p>}
      {noCenter && (tab === 'enter' || tab === 'weekly') && (
        <p className="text-sm font-semibold text-error bg-error-container/10 px-4 py-3 rounded-md">
          No center is assigned to your account. Ask a super admin to assign one in Admins.
        </p>
      )}

      {tab === 'enter' && me && !noCenter && <EnterReport me={me} centers={centers} centerId={centerId} setCenterId={setCenterId} />}
      {tab === 'weekly' && me && !noCenter && <Weekly me={me} centers={centers} centerId={centerId} setCenterId={setCenterId} />}
      {tab === 'monthly' && <Monthly />}
      {tab === 'quarterly' && <Quarterly />}
    </div>
  )
}

interface CenterPick { me: MyCenter; centers: Center[]; centerId: string; setCenterId: (v: string) => void }

function CenterField({ me, centers, centerId, setCenterId }: CenterPick) {
  if (!me.is_super_admin) {
    return (
      <Field label="Residential / Institution Center">
        <input className="field-input bg-surface-container" value={me.center?.name ?? ''} readOnly />
      </Field>
    )
  }
  return (
    <Field label="Residential / Institution Center">
      <select className="field-input cursor-pointer" value={centerId} onChange={(e) => setCenterId(e.target.value)}>
        {centers.map((c) => (
          <option key={c.id} value={c.id}>{c.name} ({c.kind})</option>
        ))}
      </select>
    </Field>
  )
}

// ------------------------------------------------------------------ enter

const NUM_FIELDS: { key: 'male' | 'female' | 'children' | 'serving_team' | 'first_timers' | 'new_converts'; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'children', label: 'Children' },
  { key: 'serving_team', label: 'Serving Team' },
  { key: 'first_timers', label: 'First Timers' },
  { key: 'new_converts', label: 'New Converts' },
]

function EnterReport(p: CenterPick) {
  const blank = (): Omit<ServiceReportInput, 'center_id'> => ({
    service_date: todayISO(), service_type: typeFromDate(todayISO()), service_number: 1, venue: '',
    male: 0, female: 0, children: 0, serving_team: 0, first_timers: 0, new_converts: 0,
  })
  const [form, setForm] = useState(blank)
  const [venueTouched, setVenueTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [recent, setRecent] = useState<ServiceReport[]>([])

  const refresh = useCallback(() => {
    listServiceReports(p.centerId ? { center_id: p.centerId } : {}).then((r) => setRecent(r.slice(0, 12))).catch(() => setRecent([]))
  }, [p.centerId])
  useEffect(refresh, [refresh])

  // Venue defaults to the last venue used by this center, until the person types one.
  useEffect(() => {
    if (!venueTouched && recent[0]) setForm((f) => (f.venue ? f : { ...f, venue: recent[0].venue }))
  }, [recent, venueTouched])

  const total = form.male + form.female + form.children
  const setNum = (key: string, v: string) => setForm((f) => ({ ...f, [key]: Math.max(0, Math.floor(Number(v) || 0)) }))

  const submit = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await createServiceReport({ ...form, venue: form.venue.trim(), center_id: p.me.is_super_admin ? p.centerId : null })
      setMsg({ ok: true, text: `Service ${form.service_number} saved.` })
      setForm((f) => ({ ...blank(), venue: f.venue, service_date: f.service_date, service_type: f.service_type, service_number: f.service_number + 1 }))
      refresh()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.detail : 'Could not save the report.' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this service report?')) return
    await deleteServiceReport(id).catch(() => undefined)
    refresh()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 bg-surface-container-lowest rounded-md shadow-card p-6 space-y-6">
        <p className="section-label">New Service Report</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CenterField {...p} />
          <Field label="Date of Service">
            <input
              type="date" className="field-input" value={form.service_date}
              onChange={(e) => setForm((f) => ({ ...f, service_date: e.target.value, service_type: e.target.value ? typeFromDate(e.target.value) : f.service_type }))}
            />
          </Field>
          <Field label="Service Day">
            <select className="field-input cursor-pointer" value={form.service_type} onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value as ServiceType }))}>
              <option value="thursday">Thursday Fellowship</option>
              <option value="sunday">Sunday Fellowship</option>
            </select>
          </Field>
          <Field label="Service Number">
            <input type="number" min={1} max={10} className="field-input" value={form.service_number} onChange={(e) => setForm((f) => ({ ...f, service_number: Math.min(10, Math.max(1, Math.floor(Number(e.target.value) || 1))) }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Venue of Service">
              <input className="field-input" placeholder="e.g. Main auditorium" value={form.venue} onChange={(e) => { setVenueTouched(true); setForm((f) => ({ ...f, venue: e.target.value })) }} />
            </Field>
          </div>
        </div>

        <div>
          <p className={`${LABEL} mb-2`}>Demographics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NUM_FIELDS.slice(0, 3).map((n) => (
              <Field key={n.key} label={n.label}>
                <input type="number" min={0} inputMode="numeric" className="field-input" value={form[n.key] || ''} placeholder="0" onChange={(e) => setNum(n.key, e.target.value)} />
              </Field>
            ))}
            <Field label="Total">
              <input className="field-input bg-surface-container font-extrabold" value={total} readOnly />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NUM_FIELDS.slice(3).map((n) => (
            <Field key={n.key} label={n.label}>
              <input type="number" min={0} inputMode="numeric" className="field-input" value={form[n.key] || ''} placeholder="0" onChange={(e) => setNum(n.key, e.target.value)} />
            </Field>
          ))}
        </div>

        {msg && <p className={`text-sm font-semibold ${msg.ok ? 'text-primary' : 'text-error'}`}>{msg.text}</p>}
        <button onClick={submit} disabled={saving || !form.venue.trim() || !form.service_date || (p.me.is_super_admin && !p.centerId)} className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
          <span className="material-symbols-outlined text-[16px]">{saving ? 'progress_activity' : 'save'}</span>
          {saving ? 'Saving…' : 'Save Service Report'}
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden self-start">
        <div className="px-6 py-4 bg-surface-container"><p className="section-label">Recent Reports</p></div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-sm text-on-surface-variant">Nothing filed yet.</p>
        ) : (
          <ul className="divide-y divide-surface-container-low">
            {recent.map((r) => (
              <li key={r.id} className="px-6 py-3 flex items-center gap-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{r.center_name} · Service {r.service_number} · {r.service_type === 'thursday' ? 'Thu' : 'Sun'}</p>
                  <p className="text-xs text-on-surface-variant">{longDate(r.service_date)} · {r.total_attendance} attended · {r.first_timers} first timers</p>
                </div>
                <button onClick={() => remove(r.id)} className="p-1.5 text-outline hover:text-error" title="Delete report">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ outputs

function useReport<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    fetcher()
      .then((d) => live && setData(d))
      .catch((e) => live && (setData(null), setError(e instanceof ApiError ? e.detail : 'Failed to load report.')))
      .finally(() => live && setLoading(false))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, loading, error }
}

function DownloadButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50">
      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
      Download PDF
    </button>
  )
}

const PDF_HINT = 'Your browser print dialog opens. Choose "Save as PDF" as the destination.'

function Weekly(p: CenterPick) {
  const [day, setDay] = useState(todayISO())
  const { data, loading, error } = useReport<WeeklyReport>(() => getWeeklyReport(day, p.me.is_super_admin ? p.centerId : undefined), [day, p.centerId])
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 print:hidden">
        <CenterField {...p} />
        <Field label="Any date in the week">
          <input type="date" className="field-input" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
        </Field>
        <DownloadButton disabled={!data || loading} onClick={() => data && printAs(`Weekly-Service-Report-${data.center}-${data.week_start}`)} />
      </div>
      <p className="text-xs text-on-surface-variant print:hidden">{PDF_HINT}</p>
      {error && <p className="text-sm text-error font-semibold">{error}</p>}
      {loading && <div className="h-40 bg-surface-container-lowest rounded-md animate-pulse" />}
      {data && !loading && (
        <>
          <div className="rounded-md shadow-card overflow-hidden max-w-3xl"><WeeklyDoc report={data} /></div>
          <PrintPortal pageCss={DOC_PAGE_CSS}><WeeklyDoc report={data} /></PrintPortal>
        </>
      )}
    </div>
  )
}

function Deck({ report, filename }: { report: PeriodReport | null; filename: string }) {
  const slides = useMemo(() => (report && report.has_data ? buildSlides(report) : []), [report])
  return (
    <>
      <div className="flex items-center gap-4 print:hidden">
        <DownloadButton disabled={!slides.length} onClick={() => printAs(filename)} />
        <p className="text-xs text-on-surface-variant">{PDF_HINT}</p>
      </div>
      {report && !report.has_data && (
        <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-md shadow-card px-5 py-6">
          No service reports filed for {report.period.label} yet.
        </p>
      )}
      {slides.length > 0 && (
        <>
          <div className="space-y-6 max-w-5xl">
            {slides.map((s) => <div key={s.key} className="rounded-md shadow-card overflow-hidden">{s.node}</div>)}
          </div>
          <PrintPortal pageCss={DECK_PAGE_CSS}>{slides.map((s) => <div key={s.key}>{s.node}</div>)}</PrintPortal>
        </>
      )}
    </>
  )
}

function Monthly() {
  const [month, setMonth] = useState(currentMonth())
  const { data, loading, error } = useReport<PeriodReport>(() => getMonthlyReport(month), [month])
  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Field label="Month"><input type="month" className="field-input w-auto" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field>
      </div>
      {error && <p className="text-sm text-error font-semibold">{error}</p>}
      {loading ? <div className="h-40 bg-surface-container-lowest rounded-md animate-pulse" /> : <Deck report={data} filename={`Manifest-Kenya-Monthly-Analysis-${month}`} />}
    </div>
  )
}

function Quarterly() {
  const now = currentQuarter()
  const [year, setYear] = useState(now.year)
  const [q, setQ] = useState(now.q)
  const key = `${year}-Q${q}`
  const { data, loading, error } = useReport<PeriodReport>(() => getQuarterlyReport(key), [key])
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 print:hidden">
        <Field label="Year"><input type="number" min={2000} max={2100} className="field-input w-28" value={year} onChange={(e) => setYear(Math.floor(Number(e.target.value)) || now.year)} /></Field>
        <Field label="Quarter">
          <select className="field-input cursor-pointer" value={q} onChange={(e) => setQ(Number(e.target.value))}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Q{n}</option>)}
          </select>
        </Field>
      </div>
      {error && <p className="text-sm text-error font-semibold">{error}</p>}
      {loading ? <div className="h-40 bg-surface-container-lowest rounded-md animate-pulse" /> : <Deck report={data} filename={`Manifest-Kenya-Quarterly-Analysis-${key}`} />}
    </div>
  )
}
