import { Link } from 'react-router-dom'
import { HistoryStrip } from '../components/HistoryStrip'
import { Page } from '../components/Page'
import { Async } from '../components/States'
import { IconChevron } from '../components/Icons'
import { api, useData } from '../lib/data'
import { formatDate, goalDiff, winRate } from '../lib/format'

const CLUB = 'Club Social y Deportivo Les Molestes'

const sinceFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

export default function Home() {
  const state = useData(
    () => Promise.all([api.stats(), api.matches(), api.teams(), api.titles()]),
    [],
  )
  return (
    <Page title={CLUB} hideTitle>
      <Async state={state}>
        {([stats, matches, teams, titles]) => {
          const o = stats.overall
          const lastVideo = matches.find((m) => m.videoGoals > 0)
          const first = matches[matches.length - 1]
          const teamName = new Map(teams.map((t) => [t.id, t.name]))
                    const top = stats.rankings.scorers[0]
          return (
            <>
              <header className="club">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Escudo de Les Molestes" width="112" height="168" />
                <p className="hero-name">Club Social y Deportivo Les Molestes</p>
                <p className="club-since">
                  {o.played} partidos de fútbol amateur
                  {first ? ` desde ${sinceFmt.format(new Date(first.date))}` : ''}.
                </p>
              </header>

              <section className="history" aria-labelledby="h-history">
                <h2 className="section-title" id="h-history">Toda la historia</h2>
                <p className="history-intro muted small">
                  Un bastón por temporada: hacia arriba los partidos ganados, hacia abajo los perdidos. Tocá un año para ver
                  su detalle.
                </p>
                <HistoryStrip matches={matches} />
              </section>

              <h2 className="section-title">Récord histórico</h2>
              <div className="card">
                <dl className="record tabular">
                  <div><dt>Jugados</dt><dd>{o.played}</dd></div>
                  <div className="win"><dt>Ganados</dt><dd>{o.won}</dd></div>
                  <div className="draw"><dt>Empatados</dt><dd>{o.drawn}</dd></div>
                  <div className="loss"><dt>Perdidos</dt><dd>{o.lost}</dd></div>
                </dl>
                <p className="record-goals tabular">
                  <span>{o.goalsFor} goles a favor</span>
                  <span>{o.goalsAgainst} en contra</span>
                  <span>({goalDiff(o)})</span>
                </p>
                <p className="muted small">Ganamos el {winRate(o)} % de los partidos.</p>
              </div>

              <ul className="list shortcuts" aria-label="Accesos rápidos">
                {top && (
                  <li>
                    <Link to="/estadisticas" className="row">
                      <span className="row-main">
                        <span>Goleadores</span>
                        <span className="muted small">{top.name} lleva {top.value} goles</span>
                      </span>
                      <IconChevron />
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/titulos" className="row">
                    <span className="row-main">
                      <span>Títulos</span>
                      <span className="small accent">{'★'.repeat(titles.length)} {titles.map((t) => t.label).join(', ')}</span>
                    </span>
                    <IconChevron />
                  </Link>
                </li>
                {lastVideo && (
                  <li>
                    <Link to={`/partidos/${lastVideo.id}`} className="row">
                      <span className="row-main">
                        <span>Último gol en video</span>
                        <span className="muted small">
                          {formatDate(lastVideo.date)} contra {teamName.get(lastVideo.rivalId) ?? 'rival sin dato'}
                        </span>
                      </span>
                      <IconChevron />
                    </Link>
                  </li>
                )}
              </ul>
            </>
          )
        }}
      </Async>
    </Page>
  )
}
