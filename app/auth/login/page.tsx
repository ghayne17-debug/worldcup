import Link from 'next/link'
import { login } from '@/lib/actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your teams</p>
        </div>

        <div className="bg-[#0d1a2d] border border-[#1e3a5f] rounded-2xl p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form action={login} className="flex flex-col gap-4">
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#050a14] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wide transition-colors text-sm cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          No account?{' '}
          <Link href="/auth/signup" className="text-amber-400 hover:text-amber-300 font-semibold">
            Join the draw
          </Link>
        </p>
      </div>
    </div>
  )
}
