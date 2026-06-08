import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Team = {
  id: number
  name: string
  group_name: string
  flag_emoji: string
  owner_name: string | null
  current_stage: string
  is_eliminated: boolean
}

type Participant = {
  display_name: string
  teams_wanted: number
  is_paid: boolean
}

type DrawConfig = {
  is_drawn: boolean
  drawn_at: string | null
}

function stageColor(stage: string, eliminated: boolean) {
  if (eliminated) return 'text-red-500'
  if (stage === 'Champion!') return 'text-amber-400'
  if (stage === 'Final') return 'text-purple-400'
  if (stage === 'Semi-final') return 'text-blue-400'
  if (stage === 'Quarter-final') return 'text-cyan-400'
  if (stage === 'Round of 16' || stage === 'Round of 32') return 'text-green-400'
  return 'text-slate-400'
}

function stageIcon(stage: string, eliminated: boolean) {
  if (eliminated) return '❌'
  if (stage === 'Champion!') return '🏆'
  if (stage === 'Final') return '🥇'
  if (stage === 'Semi-final') return '⭐'
  if (stage === 'Quarter-final') return '🔥'
  if (stage === 'Round of 16' || stage === 'Round of 32') return '✅'
  return '🟡'
}

function TeamCard({ team, isDrawn }: { team: Team; isDrawn: boolean }) {
  const eliminated = team.is_eliminated
  return (
    <div className={`team-card ${eliminated ? 'team-card-eliminated' : ''} rounded-xl border p-4 flex flex-col gap-2 ${
      eliminated
        ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
        : 'bg-[#0d1a2d] border-[#1e3a5f]'
    }`}>
      <div className="flex items-start justify-between">
        <span className="text-3xl leading-none">{team.flag_emoji}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1e3a5f]/60 text-slate-400 uppercase tracking-widest">
          Grp {team.group_name}
        </span>
      </div>
      <div>
        <div className="font-bold text-sm text-white leading-tight">{team.name}</div>
        {isDrawn ? (
          <div className="text-xs text-slate-400 mt-0.5 truncate">
            {team.owner_name ? (
              <span className="text-amber-400/80">{team.owner_name}</span>
            ) : (
              <span className="text-slate-600 italic">Unallocated</span>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-600 italic mt-0.5">Draw pending...</div>
        )}
      </div>
      {isDrawn && (
        <div className={`text-xs font-medium mt-auto ${stageColor(team.current_stage, eliminated)}`}>
          {stageIcon(team.current_stage, eliminated)}{' '}
          {eliminated ? `Out (${team.current_stage})` : team.current_stage}
        </div>
      )}
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: drawConfig },
    { data: teamsRaw },
    { data: participantsRaw },
  ] = await Promise.all([
    supabase.from('draw_config').select('*').single(),
    supabase.from('teams').select('*').order('group_name').order('id'),
    supabase.from('participants').select('display_name, teams_wanted, is_paid').order('created_at'),
  ])

  const config = drawConfig as DrawConfig | null
  const teams = (teamsRaw as Team[]) || []
  const participants = (participantsRaw as Participant[]) || []

  const isDrawn = config?.is_drawn ?? false
  const totalRegistered = participants.length
  const totalPaid = participants.filter(p => p.is_paid).length
  const teamsClaimed = participants.reduce((sum, p) => sum + (p.is_paid ? p.teams_wanted : 0), 0)
  const teamsWantedTotal = participants.reduce((sum, p) => sum + p.teams_wanted, 0)
  const poolValue = teamsClaimed * 20

  const groups: Record<string, Team[]> = {}
  for (const team of teams) {
    if (!groups[team.group_name]) groups[team.group_name] = []
    groups[team.group_name].push(team)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hex-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-[#050a14]" />
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="float-ball text-7xl sm:text-8xl mb-6">⚽</div>

          <p className="text-slate-400 uppercase tracking-[0.3em] text-xs sm:text-sm font-semibold mb-2">
            FIFA World Cup 2026 · Canada · Mexico · USA
          </p>

          <h1 className="glow-text text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-amber-400 mb-4">
            Barmen Calcutta
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-xl mx-auto mb-3">
            48 teams. Random draw. One champion. Track your teams through the tournament.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Tournament kicks off{' '}
            <span className="text-white font-semibold">13 June 2026</span>
          </p>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-10">
            {[
              { label: 'Registered', value: totalRegistered },
              { label: 'Paid In', value: totalPaid },
              { label: 'Teams Claimed', value: `${teamsClaimed} / 48` },
              { label: 'Pool Value', value: `$${poolValue}` },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wide transition-all hover:scale-105 text-sm"
            >
              Join the Draw →
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 rounded-xl border border-[#1e3a5f] hover:border-amber-500/40 text-slate-300 hover:text-white transition-all text-sm"
            >
              My Teams
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">

        {/* Prizes */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-1 text-center">Prize Money</h2>
          <p className="text-slate-500 text-xs text-center mb-6">
            Based on all 48 teams sold ($960 pool) — will be re-jigged at the draw if not all sold
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { place: '1st', icon: '🥇', amount: '$460', color: 'from-amber-500/20 to-amber-600/5 border-amber-500/40 text-amber-400' },
              { place: '2nd', icon: '🥈', amount: '$300', color: 'from-slate-400/20 to-slate-500/5 border-slate-400/40 text-slate-300' },
              { place: '3rd', icon: '🥉', amount: '$125', color: 'from-orange-700/20 to-orange-800/5 border-orange-700/40 text-orange-400' },
              { place: '4th', icon: '🏅', amount: '$75',  color: 'from-blue-600/20 to-blue-700/5 border-blue-600/40 text-blue-400' },
            ].map(prize => (
              <div key={prize.place} className={`bg-gradient-to-b ${prize.color} border rounded-2xl p-5 text-center`}>
                <div className="text-4xl mb-2">{prize.icon}</div>
                <div className={`text-2xl font-black ${prize.color.split(' ').pop()}`}>{prize.amount}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{prize.place} Place</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pre-draw entrants list */}
        {!isDrawn && participants.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white mb-1">Entrants</h2>
            <p className="text-slate-500 text-sm mb-6">
              {teamsWantedTotal} team slot{teamsWantedTotal !== 1 ? 's' : ''} requested across{' '}
              {totalRegistered} player{totalRegistered !== 1 ? 's' : ''} — draw happens when the admin is ready.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {participants.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#0d1a2d] border border-[#1e3a5f] rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-white">{p.display_name}</div>
                    <div className="text-xs text-slate-500">
                      {p.teams_wanted} team{p.teams_wanted !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.is_paid
                        ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {p.is_paid ? '✓ Paid' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team grid */}
        {teams.length > 0 && (
          <section>
            {isDrawn ? (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🎉</span>
                  <h2 className="text-2xl font-black text-white">The Draw is Done!</h2>
                </div>
                {config?.drawn_at && (
                  <p className="text-slate-500 text-sm">
                    Drawn{' '}
                    {new Date(config.drawn_at).toLocaleString('en-AU', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-1">All 48 Teams</h2>
                <p className="text-slate-500 text-sm">
                  Teams will be randomly allocated once the draw is triggered.
                </p>
              </div>
            )}

            {Object.entries(groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, groupTeams]) => (
                <div key={group} className="mb-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-3">
                    ── Group {group}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {groupTeams.map(team => (
                      <TeamCard key={team.id} team={team} isDrawn={isDrawn} />
                    ))}
                  </div>
                </div>
              ))}
          </section>
        )}

        {teams.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <div className="text-6xl mb-4">⚙️</div>
            <p>Run the Supabase schema SQL to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
