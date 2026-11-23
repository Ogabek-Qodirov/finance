'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Target,
  Tag,
  Settings,
  LogOut,
  X,
  PanelLeftClose,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: "Umumiy ko'rinish" },
  { href: '/dashboard/xarajatlar', icon: ArrowDownCircle, label: 'Xarajatlar' },
  { href: '/dashboard/daromadlar', icon: ArrowUpCircle, label: 'Daromadlar' },
  { href: '/dashboard/statistika', icon: BarChart3, label: 'Statistika' },
  { href: '/dashboard/budjet', icon: Target, label: 'Budjet' },
  { href: '/dashboard/kategoriyalar', icon: Tag, label: 'Kategoriyalar' },
  { href: '/dashboard/sozlamalar', icon: Settings, label: 'Sozlamalar' },
]

interface SidebarProps {
  user: User
  profile: { full_name: string | null; email: string | null } | null
  isDesktopOpen: boolean
  isMobileOpen: boolean
  onToggleDesktop: () => void
  onCloseMobile: () => void
}

export function Sidebar({
  user,
  profile,
  isDesktopOpen,
  isMobileOpen,
  onToggleDesktop,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Foydalanuvchi'
  const displayEmail = profile?.email || user?.email || ''
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'M'

  return (
    <>
      {/* Mobil Qoplama (Backdrop Overlay) */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-darkText/50 backdrop-blur-sm z-50 lg:hidden animate-fadeIn"
          aria-label="Menyuni yopish"
        />
      )}

      {/* Yon panel (Desktop + Mobil Drawer) */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-forest flex flex-col z-50 select-none shadow-2xl transition-transform duration-300 ease-in-out',
          // Mobil ko'rinishi (< 1024px)
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop ko'rinishi (>= 1024px)
          isDesktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        )}
      >
        {/* Brand Logo & Yopish tugmalari */}
        <div className="p-5 border-b border-cream/10 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-mustard rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-mustard-light transition-colors shadow-sm">
              <span className="text-forest font-bold text-base font-display">M</span>
            </div>
            <div>
              <span className="font-display text-cream font-bold text-xl block leading-none tracking-tight">
                Moliya
              </span>
              <span className="text-cream/40 text-[10px] font-semibold tracking-wider uppercase mt-1 block">
                Shaxsiy moliya
              </span>
            </div>
          </Link>

          {/* Desktop uchun panelni yopish tugmasi */}
          <button
            onClick={onToggleDesktop}
            className="hidden lg:flex p-1.5 rounded-lg text-cream/50 hover:text-cream hover:bg-cream/10 transition-colors"
            title="Sidebar'ni yashirish"
            aria-label="Sidebar'ni yashirish"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>

          {/* Mobil uchun yopish tugmasi */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-cream/70 hover:text-cream hover:bg-cream/10 transition-colors"
            aria-label="Menyuni yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigatsiya menyusi */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-mustard/20 text-mustard border-l-[3px] border-mustard pl-3 font-semibold'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/10'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive ? 'text-mustard' : 'text-cream/50'
                  )}
                />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Foydalanuvchi profili va Tizimdan chiqish */}
        <div className="p-4 border-t border-cream/10 bg-forest-dark/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-cream/5 mb-2">
            <div className="w-9 h-9 rounded-full bg-mustard/20 flex items-center justify-center flex-shrink-0 text-mustard text-xs font-bold font-display border border-mustard/30">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cream text-sm font-medium truncate leading-tight">
                {displayName}
              </p>
              <p className="text-cream/40 text-xs truncate mt-0.5">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-cream/60 hover:text-tomato hover:bg-tomato/10 transition-all duration-150 text-xs font-medium cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  )
}
