import { useState, useMemo } from 'react'

/* ============================================================
   CALCULADORA NPS — BCP PICHANAKI
   Réplica visual del gauge de Medallia.

   GEOMETRÍA DEL GAUGE (corregida y consistente):
   - Centro (77.5, 77.5), radio 62 (viewBox 155x162)
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
const META_120 = { ventanilla: 96, plataforma: 98, agencia: 97 }

/* ---------- matemática ---------- */

const calcNPS = (p, n, d) => {
  const t = p + n + d
  if (t === 0) return null
  return ((p - d) / t) * 100
}

// Mínimo de encuestas promotoras adicionales para alcanzar `target`
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

const START = 150 // SVG 150° = 8:00
const npsToArc = (nps) => Math.max(0, Math.min(240, ((nps + 100) / 200) * 240))

/* ---------- componentes ---------- */

function Gauge({ nps, meta, size = 'lg', titulo }) {
  const cx = 77.5, cy = 77.5, r = 62
  const sw = 13
  const activo = nps === null ? 0 : npsToArc(nps)
  const color = colorNPS(nps, meta)
  const [bx, by] = polar(cx, cy, r, START + 240) // badge ✦ fijo en 4:00 → (131.2, 108.5)
  const width = size === 'lg' ? 220 : 128

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {titulo && (
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{titulo}</div>
      )}
      <svg viewBox="0 0 155 162" width={width} style={{ display: 'block' }}>
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
        {/* badge ✦ fijo en 4:00 */}
        <circle cx={bx} cy={by} r="10" fill="#fff" />
        <circle cx={bx} cy={by} r="8" fill="#475569" />
        <text x={bx} y={by + 3.5} textAnchor="middle" fontSize="10" fill="#fff">✦</text>
        {/* centro */}
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fill={C.textSoft} fontWeight="500">
          NPS
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={size === 'lg' ? 30 : 26} fontWeight="800" fill={C.text}>
          {fmt(nps)}
        </text>
        {/* -100 / 100 en los extremos del gap */}
        <text x="24" y="130" textAnchor="middle" fontSize="10" fill={C.textSoft}>−100</text>
        <text x="131" y="130" textAnchor="middle" fontSize="10" fill={C.textSoft}>100</text>
      </svg>
      <div style={{ fontSize: 12.5, color: C.textSoft, marginTop: 2 }}>
        📍 Objetivo: {meta.toFixed(1)}
      </div>
    </div>
  )
}

function Caras({ p, n, d }) {
  const t = p + n + d
  const pct = (v) => (t === 0 ? '0.0' : ((v / t) * 100).toFixed(1))
  const filas = [
    { icon: '😊', v: p, color: C.green },
    { icon: '😐', v: n, color: C.yellow },
    { icon: '☹️', v: d, color: C.red },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
      {filas.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{f.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {pct(f.v)} % ({f.v})
          </span>
        </div>
      ))}
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
      <span style={{ position: 'absolute', top: 12, right: 14, color: '#94a3b8', fontSize: 18, letterSpacing: 1 }}>⋮</span>
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
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
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
            return (
              <tr key={k} style={{ borderTop: '1px solid #eef2f7' }}>
                <td style={td}>+{k} promotor{k > 1 ? 'es' : ''}</td>
                <td style={{ ...td, fontWeight: 700, color: c }}>{fmt(nps)}</td>
                <td style={td}>+{fmt(nps - actual)}</td>
                <td style={td}>
                  {nps >= meta ? '✅ Meta' : nps >= meta - 10 ? '🟡 Cerca' : '🔴 Bajo meta'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
  const falta120 = promotoresPara(p, n, d, meta120)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          NPS Colaborador
        </div>
        <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 12 }}>Mes Actual: NPS</div>

        {/* selector de canal */}
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

        {/* inputs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <Input label="Promotores" value={p} onChange={setP} color={C.green} />
          <Input label="Neutros" value={n} onChange={setN} color={C.yellow} />
          <Input label="Detractores" value={d} onChange={setD} color={C.red} />
        </div>

        {/* gauge + caras */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Gauge nps={nps} meta={meta} size="lg" />
          <Caras p={p} n={n} d={d} />
        </div>

        {/* faltantes */}
        {nps !== null && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={pill('#e8edfb', C.header)}>
              {falta100 === 0
                ? '✅ Meta (100%) alcanzada'
                : `Para meta ${meta} (100%): +${falta100} promotor${falta100 > 1 ? 'es' : ''}`}
            </div>
            <div style={pill('#fef3e2', '#b45309')}>
              {falta120 === 0
                ? '🏆 120% alcanzado'
                : `Para ${meta120} (120%): +${falta120} promotor${falta120 > 1 ? 'es' : ''}`}
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
})

/* ---------- Pantalla 2: Agencia ---------- */

function PantallaAgencia() {
  const [v, setV] = useState({ p: 0, n: 0, d: 0 })
  const [pl, setPl] = useState({ p: 0, n: 0, d: 0 })

  const npsV = calcNPS(v.p, v.n, v.d)
  const npsP = calcNPS(pl.p, pl.n, pl.d)
  const npsAg = npsV !== null && npsP !== null ? (npsV + npsP) / 2 : null

  // canal a atacar: el de NPS más bajo; en empate, el de mayor brecha contra su meta
  const canalBajo = useMemo(() => {
    if (npsV === null || npsP === null) return null
    if (npsV < npsP) return 'ventanilla'
    if (npsP < npsV) return 'plataforma'
    return METAS.ventanilla - npsV >= METAS.plataforma - npsP ? 'ventanilla' : 'plataforma'
  }, [npsV, npsP])

  const datosBajo = canalBajo === 'ventanilla' ? v : pl
  const npsOtro = canalBajo === 'ventanilla' ? npsP : npsV

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          NPS Agencia PMO
        </div>
        <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 12 }}>Mes Actual: NPS</div>

        {/* inputs por canal */}
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

        {/* fórmula 50/50 */}
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
          <b style={{ color: C.text }}>{fmt(npsAg)}</b> &nbsp;·&nbsp; peso 50/50
        </div>

        {/* tres gauges */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <Gauge nps={npsAg} meta={METAS.agencia} size="sm" titulo="Agencia" />
          <Gauge nps={npsV} meta={METAS.ventanilla} size="sm" titulo="Ventanilla" />
          <Gauge nps={npsP} meta={METAS.plataforma} size="sm" titulo="Plataforma" />
        </div>

        {/* banner canal a atacar */}
        {canalBajo && (
          <div
            style={{
              marginTop: 16,
              background: '#fff7ed',
              border: `1px solid ${C.orange}`,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13.5,
              fontWeight: 700,
              color: '#9a3412',
            }}
          >
            🎯 Canal a atacar primero: {canalBajo === 'ventanilla' ? 'Ventanilla' : 'Plataforma'} (
            {fmt(canalBajo === 'ventanilla' ? npsV : npsP)}) — es el más bajo y cada promotor ahí mueve más el
            promedio de agencia.
          </div>
        )}

        {/* proyección sobre el canal más bajo */}
        {canalBajo && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Proyección agregando promotores a {canalBajo === 'ventanilla' ? 'Ventanilla' : 'Plataforma'}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: C.textSoft, textAlign: 'left' }}>
                  <th style={th}>Escenario</th>
                  <th style={th}>NPS canal</th>
                  <th style={th}>NPS Agencia</th>
                  <th style={th}>Estado agencia</th>
                </tr>
              </thead>
              <tbody>
                {[1, 5, 10, 15, 20].map((k) => {
                  const nuevoCanal = calcNPS(datosBajo.p + k, datosBajo.n, datosBajo.d)
                  const nuevaAg = (nuevoCanal + npsOtro) / 2
                  const c = colorNPS(nuevaAg, METAS.agencia)
                  return (
                    <tr key={k} style={{ borderTop: '1px solid #eef2f7' }}>
                      <td style={td}>+{k} promotor{k > 1 ? 'es' : ''}</td>
                      <td style={td}>{fmt(nuevoCanal)}</td>
                      <td style={{ ...td, fontWeight: 700, color: c }}>{fmt(nuevaAg)}</td>
                      <td style={td}>
                        {nuevaAg >= METAS.agencia ? '✅ Meta' : nuevaAg >= METAS.agencia - 10 ? '🟡 Cerca' : '🔴 Bajo meta'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ---------- App ---------- */

export default function App() {
  const [tab, setTab] = useState('colaborador')

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: C.text,
      }}
    >
      {/* Header BCP */}
      <header
        style={{
          background: C.header,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span style={{ color: C.orange, fontWeight: 800, fontSize: 22, letterSpacing: -1 }}>›BCP›</span>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
          Calculadora NPS · Agencia Pichanaki
        </span>
      </header>

      {/* Tabs estilo Medallia */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', gap: 24 }}>
        {[
          { id: 'colaborador', label: 'Colaborador' },
          { id: 'agencia', label: 'Agencia' },
        ].map((t) => (
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
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 40px' }}>
        {tab === 'colaborador' ? <PantallaColaborador /> : <PantallaAgencia />}
      </main>
    </div>
  )
}
