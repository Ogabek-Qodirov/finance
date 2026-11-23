'use client'
import { useState, useEffect } from 'react'
import { User, Shield, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserProfile, getUserSettings } from '@/lib/queries/settings'
import {
  updateProfile,
  updateSettings,
  updatePassword,
} from '@/lib/actions/settings'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { Profile, UserSettings as SettingsType } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'profil' | 'hisob' | 'xavfsizlik'

export default function SozlamalarPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profil')
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loading, setLoading] = useState(true)

  // Profil formasi
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Hisob sozlamalari
  const [currency, setCurrency] = useState('UZS')
  const [language, setLanguage] = useState('uz')
  const [timezone, setTimezone] = useState('Asia/Tashkent')
  const [savingSettings, setSavingSettings] = useState(false)

  // Parolni yangilash
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const [p, s] = await Promise.all([
        getUserProfile(user.id),
        getUserSettings(user.id),
      ])
      setProfile(p)
      setSettings(s)
      setFullName(p?.full_name || '')
      setCurrency(s?.currency || 'UZS')
      setLanguage(s?.language || 'uz')
      setTimezone(s?.timezone || 'Asia/Tashkent')
      setLoading(false)
    })
  }, [])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const result = await updateProfile(fullName)
    setSavingProfile(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast('Profil ma\'lumotlari yangilandi', 'success')
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    const result = await updateSettings({ currency, language, timezone })
    setSavingSettings(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast('Sozlamalar saqlandi', 'success')
  }

  const handleSavePassword = async () => {
    setPwError('')
    if (newPassword.length < 6) {
      setPwError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Kiritilgan yangi parollar mos kelmadi')
      return
    }

    setSavingPw(true)
    const result = await updatePassword(newPassword)
    setSavingPw(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast('Parol muvaffaqiyatli yangilandi', 'success')
    setNewPassword('')
    setConfirmPassword('')
  }

  const initials =
    (profile?.full_name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'M'

  const TABS = [
    { id: 'profil' as Tab, label: 'Foydalanuvchi Profili', icon: User },
    { id: 'hisob' as Tab, label: 'Tizim va Valyuta', icon: Settings },
    { id: 'xavfsizlik' as Tab, label: 'Xavfsizlik', icon: Shield },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <PageHeader
        title="Sozlamalar"
        description="Shaxsiy profilingiz va dastur parametrlarini boshqaring"
      />

      {/* Tablar */}
      <div className="flex gap-1.5 p-1.5 bg-white rounded-2xl border border-darkText/5 shadow-card">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all',
              activeTab === id
                ? 'bg-forest text-cream shadow-sm'
                : 'text-mutedText hover:text-darkText hover:bg-cream/60'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Profil Tabi */}
      {activeTab === 'profil' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profil ma'lumotlari</CardTitle>
            <p className="text-xs text-mutedText">
              Ismingiz va asosiy hisob tafsilotlari
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="skeleton h-36 rounded-2xl" />
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-cream/60 rounded-2xl border border-darkText/5">
                  <div className="w-16 h-16 rounded-2xl bg-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-cream font-bold text-xl font-display">
                      {initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-darkText text-base">
                      {profile?.full_name || 'Foydalanuvchi'}
                    </p>
                    <p className="text-xs text-mutedText mt-0.5">{profile?.email}</p>
                  </div>
                </div>

                <Input
                  label="To'liq ismingiz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ism Familiya"
                />

                <div>
                  <label className="text-sm font-medium text-darkText mb-1.5 block">
                    Elektron pochta manzili
                  </label>
                  <input
                    value={profile?.email || ''}
                    disabled
                    className="w-full h-11 rounded-xl border border-darkText/15 bg-cream px-3.5 text-sm text-mutedText cursor-not-allowed"
                  />
                  <p className="text-[11px] text-mutedText mt-1 font-medium">
                    Elektron pochta manzili xavfsizlik maqsadida o'zgartirilmaydi
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveProfile}
                  loading={savingProfile}
                >
                  O'zgarishlarni saqlash
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hisob va Tizim Tabi */}
      {activeTab === 'hisob' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tizim va Valyuta parametrlari</CardTitle>
            <p className="text-xs text-mutedText">
              Hisobotlar uchun asosiy ko'rsatkichlar
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="skeleton h-36 rounded-2xl" />
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-darkText mb-1.5 block">
                    Asosiy valyuta
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="UZS">UZS — O'zbek so'mi (Standart)</option>
                    <option value="USD">USD — AQSH dollari</option>
                    <option value="EUR">EUR — Yevro</option>
                    <option value="RUB">RUB — Rossiya rubli</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-darkText mb-1.5 block">
                    Interfeys tili
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="uz">O'zbekcha (Lotin alifbosi)</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-darkText mb-1.5 block">
                    Vaqt mintaqasi (Timezone)
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5, Toshkent)</option>
                    <option value="Asia/Samarkand">Asia/Samarkand (UTC+5, Samarqand)</option>
                    <option value="UTC">UTC (Standart vaqt)</option>
                  </select>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveSettings}
                  loading={savingSettings}
                >
                  Parametrlarni saqlash
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Xavfsizlik Tabi */}
      {activeTab === 'xavfsizlik' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Parolni yangilash</CardTitle>
            <p className="text-xs text-mutedText">
              Hisobingiz xavfsizligini ta'minlash uchun parolingizni muntazam yangilab turing
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Yangi parol"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setPwError('')
              }}
              placeholder="Kamida 6 ta belgi"
            />

            <Input
              label="Yangi parolni tasdiqlang"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setPwError('')
              }}
              placeholder="Parolni qayta tering"
              error={pwError}
            />

            <Button
              variant="primary"
              size="md"
              onClick={handleSavePassword}
              loading={savingPw}
            >
              Parolni yangilash
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
