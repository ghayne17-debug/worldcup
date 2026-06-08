'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Auth ────────────────────────────────────

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) redirect('/auth/login?error=' + encodeURIComponent(error.message))
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { display_name: formData.get('display_name') as string },
    },
  })
  if (error) redirect('/auth/signup?error=' + encodeURIComponent(error.message))
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ─── Participant ──────────────────────────────

export async function registerParticipant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const teamsWanted = Math.max(1, Math.min(20, parseInt(formData.get('teams_wanted') as string) || 1))

  await supabase.from('participants').upsert(
    {
      user_id: user.id,
      display_name: (user.user_metadata?.display_name as string) || user.email!.split('@')[0],
      email: user.email!,
      teams_wanted: teamsWanted,
    },
    { onConflict: 'user_id' }
  )

  revalidatePath('/dashboard')
  revalidatePath('/')
}

// ─── Admin ────────────────────────────────────

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'ghayne17@gmail.com') throw new Error('Unauthorized')
}

export async function markAsPaid(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  const userId = formData.get('user_id') as string
  const teamsWanted = parseInt(formData.get('teams_wanted') as string)

  await admin
    .from('participants')
    .update({ is_paid: true, teams_paid: teamsWanted })
    .eq('user_id', userId)

  revalidatePath('/admin')
}

export async function markAsUnpaid(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  const userId = formData.get('user_id') as string

  await admin
    .from('participants')
    .update({ is_paid: false, teams_paid: 0 })
    .eq('user_id', userId)

  revalidatePath('/admin')
}

export async function triggerDraw() {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: participants } = await admin
    .from('participants')
    .select('user_id, display_name, teams_paid')
    .eq('is_paid', true)
    .gt('teams_paid', 0)

  const { data: teams } = await admin
    .from('teams')
    .select('id')
    .order('id')

  if (!participants?.length || !teams?.length) {
    throw new Error('No paid participants or no teams found')
  }

  // Build pool: each participant appears teams_paid times
  const pool: { userId: string; name: string }[] = []
  for (const p of participants) {
    for (let i = 0; i < p.teams_paid; i++) {
      pool.push({ userId: p.user_id, name: p.display_name })
    }
  }

  // Fisher-Yates shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  // Fisher-Yates shuffle teams
  const shuffledTeams = [...teams]
  for (let i = shuffledTeams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]]
  }

  // Assign teams — cap at pool size (unallocated teams stay as house)
  const count = Math.min(pool.length, shuffledTeams.length)
  for (let i = 0; i < count; i++) {
    await admin
      .from('teams')
      .update({ owner_user_id: pool[i].userId, owner_name: pool[i].name })
      .eq('id', shuffledTeams[i].id)
  }

  await admin
    .from('draw_config')
    .update({ is_drawn: true, drawn_at: new Date().toISOString() })
    .eq('id', 1)

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin')
}

export async function doublePaidSlots() {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: participants } = await admin
    .from('participants')
    .select('user_id, teams_wanted, teams_paid')
    .eq('is_paid', true)

  if (!participants?.length) return

  for (const p of participants) {
    await admin
      .from('participants')
      .update({
        teams_wanted: p.teams_wanted * 2,
        teams_paid: p.teams_paid * 2,
      })
      .eq('user_id', p.user_id)
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function resetDraw() {
  await assertAdmin()
  const admin = createAdminClient()

  await admin.from('teams').update({ owner_user_id: null, owner_name: null })
    .neq('id', 0)

  await admin
    .from('draw_config')
    .update({ is_drawn: false, drawn_at: null })
    .eq('id', 1)

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin')
}

export async function updateTeamStage(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()

  await admin
    .from('teams')
    .update({
      current_stage: formData.get('stage') as string,
      is_eliminated: formData.get('is_eliminated') === '1',
    })
    .eq('id', parseInt(formData.get('team_id') as string))

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin')
}
