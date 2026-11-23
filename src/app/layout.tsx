import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/providers/auth-provider'

export const metadata: Metadata = {
  title: 'Moliya — Shaxsiy moliya boshqaruvi',
  description: "O'z moliyangizni nazorat qiling. Xarajatlar, daromadlar va budjetingizni kuzating.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
