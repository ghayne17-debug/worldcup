import { createClient } from '@/lib/supabase/server'
import { registerParticipant } from '@/lib/actions'
import { redirect } from 'next/navigation'

type Team = {
  id: number
  name: string
  group_name: string
  flag_emoji: string
  current_stage: string
  is_eliminated: boolean
}

type Participant = {
  display_name: string
  teams_wanted: number
  teams_paid: number
  is_paid: boolean
}

type DrawConfig = {
  is_drawn: boolean
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: participantRaw },
    { data: drawConfigRaw },
    { data: myTeamsRaw },
  ] = await Promise.all([
    supabase.from('participants').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('draw_config').select('*').single(),
    supabase.from('teams').select('*').eq('owner_user_id', user.id).order('group_name'),
  ])

  const participant = participantRaw as Participant | null
  const drawConfig = drawConfigRaw as DrawConfig | null
  const myTeams = (myTeamsRaw as Team[]) || []
  const isDrawn = drawConfig?.is_drawn ?? false
  const displayName =
    (user.user_metadata?.display_name as string) || user.email!.split('@')[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white">
          G&apos;day, <span className="text-amber-400">{displayName}</span> 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">{user.email}</p>
      </div>

      {/* Registration card */}
      <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Your Entry</h2>

        {!participant ? (
          <>
            <p className="text-slate-400 text-sm mb-4">
              You haven&apos;t registered yet. Tell us how many teams you want in the draw — each costs{' '}
              <span className="text-amber-400 font-bold">$10</span>. Pay via <span className="text-white font-semibold">PayID to Greg</span> using the description <span className="text-amber-400 font-semibold">&quot;World Cup - your favourite Cereal&quot;</span>
            </p>
            <form action={registerParticipant} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="teams_wanted" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Number of Teams
                </label>
                <select
                  id="teams_wanted"
                  name="teams_wanted"
                  defaultValue="1"
                  className="w-full bg-[#050a14] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/60 transition-colors cursor-pointer"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} team{n !== 1 ? 's' : ''} — ${n * 20}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  Register →
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#050a14] rounded-xl p-4 border border-[#1e3a5f]/60">
                <div className="text-2xl font-black text-white">{participant.teams_wanted}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Teams Wanted</div>
              </div>
              <div className="bg-[#050a14] rounded-xl p-4 border border-[#1e3a5f]/60">
                <div className="text-2xl font-black text-white">${participant.teams_wanted * 10}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Amount</div>
              </div>
              <div className="bg-[#050a14] rounded-xl p-4 border border-[#1e3a5f]/60">
                <div className={`text-lg font-black ${participant.is_paid ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {participant.is_paid ? '✓ Paid' : '⏳ Pending'}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Payment</div>
              </div>
            </div>

            {!participant.is_paid && (
              <div className="rounded-xl bg-orange-950/40 border border-orange-800/40 px-4 py-3 text-sm text-orange-300 space-y-1">
                <div>💳 Payment pending — send <span className="font-bold">${participant.teams_wanted * 10}</span> via <span className="text-white font-semibold">PayID to Greg</span></div>
                <div className="text-orange-400/70">Description: <span className="text-amber-400 font-semibold">&quot;World Cup - your favourite Cereal&quot;</span> 🥣</div>
              </div>
            )}

            {/* Update teams wanted if not yet drawn */}
            {!isDrawn && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Want to change your team count?</p>
                <form action={registerParticipant} className="flex gap-3">
                  <select
                    name="teams_wanted"
                    defaultValue={participant.teams_wanted}
                    className="bg-[#050a14] border border-[#1e3a5f] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} team{n !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl border border-[#1e3a5f] text-slate-300 hover:text-white hover:border-slate-500 text-sm transition-colors cursor-pointer"
                  >
                    Update
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* My allocated teams */}
      {isDrawn && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Your Teams{' '}
            <span className="text-slate-500 text-base font-normal">({myTeams.length})</span>
          </h2>

          {myTeams.length === 0 ? (
            <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">😬</div>
              <p className="text-slate-400">
                {participant?.is_paid
                  ? 'No teams were allocated to you. Contact the organiser.'
                  : 'You weren\'t marked as paid before the draw.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTeams.map(team => (
                <div
                  key={team.id}
                  className={`rounded-2xl border p-5 ${
                    team.is_eliminated
                      ? 'bg-slate-900/40 border-slate-800/50 opacity-70'
                      : team.current_stage === 'Champion!'
                      ? 'bg-amber-950/40 border-amber-600/50'
                      : 'bg-[#0d1a2d] border-[#1e3a5f]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{team.flag_emoji}</span>
                    <div>
                      <div className="font-black text-lg text-white">{team.name}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest">
                        Group {team.group_name}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${stageColor(team.current_stage, team.is_eliminated)}`}>
                    {stageIcon(team.current_stage, team.is_eliminated)}{' '}
                    {team.is_eliminated ? `Eliminated — ${team.current_stage}` : team.current_stage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isDrawn && participant && (
        <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🎰</div>
          <h3 className="font-bold text-white mb-1">Draw hasn&apos;t happened yet</h3>
          <p className="text-slate-500 text-sm">
            Once everyone is registered and paid, the organiser will trigger the random draw.
            Your teams will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
