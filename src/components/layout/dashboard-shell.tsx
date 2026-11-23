'use client'
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Menu, PanelLeftOpen, PanelLeftClose, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  user: User
  profile: { full_name: string | null; email: string | null } | null
  children: React.ReactNode
}

export function DashboardShell({ user, profile, children }: DashboardShellProps) {
  // Desktopda sukut bo'yicha ochiq, mobil qurilmalarda yopiq
  const [isDesktopOpen, setIsDesktopOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Foydalanuvchi tanlagan sidebar holatini eslab qolish
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moliya_sidebar_open')
      if (saved !== null) {
        setIsDesktopOpen(saved === 'true')
      }
    } catch {
      // ignore
    }
  }, [])

  const handleToggleDesktop = () => {
    setIsDesktopOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem('moliya_sidebar_open', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Ekran o'lchami o'zgarganda xavfsiz boshqarish
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-x-hidden">
      {/* Yon panel (Desktop & Mobil Drawer) */}
      <Sidebar
        user={user}
        profile={profile}
        isDesktopOpen={isDesktopOpen}
        isMobileOpen={isMobileOpen}
        onToggleDesktop={handleToggleDesktop}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Asosiy kontent maydoni (Sidebar ochilganda va yopilganda dinamik kengayadi) */}
      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out',
          isDesktopOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        {/* Yuqori boshqaruv paneli (Header Top Bar) */}
        <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-md border-b border-darkText/5 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Desktopda sidebar yopilganda ochish tugmasi, ochiqligida yashirish tugmasi */}
            <button
              onClick={handleToggleDesktop}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-darkText/10 bg-white hover:bg-cream transition-colors text-darkText shadow-sm"
              title={isDesktopOpen ? "Sidebar'ni yashirish" : "Sidebar'ni ko'rsatish"}
              aria-label="Sidebar holatini o'zgartirish"
            >
              {isDesktopOpen ? (
                <>
                  <PanelLeftClose className="h-4 w-4 text-mutedText" />
                  <span className="text-xs font-medium text-mutedText">Yashirish</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="h-4 w-4 text-forest" />
                  <span className="text-xs font-semibold text-forest">Menyu</span>
                </>
              )}
            </button>

            {/* Desktopda sidebar yopilganda ixcham Moliya logosi */}
            {!isDesktopOpen && (
              <div className="hidden lg:flex items-center gap-2 pl-1 animate-fadeIn">
                <div className="w-7 h-7 bg-mustard rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-forest font-bold text-xs font-display">M</span>
                </div>
                <span className="font-display text-forest font-bold text-base tracking-tight">
                  Moliya
                </span>
              </div>
            )}

            {/* Mobil qurilmalar uchun Gamburger menyu tugmasi */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-darkText/10 bg-white hover:bg-cream text-darkText shadow-sm"
              aria-label="Mobil menyuni ochish"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-mutedText hidden sm:inline-block">
              Moliya Boshqaruvi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-forest/10 text-forest border border-forest/15">
              <ShieldCheck className="h-3.5 w-3.5 text-forest" />
              <span>Himoyalangan</span>
            </span>
          </div>
        </header>

        {/* Sahifa ichidagi asosiy kontent */}
        <main className="flex-1 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobil pastki navigatsiya */}
      <MobileNav />
    </div>
  )
}
