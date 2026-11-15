import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate, formatScore, OUTCOME_LABEL, OUTCOME_SHORT } from '../lib/format'
import type { MatchSummary } from '../lib/types'

/** Tope de diferencia de gol para el alto de la franja (más que esto, franja completa). */
const CAP = 7

interface Props {
  /** Partidos del más nuevo al más viejo (como vienen de la API). */
  matches: MatchSummary[]
  rivalName: (m: MatchSummary) => string
  tournamentName: (m: MatchSummary) => string
}

/**
 * Toda la historia en bastones: una franja por partido, en orden cronológico.
 * Sube si se ganó, baja si se perdió; el largo es la diferencia de gol.
 * Se recorre con el dedo, el mouse o las flechas del teclado.
 */
export function HistoryStrip({ matches, rivalName, tournamentName }: Props) {
  const list = useMemo(() => [...matches].reverse(), [matches])
  const n = list.length
  const [idx, setIdx] = useState(n - 1)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const years = useMemo(() => {
    const out: { year: number; at: number }[] = []
    list.forEach((m, i) => {
      if (!out.length || out[out.length - 1].year !== m.year) out.push({ year: m.year, at: i })
    })
    return out
  }, [list])

  if (!n) return null
  const cur = list[Math.min(idx, n - 1)]

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const i = Math.floor(((e.clientX - r.left) / r.width) * n)
    setIdx(Math.max(0, Math.min(n - 1, i)))
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1, PageDown: -10, PageUp: 10 }
    if (e.key in step) setIdx((i) => Math.max(0, Math.min(n - 1, i + step[e.key])))
    else if (e.key === 'Home') setIdx(0)
    else if (e.key === 'End') setIdx(n - 1)
    else if (e.key === 'Enter') navigate(`/partidos/${cur.id}`)
    else return
    e.preventDefault()
  }

  const describe = (m: MatchSummary) =>
    `${formatDate(m.date)}, contra ${rivalName(m)}, ${formatScore(m.goalsFor, m.goalsAgainst)}${m.outcome ? `, ${OUTCOME_LABEL[m.outcome].toLowerCase()}` : ''}`

  return (
    <>
      <div
        ref={ref}
        className="strip"
        role="slider"
        tabIndex={0}
        aria-label="Partido de la historia"
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={idx + 1}
        aria-valuetext={describe(cur)}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'mouse') pick(e)
        }}
      >
        <svg viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" aria-hidden="true">
          {years.slice(1).map((y) => (
            <line key={y.year} className="yr" x1={y.at} x2={y.at} y1={0} y2={100} />
          ))}
          <rect className="cursor" x={idx} y={0} width={1} height={100} opacity={0.14} />
          <g className="strip-bars">
            {list.map((m, i) => {
              const gd = m.goalsFor != null && m.goalsAgainst != null ? m.goalsFor - m.goalsAgainst : null
              const o = m.outcome
              let y = 47
              let h = 6
              if (o === 'V' || o === 'D') {
                const size = 8 + (Math.min(Math.abs(gd ?? 1), CAP) / CAP) * 40
                h = size
                y = o === 'V' ? 50 - size : 50
              }
              return (
                <rect
                  key={m.id}
                  className={o ? `bar-${o}` : 'bar-x'}
                  x={i + 0.14}
                  y={y}
                  width={0.72}
                  height={h}
                  opacity={i === idx ? 1 : 0.88}
                />
              )
            })}
          </g>
          <line className="base" x1={0} x2={n} y1={50} y2={50} />
        </svg>
      </div>
      <div className="strip-years" aria-hidden="true">
        {years.map((y, k) => {
          const next = years[k + 1]?.at ?? n
          if ((next - y.at) / n < 0.06) return null
          return (
            <span key={y.year} style={{ left: `${(y.at / n) * 100}%` }}>
              {y.year}
            </span>
          )
        })}
      </div>

      <p className="strip-legend" aria-hidden="true">
        <span><i style={{ background: 'var(--stripe-win)' }} />Victoria</span>
        <span><i style={{ background: 'var(--stripe-draw)', height: 4 }} />Empate</span>
        <span><i style={{ background: 'var(--stripe-loss)' }} />Derrota</span>
      </p>

      <Link to={`/partidos/${cur.id}`} className={`reading${cur.outcome ? ` o-${cur.outcome}` : ''}`} aria-live="polite">
        <span className="row-main">
          <span className="muted small tabular">
            {idx === n - 1 ? `Último partido, ${formatDate(cur.date)}` : `Partido ${idx + 1} de ${n}, ${formatDate(cur.date)}`}
          </span>
          <span className="reading-rival">vs {rivalName(cur)}</span>
          <span className="muted small">{tournamentName(cur)}</span>
        </span>
        <span className="reading-score tabular">
          {formatScore(cur.goalsFor, cur.goalsAgainst)}
          {cur.outcome && (
            <span className={`match-row-outcome o-${cur.outcome}`}>
              {' '}
              <span aria-hidden="true">{OUTCOME_SHORT[cur.outcome]}</span>
            </span>
          )}
        </span>
      </Link>
    </>
  )
}
