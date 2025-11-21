'use client'

import { MatchSummary } from '../types'
import { useI18n } from '@/lib/i18n'

interface LatestMatchesTableProps {
  matches: MatchSummary[]
}

const statusVariant: Record<string, string> = {
  live: 'border-status-live/30 bg-status-live/10 text-status-live',
  paused: 'border-status-paused/30 bg-status-paused/10 text-status-paused',
  halftime: 'border-status-paused/30 bg-status-paused/10 text-status-paused',
  final: 'border-status-finished/30 bg-status-finished/10 text-status-finished',
  finished: 'border-status-finished/30 bg-status-finished/10 text-status-finished',
  canceled: 'border-disabled/30 bg-disabled/10 text-disabled',
  scheduled: 'border-disabled/30 bg-disabled/10 text-disabled',
  not_started: 'border-disabled/30 bg-disabled/10 text-disabled'
}

export function LatestMatchesTable({ matches }: LatestMatchesTableProps) {
  const { dictionary } = useI18n()

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold text-textPrimary">{dictionary.dashboard.matches.title}</h3>
          <p className="text-sm text-textSecondary">{dictionary.dashboard.matches.description}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-textSecondary">
              <th className="px-4 py-2 font-medium">{dictionary.dashboard.matches.table.date}</th>
              <th className="px-4 py-2 font-medium">{dictionary.dashboard.matches.table.teams}</th>
              <th className="px-4 py-2 font-medium">{dictionary.dashboard.matches.table.score}</th>
              <th className="px-4 py-2 font-medium">{dictionary.dashboard.matches.table.status}</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-t border-borderSoft/60">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-textPrimary">{match.date}</p>
                  <p className="text-xs text-textSecondary">{match.time}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1">
                    <p className="font-semibold text-textPrimary">
                      {match.homeTeam}
                      {match.homeShort && (
                        <span className="ml-1 text-xs uppercase text-textSecondary">({match.homeShort})</span>
                      )}
                    </p>
                    <p className="font-semibold text-textPrimary">
                      {match.awayTeam}
                      {match.awayShort && (
                        <span className="ml-1 text-xs uppercase text-textSecondary">({match.awayShort})</span>
                      )}
                    </p>
                    <p className="text-xs text-textSecondary">
                      {match.competition} • {match.venue ?? '—'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 align-top font-semibold text-textPrimary">{match.score}</td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusVariant[match.status] ?? 'border-borderSoft bg-surface text-textSecondary'}`}
                  >
                    {dictionary.dashboard.status[match.status]}
                  </span>
                  {match.metaSlug && (
                    <span className="mt-1 block text-[10px] uppercase tracking-wide text-textSecondary/70">
                      {match.metaSlug}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
