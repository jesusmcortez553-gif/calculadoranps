import { useState, useMemo } from 'react'
import {
  Smile, Meh, Frown,
  CheckCircle, AlertTriangle, XCircle,
  MapPin, MoreVertical,
  User, Building2
} from 'lucide-react'

/* ============================================================
   CALCULADORA NPS — BCP PICHANAKI
   Réplica visual del gauge de Medallia.

   GEOMETRÍA DEL GAUGE:
   - Centro (77.5, 77.5), radio 62 (viewBox 155x155)
   - Start: 8:00 = SVG 150°  →  End: 4:00 = SVG 30°
   - Sweep total: 240° horario. Gap inferior: 120°.
   - svgDeg = (150 + arcDeg) % 360
   - arcDeg = ((NPS + 100) / 200) * 240
   - Zonas del track: rojo claro 204° (hasta NPS 70),
     amarillo claro 12° (NPS 70→80), verde claro 24° (NPS 80→100)
   ============================================================ */

const C = {
  bg: '#f0f4fb',
  header: '#1a3fa8',
  orange: '#f5a623',
  green: '#22c55e',
  yellow: '#fbbf24',
  red: '#ef4444',
  trackRed: '#fecaca',
  trackYellow: '#fef08a',
  trackGreen: '#bbf7d0',
  text: '#1e293b',
  textSoft: '#64748b',
}

const METAS = { ventanilla: 80, plataforma: 82, agencia: 81 }
const STRETCH = 94
const META_120 = { ventanilla: 96, plataforma: 98, agencia: 97 }

/* ---------- matemática ---------- */

const calcNPS = (p, n, d) => {
  const t = p + n + d
  if (t === 0) return null
  return ((p - d) / t) * 100
}

const promotoresPara = (p, n, d, target) => {
  const t = p + n + d
  if (t === 0 || target >= 100) return null
  const nps = calcNPS(p, n, d)
  if (nps >= target) return 0
  const x = (target * t / 100 - (p - d)) / (1 - target / 100)
  return Math.max(0, Math.ceil(x - 1e-9))
}

const fmt = (v, dec = 1) => (v === null || isNaN(v) ? '—' : v.toFixed(dec))

const colorNPS = (nps, meta) => {
  if (nps === null) return C.textSoft
  if (nps >= meta) return C.green
  if (nps >= meta - 10) return C.yellow
  return C.red
}

/* ---------- geometría SVG ---------- */

const RAD = Math.PI / 180
const polar = (cx, cy, r, deg) => [cx + r * Math.cos(deg * RAD), cy + r * Math.sin(deg * RAD)]

const arcPath = (cx, cy, r, startDeg, sweep) => {
  if (sweep <= 0) return ''
  const s = Math.min(sweep, 239.99)
  const [x1, y1] = polar(cx, cy, r, startDeg)
  const [x2, y2] = polar(cx, cy, r, startDeg + s)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

const START = 150
const npsToArc = (nps) => Math.max(0, Math.min(240, ((nps + 100) / 200) * 240))

/* ---------- componentes ---------- */

function Gauge({ nps, meta, size = 'lg', titulo }) {
  const cx = 77.5, cy = 77.5, r = 62
  const sw = 13
  const activo = nps === null ? 0 : npsToArc(nps)
  const color = colorNPS(nps, meta)
  const [bx, by] = polar(cx, cy, r, START + 240)
  const width = size === 'lg' ? 220 : 128

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {titulo && (
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{titulo}</div>
      )}
      <svg viewBox="0 0 155 155" width={width} style={{ display: 'block' }}>
        {/* track: 3 zonas */}
        <path d={arcPath(cx, cy, r, START, 204)} stroke={C.trackRed} strokeWidth={sw} fill="none" />
        <path d={arcPath(cx, cy, r, START + 204, 12)} stroke={C.trackYellow} strokeWidth={sw} fill="none" />
        <path d={arcPath(cx, cy, r, START + 216, 24)} stroke={C.trackGreen} strokeWidth={sw} fill="none" />
        {/* arco activo */}
        {activo > 0 && (
          <path
            d={arcPath(cx, cy, r, START, activo)}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* badge estrella fijo en 4:00 */}
        <circle cx={bx} cy={by} r="10" fill="#fff" />
        <circle cx={bx} cy={by} r="8" fill="#475569" />
        <text x={bx} y={by + 3.5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">✦</text>
        {/* centro */}
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fill={C.textSoft} fontWeight="500">
          NPS
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={size === 'lg' ? 30 : 26} fontWeight="800" fill={C.text}>
          {fmt(nps)}
        </text>
        {/* -100 / 100 */}
        <text x="24" y="130" textAnchor="middle" fontSize="10" fill={C.textSoft}>−100</text>
        <text x="131" y="130" textAnchor="middle" fontSize="10" fill={C.textSoft}>100</text>
      </svg>
      <div style={{ fontSize: 12.5, color: C.textSoft, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        <MapPin size={13} /> Objetivo: {meta.toFixed(1)}
      </div>
    </div>
  )
}

function Caras({ p, n, d }) {
  const t = p + n + d
  const pct = (v) => (t === 0 ? '0.0' : ((v / t) * 100).toFixed(1))
  const filas = [
    { Icon: Smile, v: p, color: C.green },
    { Icon: Meh, v: n, color: C.yellow },
    { Icon: Frown, v: d, color: C.red },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
      {filas.map(({ Icon, v, color }, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={22} color={color} strokeWidth={2.2} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {pct(v)} % ({v})
          </span>
        </div>
      ))}
    </div>
  )
}

function StatusBanner({ nps, meta, children }) {
  if (nps === null) return null
  const ok = nps >= meta
  const warn = !ok && nps >= meta - 10
  const crit = !ok && !warn
  const cfg = ok
    ? { bg: '#f0fdf4', border: '#86efac', color: '#166534', Icon: CheckCircle }
    : warn
      ? { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', Icon: AlertTriangle }
      : { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', Icon: XCircle }
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10,
      padding: '10px 14px', fontSize: 13.5, fontWeight: 700, color: cfg.color,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <cfg.Icon size={18} />
      <span>{children}</span>
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 1px 4px rgba(26,63,168,0.08), 0 4px 16px rgba(26,63,168,0.06)',
        padding: '18px 20px',
        position: 'relative',
        ...style,
      }}
    >
      <span style={{ position: 'absolute', top: 12, right: 14, color: '#94a3b8', cursor: 'pointer' }}>
        <MoreVertical size={18} />
      </span>
      {children}
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #eef2f7', fontSize: 11.5, color: C.textSoft }}>
        Los resultados son índices, no porcentajes.
      </div>
    </div>
  )
}

function Input({ label, value, onChange, color }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 90 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value || ''}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '')
          onChange(raw === '' ? 0 : parseInt(raw, 10))
        }}
        style={{
          border: `2px solid ${color}`,
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 16,
          fontWeight: 700,
          color: C.text,
          width: '100%',
          boxSizing: 'border-box',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </label>
  )
}

function TablaProyeccion({ p, n, d, meta, etiqueta }) {
  const t = p + n + d
  if (t === 0) return null
  const incrementos = [1, 5, 10, 15, 20]
  const actual = calcNPS(p, n, d)
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
        Proyección con promotores adicionales{etiqueta ? ` — ${etiqueta}` : ''}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.textSoft, textAlign: 'left' }}>
              <th style={th}>Escenario</th>
              <th style={th}>NPS</th>
              <th style={th}>Δ</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {incrementos.map((k) => {
              const nps = calcNPS(p + k, n, d)
              const c = colorNPS(nps, meta)
              const ok = nps >= meta
              const warn = !ok && nps >= meta - 10
              return (
                <tr key={k} style={{ borderTop: '1px solid #eef2f7' }}>
                  <td style={td}>+{k} promotor{k > 1 ? 'es' : ''}</td>
                  <td style={{ ...td, fontWeight: 700, color: c }}>{fmt(nps)}</td>
                  <td style={td}>+{fmt(nps - actual)}</td>
                  <td style={{ ...td, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {nps >= STRETCH
                      ? <><CheckCircle size={14} color={C.green} /> Objetivo 94</>
                      : ok
                        ? <><CheckCircle size={14} color={C.green} /> Meta mínima</>
                        : warn
                          ? <><AlertTriangle size={14} color={C.yellow} /> Cerca</>
                          : <><XCircle size={14} color={C.red} /> Bajo meta</>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th = { padding: '4px 6px', fontWeight: 600, fontSize: 12 }
const td = { padding: '6px 6px' }

/* ---------- Pantalla 1: Colaborador ---------- */

function PantallaColaborador() {
  const [canal, setCanal] = useState('ventanilla')
  const [p, setP] = useState(0)
  const [n, setN] = useState(0)
  const [d, setD] = useState(0)

  const meta = METAS[canal]
  const meta120 = META_120[canal]
  const nps = calcNPS(p, n, d)
  const falta100 = promotoresPara(p, n, d, meta)
  const falta94 = promotoresPara(p, n, d, STRETCH)
  const falta120 = promotoresPara(p, n, d, meta120)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          NPS Colaborador
        </div>
        <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 12 }}>Mes Actual: NPS</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['ventanilla', 'plataforma'].map((c) => (
            <button
              key={c}
              onClick={() => setCanal(c)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: canal === c ? `2px solid ${C.header}` : '2px solid #dbe3f0',
                background: canal === c ? '#e8edfb' : '#fff',
                color: canal === c ? C.header : C.textSoft,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {c === 'ventanilla' ? 'Ventanilla (meta 80)' : 'Plataforma (meta 82)'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <Input label="Promotores" value={p} onChange={setP} color={C.green} />
          <Input label="Neutros" value={n} onChange={setN} color={C.yellow} />
          <Input label="Detractores" value={d} onChange={setD} color={C.red} />
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Gauge nps={nps} meta={meta} size="lg" />
          <Caras p={p} n={n} d={d} />
        </div>

        {nps !== null && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={pill('#e8edfb', C.header)}>
              {falta100 === 0
                ? <><CheckCircle size={14} style={{ verticalAlign: -2 }} /> Meta mínima ({meta}) alcanzada</>
                : <>Meta mínima {meta}: +{falta100} promotor{falta100 > 1 ? 'es' : ''}</>}
            </div>
            <div style={pill('#f0fdf4', '#166534')}>
              {falta94 === 0
                ? <><CheckCircle size={14} style={{ verticalAlign: -2 }} /> Objetivo 94 alcanzado</>
                : <>Objetivo 94: +{falta94} promotor{falta94 > 1 ? 'es' : ''}</>}
            </div>
            <div style={pill('#fef3e2', '#b45309')}>
              {falta120 === 0
                ? <><CheckCircle size={14} style={{ verticalAlign: -2 }} /> 120% alcanzado</>
                : <>120% ({meta120}): +{falta120} promotor{falta120 > 1 ? 'es' : ''}</>}
            </div>
          </div>
        )}

        <TablaProyeccion p={p} n={n} d={d} meta={meta} />
      </Card>
    </div>
  )
}

const pill = (bg, color) => ({
  background: bg,
  color,
  fontSize: 13,
  fontWeight: 700,
  padding: '8px 14px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
})

/* ---------- Pantalla 2: Agencia ---------- */

function PantallaAgencia() {
  const [v, setV] = useState({ p: 0, n: 0, d: 0 })
  const [pl, setPl] = useState({ p: 0, n: 0, d: 0 })

  const npsV = calcNPS(v.p, v.n, v.d)
  const npsP = calcNPS(pl.p, pl.n, pl.d)
  const npsAg = npsV !== null && npsP !== null ? (npsV + npsP) / 2 : null

  const canalBajo = useMemo(() => {
    if (npsV === null || npsP === null) return null
    if (npsV < npsP) return 'ventanilla'
    if (npsP < npsV) return 'plataforma'
    return METAS.ventanilla - npsV >= METAS.plataforma - npsP ? 'ventanilla' : 'plataforma'
  }, [npsV, npsP])

  const datosBajo = canalBajo === 'ventanilla' ? v : pl
  const metaBajo = canalBajo === 'ventanilla' ? METAS.ventanilla : METAS.plataforma
  const npsOtro = canalBajo === 'ventanilla' ? npsP : npsV
  const npsBajo = canalBajo === 'ventanilla' ? npsV : npsP

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          NPS Agencia PMO
        </div>
        <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 12 }}>Mes Actual: NPS</div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { titulo: 'Ventanilla', st: v, set: setV },
            { titulo: 'Plataforma', st: pl, set: setPl },
          ].map(({ titulo, st, set }) => (
            <div key={titulo} style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.header, marginBottom: 6 }}>{titulo}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input label="Prom." value={st.p} onChange={(x) => set({ ...st, p: x })} color={C.green} />
                <Input label="Neut." value={st.n} onChange={(x) => set({ ...st, n: x })} color={C.yellow} />
                <Input label="Detr." value={st.d} onChange={(x) => set({ ...st, d: x })} color={C.red} />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 14,
            background: '#f6f8fd',
            border: '1px dashed #c3d0ea',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            color: C.textSoft,
            textAlign: 'center',
          }}
        >
          NPS Agencia = (NPS Ventanilla {fmt(npsV)} + NPS Plataforma {fmt(npsP)}) / 2 ={' '}
          <b style={{ color: C.text }}>{fmt(npsAg)}</b> · peso 50/50
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <Gauge nps={npsAg} meta={METAS.agencia} size="sm" titulo="Agencia" />
          <Gauge nps={npsV} meta={METAS.ventanilla} size="sm" titulo="Ventanilla" />
          <Gauge nps={npsP} meta={METAS.plataforma} size="sm" titulo="Plataforma" />
        </div>

        {canalBajo && (
          <div style={{ marginTop: 16 }}>
            <StatusBanner nps={npsBajo} meta={metaBajo}>
              Canal a atacar primero: {canalBajo === 'ventanilla' ? 'Ventanilla' : 'Plataforma'} (
              {fmt(npsBajo)}) — es el más bajo y cada promotor ahí mueve más el promedio de agencia.
            </StatusBanner>
          </div>
        )}

        {canalBajo && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Proyección agregando promotores a {canalBajo === 'ventanilla' ? 'Ventanilla' : 'Plataforma'}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: C.textSoft, textAlign: 'left' }}>
                    <th style={th}>Escenario</th>
                    <th style={th}>NPS canal</th>
                    <th style={th}>NPS Agencia</th>
                    <th style={th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 5, 10, 15, 20].map((k) => {
                    const nuevoCanal = calcNPS(datosBajo.p + k, datosBajo.n, datosBajo.d)
                    const nuevaAg = (nuevoCanal + npsOtro) / 2
                    const c = colorNPS(nuevaAg, METAS.agencia)
                    const ok = nuevaAg >= METAS.agencia
                    const warn = !ok && nuevaAg >= METAS.agencia - 10
                    return (
                      <tr key={k} style={{ borderTop: '1px solid #eef2f7' }}>
                        <td style={td}>+{k} promotor{k > 1 ? 'es' : ''}</td>
                        <td style={td}>{fmt(nuevoCanal)}</td>
                        <td style={{ ...td, fontWeight: 700, color: c }}>{fmt(nuevaAg)}</td>
                        <td style={{ ...td, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {nuevaAg >= STRETCH
                            ? <><CheckCircle size={14} color={C.green} /> Objetivo 94</>
                            : ok
                              ? <><CheckCircle size={14} color={C.green} /> Meta mínima</>
                              : warn
                                ? <><AlertTriangle size={14} color={C.yellow} /> Cerca</>
                                : <><XCircle size={14} color={C.red} /> Bajo meta</>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ---------- App ---------- */

export default function App() {
  const [tab, setTab] = useState('colaborador')

  const tabs = [
    { id: 'colaborador', label: 'Colaborador', Icon: User },
    { id: 'agencia', label: 'Agencia', Icon: Building2 },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: C.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header BCP */}
      <header
        style={{
          background: C.header,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>Agencia Pichanaki</span>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
          Calculadora NPS · 
        </span>
      </header>

      {/* Tabs Medallia */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', gap: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '13px 4px 11px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              color: tab === t.id ? C.header : C.textSoft,
              borderBottom: tab === t.id ? `3px solid ${C.orange}` : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <t.Icon size={16} />
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 40px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        {tab === 'colaborador' ? <PantallaColaborador /> : <PantallaAgencia />}
      </main>

      {/* Footer / watermark */}
      <footer
        style={{
          padding: '16px 20px',
          textAlign: 'center',
          fontSize: 11,
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
          background: '#fff',
          letterSpacing: 0.3,
        }}
      >
        Desarrollado por Jesús Mendoza C. · Guía de Agencia BCP Pichanaki
      </footer>
    </div>
  )
}
