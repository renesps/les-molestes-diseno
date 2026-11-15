import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { computeRecord } from '../lib/stats'
import type { MatchSummary } from '../lib/types'

interface Props {
  /** Partidos del más nuevo al más viejo (como vienen de la API). */
  matches: MatchSummary[]
}

/**
 * La historia en bastones, un bastón por temporada.
 * Hacia arriba, los partidos ganados; hacia abajo, los perdidos; en el medio, en oro, los empates.
 * Al tocar un año aparece el detalle de esa temporada, partido por partido.
 */
export function HistoryStrip({ matches }: Props) {
  const seasons = useMemo(() => {
    const byYear = new Map<number, MatchSummary[]>()
    for (const m of [...matches].reverse()) byYear.set(m.year, [...(byYear.get(m.year) ?? []), m])
    return Array.from(byYear.entries()).map(([year, ms]) => ({ year, ms, r: computeRecord(ms) }))
  }, [matches])
  const [year, setYear] = useState(seasons[seasons.length - 1]?.year)
  if (!seasons.length) return null

  const max = Math.max(...seasons.map((s) => Math.max(s.r.won, s.r.lost)), 1)
  const cur = seasons.find((s) => s.year === year) ?? seasons[seasons.length - 1]
  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <>
      <div className="seasons" role="group" aria-label="Temporadas">
        {seasons.map(({ year: y, r }) => (
          <button
            key={y}
            type="button"
            className={`season${y === cur.year ? ' is-on' : ''}`}
            aria-pressed={y === cur.year}
            onClick={() => setYear(y)}
          >
            <span className="visually-hidden">{`${y}: ${r.won} ganados, ${r.drawn} empatados, ${r.lost} perdidos`}</span>
            <span className="season-up" aria-hidden="true">
              <span className="season-bar bar-V" style={{ height: pct(r.won) }} />
            </span>
            <span className="season-draw" aria-hidden="true" style={{ opacity: r.drawn ? 1 : 0 }}>
              {r.drawn || ''}
            </span>
            <span className="season-down" aria-hidden="true">
              <span className="season-bar bar-D" style={{ height: pct(r.lost) }} />
            </span>
            <span className="season-year" aria-hidden="true">{String(y).slice(2)}</span>
          </button>
        ))}
      </div>
      <p className="strip-legend" aria-hidden="true">
        <span><i style={{ background: 'var(--stripe-win)' }} />Ganados</span>
        <span><i className="dot" style={{ background: 'var(--stripe-draw)' }} />Empatados</span>
        <span><i style={{ background: 'var(--stripe-loss)' }} />Perdidos</span>
      </p>

      <section className="season-detail" aria-live="polite" aria-label={`Temporada ${cur.year}`}>
        <div className="season-head">
          <p className="season-title">{cur.year}</p>
          <p className="season-record tabular">
            <span>{cur.r.played} jugados</span>
            <span className="t-win">{cur.r.won} ganados</span>
            <span className="t-draw">{cur.r.drawn} empatados</span>
            <span className="t-loss">{cur.r.lost} perdidos</span>
          </p>
        </div>
        <div className="season-matches" aria-hidden="true">
          {cur.ms.map((m) => (
            <span key={m.id} className={`season-match ${m.outcome ? `bar-${m.outcome}` : 'bar-x'}`} />
          ))}
        </div>
        <Link to={`/partidos?y=${cur.year}`} className="btn btn-soft btn-block">
          Ver los {cur.r.played} partidos de {cur.year}
        </Link>
      </section>
    </>
  )
}
