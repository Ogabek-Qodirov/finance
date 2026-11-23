'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: "Ko'rinish" },
  { href: '/dashboard/xarajatlar', icon: ArrowDownCircle, label: 'Xarajat' },
  { href: '/dashboard/daromadlar', icon: ArrowUpCircle, label: 'Daromad' },
  { href: '/dashboard/statistika', icon: BarChart3, label: 'Statistika' },
  { href: '/dashboard/sozlamalar', icon: Settings, label: 'Sozlama' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-darkText/10 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive ? 'text-forest font-semibold' : 'text-mutedText hover:text-darkText'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-forest')} />
              <span className="text-[10px] tracking-tight">{label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-mustard absolute bottom-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
