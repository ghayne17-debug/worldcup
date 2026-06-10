import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { markAsPaid, markAsUnpaid, triggerDraw, resetDraw, adminUpdateSlots } from '@/lib/actions'

type Participant = {
  user_id: string
  display_name: string
  email: string
  teams_wanted: number
  teams_paid: number
  is_paid: boolean
  created_at: string
}

type Team = {
  id: number
  name: string
  group_name: string
  flag_emoji: string
  owner_name: string | null
  current_stage: string
  is_eliminated: boolean
}

type DrawConfig = {
  is_drawn: boolean
  drawn_at: string | null
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'ghayne17@gmail.com') redirect('/')

  const [
    { data: participantsRaw },
    { data: drawConfigRaw },
  ] = await Promise.all([
    supabase.from('participants').select('*').order('created_at'),
    supabase.from('draw_config').select('*').single(),
  ])

  const participants = (participantsRaw as Participant[]) || []
  const drawConfig = drawConfigRaw as DrawConfig | null
  const isDrawn = drawConfig?.is_drawn ?? false

  const totalPaid = participants.filter(p => p.is_paid).length
  const totalSlots = participants.reduce((s, p) => s + (p.is_paid ? p.teams_paid : 0), 0)
  const poolValue = totalSlots * 10

  // Group teams by group letter (unused after split but kept for type safety)
  const groups: Record<string, Team[]> = {}
  for (const team of [] as Team[]) {
    if (!groups[team.group_name]) groups[team.group_name] = []
    groups[team.group_name].push(team)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">⚙️</span>
        <div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-slate-500 text-xs">World Cup 2026 Calcutta Draw</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Registered', value: participants.length },
          { label: 'Paid', value: totalPaid },
          { label: 'Team Slots', value: `${totalSlots} / 48` },
          { label: 'Pool', value: `$${poolValue}` },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-xl p-4">
            <div className="text-2xl font-black text-amber-400">{stat.value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Draw control */}
      <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Draw Control</h2>

        {!isDrawn ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-slate-400 text-sm">
                {totalPaid} paid participant{totalPaid !== 1 ? 's' : ''} with {totalSlots} team slot{totalSlots !== 1 ? 's' : ''}.
                Once everyone is locked in, trigger the random draw.
              </p>
              {totalSlots > 48 && (
                <p className="text-orange-400 text-xs mt-1">
                  ⚠️ {totalSlots - 48} too many slots — only 48 teams available. Adjust paid teams.
                </p>
              )}
            </div>
            <form action={triggerDraw}>
              <button
                type="submit"
                disabled={totalSlots === 0}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                🎰 Trigger Draw
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="text-emerald-400 font-bold">✓ Draw Complete</div>
              {drawConfig?.drawn_at && (
                <p className="text-slate-500 text-xs mt-1">
                  {new Date(drawConfig.drawn_at).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short' })}
                </p>
              )}
            </div>
            <form action={resetDraw}>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl border border-red-800/50 text-red-400 hover:bg-red-950/40 text-sm transition-colors cursor-pointer"
              >
                Reset Draw
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Participants</h2>

        {participants.length === 0 ? (
          <p className="text-slate-500 text-sm">No one has registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-[#1e3a5f]">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4 text-right">Teams</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a5f]/50">
                {participants.map(p => (
                  <tr key={p.user_id} className="group">
                    <td className="py-3 pr-4 font-semibold text-white">{p.display_name}</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{p.email}</td>
                    <td className="py-3 pr-4 text-right">
                      <form action={adminUpdateSlots} className="inline-flex items-center gap-1 justify-end">
                        <input type="hidden" name="user_id" value={p.user_id} />
                        <input
                          type="number"
                          name="slots"
                          defaultValue={p.teams_wanted}
                          min={1}
                          max={20}
                          className="w-12 bg-[#050a14] border border-[#1e3a5f] rounded px-1.5 py-1 text-white text-xs text-center focus:outline-none focus:border-amber-500/60"
                        />
                        <button type="submit" className="text-xs px-2 py-1 rounded bg-[#1e3a5f] hover:bg-[#2a4f7a] text-slate-300 transition-colors cursor-pointer">
                          ✓
                        </button>
                      </form>
                    </td>
                    <td className="py-3 pr-4 text-right text-amber-400 font-bold">${p.teams_wanted * 10}</td>
                    <td className="py-3 text-right">
                      {p.is_paid ? (
                        <form action={markAsUnpaid} className="inline">
                          <input type="hidden" name="user_id" value={p.user_id} />
                          <button
                            type="submit"
                            className="text-xs px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 hover:bg-red-950/40 hover:text-red-400 hover:border-red-800/50 transition-colors cursor-pointer"
                          >
                            ✓ Paid ({p.teams_paid})
                          </button>
                        </form>
                      ) : (
                        <form action={markAsPaid} className="inline">
                          <input type="hidden" name="user_id" value={p.user_id} />
                          <input type="hidden" name="teams_wanted" value={p.teams_wanted} />
                          <button
                            type="submit"
                            className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:bg-emerald-900/60 hover:text-emerald-400 hover:border-emerald-700/50 transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDrawn && (
        <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Team Progress</h2>
            <p className="text-slate-500 text-xs mt-1">Update stages and eliminations as the tournament progresses.</p>
          </div>
          <a
            href="/admin/teams"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
          >
            Manage Teams →
          </a>
        </div>
      )}
    </div>
  )
}
