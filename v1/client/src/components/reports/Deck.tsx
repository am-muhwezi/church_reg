import type { CenterStats, PeriodReport, ServiceType } from '../../api/serviceReports'

// Palette sampled from the sample deck (prep.pdf).
const NAVY = '#04003f'
const GREEN = '#92c83e'
const BG = '#dde2e2'
const INK = '#2a1f2d'
const RED = '#e5483c'
const GRID = '#c3c9c9'
const SERIES_COLOR: Record<ServiceType, string> = { thursday: GREEN, sunday: NAVY }
const SERIES_NAME: Record<ServiceType, string> = { thursday: 'Thursday Fellowship', sunday: 'Sunday Fellowship' }

const W = 1440
const H = 810

/** Round axis maximum and tick step so labels are whole, friendly numbers (at most 6 intervals). */
export function niceScale(v: number): { max: number; step: number } {
  if (v <= 0) return { max: 10, step: 2 }
  const pow = 10 ** Math.floor(Math.log10(v / 6))
  for (const m of [1, 2, 2.5, 5, 10]) {
    const step = m * pow
    if (Math.ceil(v / step) <= 6) return { max: Math.ceil(v / step) * step, step }
  }
  return { max: v, step: v / 5 }
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export function fmtVariance(v: number | null): string {
  if (v === null) return ''
  return `(${v > 0 ? '+' : ''}${fmtNum(v)})`
}

function varianceColor(v: number | null): string {
  return v !== null && v < 0 ? RED : GREEN
}

// ---------------------------------------------------------------- primitives

function Slide({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="deck-slide w-full block"
      style={{ aspectRatio: '16 / 9', background: BG, fontFamily: 'Manrope, "Helvetica Neue", Arial, sans-serif' }}
      role="img"
    >
      <rect width={W} height={H} fill={BG} />
      {children}
      {n !== undefined && (
        <g>
          <rect x={W - 190} y={H - 80} width={140} height={52} rx={26} fill="#fff" />
          <text x={W - 120} y={H - 44} textAnchor="middle" fontSize={26} fill={INK}>
            {String(n).padStart(2, '0')}
          </text>
        </g>
      )}
    </svg>
  )
}

function Title({ children, sub }: { children: string; sub?: string }) {
  return (
    <g>
      <text x={W / 2} y={52} textAnchor="middle" fontSize={30} fontWeight={700} fill={INK} textDecoration="underline">
        {children}
      </text>
      {sub && (
        <text x={W / 2} y={88} textAnchor="middle" fontSize={22} fontWeight={600} fill={INK}>
          {sub}
        </text>
      )}
    </g>
  )
}

function Legend({ x, y, items }: { x: number; y: number; items: { name: string; color: string }[] }) {
  return (
    <g>
      {items.map((it, i) => (
        <g key={it.name} transform={`translate(${x + i * 280}, ${y})`}>
          <circle r={10} fill={it.color} />
          <text x={20} y={7} fontSize={20} fill={INK}>
            {it.name}
          </text>
        </g>
      ))}
    </g>
  )
}

function Empty({ x, y, w, h, text }: { x: number; y: number; w: number; h: number; text: string }) {
  return (
    <text x={x + w / 2} y={y + h / 2} textAnchor="middle" fontSize={22} fill="#6b7280">
      {text}
    </text>
  )
}

function Axes({ x, y, w, h, max, step, yLabel }: { x: number; y: number; w: number; h: number; max: number; step: number; yLabel: string }) {
  const ticks = Math.round(max / step)
  return (
    <g>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const ty = y + h - (h * i) / ticks
        return (
          <g key={i}>
            <line x1={x} x2={x + w} y1={ty} y2={ty} stroke={GRID} strokeWidth={1.5} />
            <text x={x - 12} y={ty + 6} textAnchor="end" fontSize={18} fill={INK}>
              {fmtNum(i * step)}
            </text>
          </g>
        )
      })}
      <text transform={`translate(${x - 70}, ${y + h / 2}) rotate(-90)`} textAnchor="middle" fontSize={20} fontWeight={700} fill={INK}>
        {yLabel}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------- charts

interface LineSeries {
  name: string
  color: string
  points: (number | null)[]
  peakIndex?: number
  peakText?: string
}

function LineChart({ x, y, w, h, labels, series, xLabel }: { x: number; y: number; w: number; h: number; labels: string[]; series: LineSeries[]; xLabel: string }) {
  const all = series.flatMap((s) => s.points).filter((p): p is number => p !== null)
  const { max, step } = niceScale(Math.max(...all, 0) * 1.1)
  const px = (i: number) => x + (w * (i + 0.5)) / labels.length
  const py = (v: number) => y + h - (v / max) * h
  return (
    <g>
      <Axes x={x} y={y} w={w} h={h} max={max} step={step} yLabel="Attendance No." />
      {labels.map((l, i) => (
        <text key={l} x={px(i)} y={y + h + 34} textAnchor="middle" fontSize={20} fill={INK}>
          {l}
        </text>
      ))}
      <text x={x + w / 2} y={y + h + 80} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK}>
        {xLabel}
      </text>
      {series.map((s) => {
        const pts = s.points.map((v, i) => (v === null ? null : ([px(i), py(v)] as const)))
        // Break the line across missing weeks instead of drawing through them.
        const segments: (readonly [number, number])[][] = []
        let cur: (readonly [number, number])[] = []
        pts.forEach((p) => {
          if (p) cur.push(p)
          else if (cur.length) { segments.push(cur); cur = [] }
        })
        if (cur.length) segments.push(cur)
        return (
          <g key={s.name}>
            {segments.map((seg, i) => (
              <polyline key={i} points={seg.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth={6} strokeLinejoin="round" />
            ))}
            {pts.map((p, i) =>
              p ? (
                <g key={i}>
                  <circle cx={p[0]} cy={p[1]} r={9} fill={s.color} />
                  <text x={p[0]} y={p[1] + (s.name.startsWith('Sunday') ? -18 : 32)} textAnchor="middle" fontSize={18} fontWeight={700} fill={s.color === GREEN ? '#6b9a22' : s.color}>
                    {fmtNum(s.points[i])}
                  </text>
                </g>
              ) : null,
            )}
            {s.peakIndex !== undefined && s.peakText && pts[s.peakIndex] && (
              <text x={pts[s.peakIndex]![0]} y={pts[s.peakIndex]![1] + (s.name.startsWith('Sunday') ? -48 : 58)} textAnchor="middle" fontSize={16} fontWeight={700} fill="#f59e0b">
                {s.peakText}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

interface BarItem { label: string; value: number | null; variance?: number | null }

function BarChart({ x, y, w, h, items, color, yLabel }: { x: number; y: number; w: number; h: number; items: BarItem[]; color: string; yLabel: string }) {
  const { max, step } = niceScale(Math.max(...items.map((i) => i.value ?? 0), 0) * 1.15)
  const slot = w / Math.max(items.length, 1)
  const bw = Math.min(slot * 0.62, 90)
  return (
    <g>
      <Axes x={x} y={y} w={w} h={h} max={max} step={step} yLabel={yLabel} />
      {items.map((it, i) => {
        const v = it.value ?? 0
        const bh = (v / max) * h
        const cx = x + slot * (i + 0.5)
        return (
          <g key={it.label}>
            <rect x={cx - bw / 2} y={y + h - bh} width={bw} height={Math.max(bh, v > 0 ? 3 : 0)} fill={color} />
            {/* Value and variance are separate text nodes (stacked) so they never overlap in any renderer. */}
            <text x={cx} y={y + h - bh - 10} textAnchor="middle" fontSize={18} fontWeight={700} fill="#3b4a6b">
              {fmtNum(it.value)}
            </text>
            {it.variance !== undefined && it.variance !== null && (
              <text x={cx} y={y + h - bh - 32} textAnchor="middle" fontSize={17} fontWeight={700} fill={varianceColor(it.variance)}>
                {fmtVariance(it.variance)}
              </text>
            )}
            <text transform={`translate(${cx + 6}, ${y + h + 18}) rotate(-40)`} textAnchor="end" fontSize={18} fill={INK}>
              {it.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------- slides

const sorted = (centers: CenterStats[], t: ServiceType) =>
  centers.filter((c) => (c[t].average ?? 0) > 0).sort((a, b) => (b[t].average ?? 0) - (a[t].average ?? 0))

export interface DeckSlide {
  key: string
  title: string
  node: React.ReactNode
}

export function buildSlides(r: PeriodReport, logoSrc = '/logo.png'): DeckSlide[] {
  const isQuarter = r.period.kind === 'quarter'
  const per = isQuarter ? 'Quarter' : 'Month'
  const main = r.main_center ?? 'Main center'
  const periodWord = r.period.label.split(' ')[0]
  const slides: Omit<DeckSlide, 'key'>[] = []

  // Chart slides numbered 01.. like the sample.
  const body: { title: string; render: (n: number) => React.ReactNode }[] = []

  const { trend, kpis } = r
  const peakText = (t: ServiceType) => {
    const p = trend.peaks[t]
    if (!p) return undefined
    return isQuarter ? `PEAK ${p.label} - ${fmtNum(p.value)}no.` : `PEAK Wk${p.label} - ${fmtNum(p.value)}no.`
  }
  const peakIdx = (t: ServiceType) => {
    const p = trend.peaks[t]
    return p ? trend.labels.indexOf(p.label) : undefined
  }
  body.push({
    title: `${main} Attendance`,
    render: (n) => (
      <Slide n={n}>
        <Title>{`Manifest Kenya - ${main} ${r.period.label} Attendance`}</Title>
        <Legend x={470} y={92} items={(['thursday', 'sunday'] as ServiceType[]).map((t) => ({ name: SERIES_NAME[t], color: SERIES_COLOR[t] }))} />
        <LineChart
          x={150} y={150} w={1200} h={470} labels={trend.labels} xLabel={isQuarter ? 'Month' : 'Service Week'}
          series={(['thursday', 'sunday'] as ServiceType[]).map((t) => ({
            name: SERIES_NAME[t], color: SERIES_COLOR[t], points: trend.series[t], peakIndex: peakIdx(t), peakText: peakText(t),
          }))}
        />
      </Slide>
    ),
  })

  if (r.history.length >= 2) {
    body.push({
      title: 'Monthly Attendance History',
      render: (n) => (
        <Slide n={n}>
          <Title>{`${main} Monthly Attendance`}</Title>
          <BarChart x={150} y={130} w={1200} h={480} color={NAVY} yLabel="Attendance No." items={r.history.slice(-12).map((h) => ({ label: h.label, value: h.attendance }))} />
        </Slide>
      ),
    })
  }

  const thu = sorted(r.centers, 'thursday')
  const sun = sorted(r.centers, 'sunday')
  body.push({
    title: 'Livestream Centers Average Attendance',
    render: (n) => (
      <Slide n={n}>
        <Title sub={`(Previous ${per} Variance)`}>{`Manifest Kenya Livestream Centers ${isQuarter ? 'Quarterly' : 'Weekly'} Attendance - ${r.period.label}`}</Title>
        <Legend x={140} y={125} items={[{ name: 'Thursday', color: GREEN }]} />
        <Legend x={800} y={125} items={[{ name: 'Sunday', color: NAVY }]} />
        {thu.length ? <BarChart x={150} y={170} w={560} h={400} color={GREEN} yLabel="Avg. Attendance No." items={thu.map((c) => ({ label: c.center, value: c.thursday.average, variance: c.thursday.variance }))} /> : <Empty x={150} y={170} w={560} h={400} text="No Thursday data" />}
        {sun.length ? <BarChart x={860} y={170} w={480} h={400} color={NAVY} yLabel="Avg. Attendance No." items={sun.map((c) => ({ label: c.center, value: c.sunday.average, variance: c.sunday.variance }))} /> : <Empty x={860} y={170} w={480} h={400} text="No Sunday data" />}
      </Slide>
    ),
  })

  const byFirst = [...r.centers].sort((a, b) => b.first_timers - a.first_timers)
  const byServing = [...r.centers].sort((a, b) => b.serving_team - a.serving_team)
  body.push({
    title: 'First-Timers & Serving Team',
    render: (n) => (
      <Slide n={n}>
        <Title>{`First-Timers & Serving Team ${periodWord} Livestream Centers Breakdown`}</Title>
        <text x={420} y={120} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK}>{`First-Timers (total ${kpis.first_timers})`}</text>
        <text x={1030} y={120} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK}>Serving Team</text>
        <BarChart x={150} y={150} w={560} h={420} color={GREEN} yLabel="Total No." items={byFirst.map((c) => ({ label: c.center, value: c.first_timers }))} />
        <BarChart x={790} y={150} w={560} h={420} color={NAVY} yLabel="Total No." items={byServing.map((c) => ({ label: c.center, value: c.serving_team }))} />
      </Slide>
    ),
  })

  body.push({
    title: 'Attendance Frequencies',
    render: (n) => <FrequencySlide n={n} r={r} />,
  })

  const cover = (
    <Slide>
      <circle cx={230} cy={110} r={400} fill={NAVY} />
      <circle cx={560} cy={-70} r={200} fill={GREEN} />
      <circle cx={1460} cy={880} r={230} fill={GREEN} />
      <image href={logoSrc} x={460} y={14} width={200} height={110} preserveAspectRatio="xMidYMid meet" />
      <text x={930} y={360} fontSize={86} fontWeight={800} fill={INK} textAnchor="middle">{r.period.label.toUpperCase()}</text>
      <text x={930} y={415} fontSize={34} fontWeight={700} fill={INK} textAnchor="middle">Manifest Kenya Attendance Evaluation</text>
      <rect x={50} y={550} width={1090} height={190} rx={46} fill={NAVY} />
      {[
        { v: kpis.new_converts, l: 'New Converts' },
        { v: kpis.first_timers, l: 'First Timers' },
        { v: kpis.thursday_attendance, l: 'Thursday Attendance' },
        { v: kpis.sunday_attendance, l: 'Sunday Attendance' },
      ].map((k, i) => (
        <g key={k.l} transform={`translate(${60 + i * 270}, 0)`}>
          <text x={135} y={640} textAnchor="middle" fontSize={64} fontWeight={800} fill="#fff">{k.v === null ? '—' : Math.round(k.v)}</text>
          <text x={135} y={690} textAnchor="middle" fontSize={24} fontWeight={600} fill="#fff">{k.l}</text>
        </g>
      ))}
    </Slide>
  )

  const index = (
    <Slide>
      <text x={160} y={150} fontSize={64} fontWeight={800} fill={INK}>Index</text>
      <text x={160} y={200} fontSize={22} fontWeight={600} fill={NAVY} letterSpacing={3}>MANIFEST KENYA · {r.period.label.toUpperCase()}</text>
      {body.map((b, i) => (
        <g key={b.title} transform={`translate(160, ${270 + i * 78})`}>
          <rect width={72} height={52} rx={26} fill={GREEN} />
          <text x={36} y={36} textAnchor="middle" fontSize={26} fontWeight={700} fill={NAVY}>{String(i + 1).padStart(2, '0')}</text>
          <text x={100} y={36} fontSize={30} fontWeight={600} fill={INK}>{b.title}</text>
        </g>
      ))}
    </Slide>
  )

  const thanks = (
    <Slide>
      <circle cx={0} cy={H} r={330} fill={NAVY} />
      <circle cx={W} cy={0} r={260} fill={GREEN} />
      <image href={logoSrc} x={W / 2 - 110} y={150} width={220} height={150} preserveAspectRatio="xMidYMid meet" />
      <text x={W / 2} y={470} textAnchor="middle" fontSize={96} fontWeight={800} fill={INK}>Thank You</text>
    </Slide>
  )

  slides.push({ title: 'Cover', node: cover }, { title: 'Index', node: index })
  body.forEach((b, i) => slides.push({ title: b.title, node: b.render(i + 1) }))
  slides.push({ title: 'Thank You', node: thanks })
  return slides.map((s, i) => ({ ...s, key: `${i}-${s.title}` }))
}

function FrequencySlide({ n, r }: { n: number; r: PeriodReport }) {
  const colW = [220, 150, 150, 110]
  const x0 = 130
  const gap = 28
  const sunX = x0 + colW.reduce((a, b) => a + b, 0) + gap
  const rowH = 58
  const top = 190
  const headCell = (x: number, w: number, label: string[], fill: string, tc = '#fff') => (
    <g key={label.join()}>
      <rect x={x} y={130} width={w - 6} height={rowH} fill={fill} />
      {label.map((t, i) => (
        <text key={t} x={x + (w - 6) / 2} y={label.length === 1 ? 168 : 152 + i * 24} textAnchor="middle" fontSize={20} fontWeight={700} fill={tc}>{t}</text>
      ))}
    </g>
  )
  const cell = (x: number, y: number, w: number, text: string) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w - 6} height={rowH - 8} fill="#fff" />
      <text x={x + (w - 6) / 2} y={y + 34} textAnchor="middle" fontSize={22} fontWeight={700} fill={NAVY}>{text}</text>
    </g>
  )
  const block = (x: number, t: ServiceType, fill: string) => {
    let cx = x
    const cols: [number, string[]][] = [[colW[1], ['Attendance', 'Frequency']], [colW[2], ['Expected', 'Frequency']], [colW[3], ['%']]]
    return (
      <g>
        {cols.map(([w, label]) => { const el = headCell(cx, w, label, fill); cx += w; return el })}
        {r.centers.map((c, i) => {
          const s = c[t]
          return (
            <g key={c.center}>
              {cell(x, top + i * rowH, colW[1], String(s.frequency))}
              {cell(x + colW[1], top + i * rowH, colW[2], String(s.expected))}
              {cell(x + colW[1] + colW[2], top + i * rowH, colW[3], `${s.percent}%`)}
            </g>
          )
        })}
      </g>
    )
  }
  const sunBlockX = sunX
  return (
    <Slide n={n}>
      <Title>{`Manifest Kenya Livestream Centers Attendance Frequency - ${r.period.label.split(' ')[0]}`}</Title>
      <text x={x0 + colW[0] + 200} y={122} textAnchor="middle" fontSize={20} fontWeight={700} fill={INK}>Thursday Services</text>
      <text x={sunBlockX + 200} y={122} textAnchor="middle" fontSize={20} fontWeight={700} fill={INK}>Sunday Services</text>
      {headCell(x0, colW[0], ['Livestream', 'Center'], NAVY)}
      {r.centers.map((c, i) => (
        <g key={c.center}>
          <rect x={x0} y={top + i * rowH} width={colW[0] - 6} height={rowH - 8} fill={NAVY} />
          <text x={x0 + (colW[0] - 6) / 2} y={top + i * rowH + 34} textAnchor="middle" fontSize={22} fontWeight={700} fill="#fff">{c.center}</text>
        </g>
      ))}
      {block(x0 + colW[0], 'thursday', NAVY)}
      {block(sunBlockX, 'sunday', GREEN)}
    </Slide>
  )
}
