import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Barmen Calcutta Draw | FIFA World Cup 2026',
  description: 'FIFA World Cup 2026 Calcutta draw at the Barmen — pick your teams and track their progress!',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === 'ghayne17@gmail.com'

  return (
    <html lang="en" className={geist.variable}>
      <body className="flex flex-col min-h-screen font-sans">
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-[#1e3a5f]/60 bg-[#050a14]/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">⚽</span>
              <span className="font-black text-lg tracking-tight hidden sm:block">
                <span className="text-white">BARMEN</span>
                <span className="text-amber-400"> CALCUTTA</span>
                <span className="text-slate-400 font-normal text-sm ml-1">2026</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link href="/" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Home
              </Link>
              {user && (
                <Link href="/dashboard" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  My Teams
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="px-3 py-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-amber-400/10">
                  ⚙ Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[160px]">{user.email}</span>
                  <form action={logout}>
                    <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer">
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="text-sm px-3 py-1.5 text-slate-300 hover:text-white transition-colors">
                    Login
                  </Link>
                  <Link href="/auth/signup" className="text-sm px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors">
                    Join Draw
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[#1e3a5f]/60 py-6 text-center text-slate-600 text-xs">
          Barmen Calcutta Draw · FIFA World Cup 2026
        </footer>
      </body>
    </html>
  )
}
