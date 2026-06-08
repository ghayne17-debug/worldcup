import Link from 'next/link'
import { signup } from '@/lib/actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎰</div>
          <h1 className="text-2xl font-black text-white">Join the Draw</h1>
          <p className="text-slate-500 text-sm mt-1">Register and tell us how many teams you want</p>
        </div>

        <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form action={signup} className="flex flex-col gap-4">
            <div>
              <label htmlFor="display_name" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Your Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                autoComplete="name"
                placeholder="Greg Hayne"
                className="w-full bg-[#050a14] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-[#050a14] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                className="w-full bg-[#050a14] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            <div className="bg-[#050a14]/60 rounded-xl border border-[#1e3a5f]/60 p-3 text-xs text-slate-400 space-y-1">
              <div>💰 Each team costs <span className="text-amber-400 font-bold">$20</span>. You&apos;ll set how many teams you want after signing up.</div>
              <div>💳 Pay via <span className="text-white font-semibold">PayID to Greg</span> — use the description <span className="text-amber-400 font-semibold">&quot;World Cup - your favourite Cereal&quot;</span></div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wide transition-colors text-sm cursor-pointer"
            >
              Create Account →
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
