import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateTeamStage } from '@/lib/actions'
import Link from 'next/link'

type Team = {
  id: number
  name: string
  group_name: string
  flag_emoji: string
  owner_name: string | null
  current_stage: string
  is_eliminated: boolean
}

const STAGES = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final', 'Champion!']

export default async function AdminTeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'ghayne17@gmail.com') redirect('/')

  const { data: teamsRaw } = await supabase
    .from('teams')
    .select('*')
    .order('group_name')
    .order('id')

  const teams = (teamsRaw as Team[]) || []

  const groups: Record<string, Team[]> = {}
  for (const team of teams) {
    if (!groups[team.group_name]) groups[team.group_name] = []
    groups[team.group_name].push(team)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-slate-500 hover:text-white text-sm transition-colors">
          ← Admin
        </Link>
        <h1 className="text-2xl font-black text-white">Team Progress</h1>
      </div>

      <p className="text-slate-500 text-sm mb-8">
        Update each team&apos;s stage as the tournament progresses. Hit <strong className="text-white">Save</strong> after each change.
      </p>

      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, groupTeams]) => (
          <div key={group} className="mb-8 bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Group {group}
            </h3>
            <div className="space-y-3">
              {groupTeams.map(team => (
                <form key={team.id} action={updateTeamStage} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="team_id" value={team.id} />
                  <span className="text-2xl w-8 shrink-0">{team.flag_emoji}</span>
                  <span className="text-sm font-semibold text-white w-36 shrink-0 truncate">{team.name}</span>
                  <span className="text-xs text-amber-400/70 w-28 shrink-0 truncate">
                    {team.owner_name ?? <span className="text-slate-600 italic">Unallocated</span>}
                  </span>
                  <select
                    name="stage"
                    defaultValue={team.current_stage}
                    className="bg-[#050a14] border border-[#1e3a5f] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_eliminated"
                      value="1"
                      defaultChecked={team.is_eliminated}
                      className="accent-red-500"
                    />
                    Eliminated
                  </label>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] hover:bg-[#2a4f7a] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
