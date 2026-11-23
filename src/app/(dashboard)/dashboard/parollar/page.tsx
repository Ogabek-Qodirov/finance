'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Pencil,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { createClient } from '@/lib/supabase/client'
import { getVaultEntries } from '@/lib/queries/vault'
import {
  createVaultEntry,
  updateVaultEntry,
  deleteVaultEntry,
} from '@/lib/actions/vault'
import {
  encryptVaultEntry,
  decryptVaultEntry,
  setVaultMasterPassword,
  verifyVaultMasterPassword,
  hasVaultMasterPassword,
  clearVaultSession,
  saveVaultSessionKey,
  getVaultSessionKey,
} from '@/lib/crypto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonRow } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { VaultEntry } from '@/types'
import { cn, formatDate } from '@/lib/utils'

export default function ParollarPage() {
  const [userId, setUserId] = useState<string>('')
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Master password state
  const [hasMaster, setHasMaster] = useState<boolean>(false)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [masterPassword, setMasterPassword] = useState<string>('')
  const [unlockPassword, setUnlockPassword] = useState<string>('')
  const [newMasterPassword, setNewMasterPassword] = useState<string>('')
  const [confirmMasterPassword, setConfirmMasterPassword] = useState<string>('')
  const [unlockError, setUnlockError] = useState<string>('')

  // Decrypted cache in state
  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Record<string, { password: string; notes?: string }>
  >({})
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({})

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null)
  const [platformName, setPlatformName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [entryPassword, setEntryPassword] = useState('')
  const [entryNotes, setEntryNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Inactivity auto-lock timer (15 minutes)
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null)

  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    lockTimerRef.current = setTimeout(() => {
      handleLock()
      toast('Xavfsizlik maqsadida parol ombori qulflandi', 'info')
    }, 15 * 60 * 1000)
  }, [])

  useEffect(() => {
    const handleActivity = () => {
      if (isUnlocked) resetLockTimer()
    }
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    }
  }, [isUnlocked, resetLockTimer])

  const loadEntries = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const data = await getVaultEntries(uid)
      setEntries(data)
    } catch (e) {
      console.error('loadEntries error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check setup & session key
  useEffect(() => {
    const exists = hasVaultMasterPassword()
    setHasMaster(exists)
    const sessionKey = getVaultSessionKey()
    if (sessionKey && exists) {
      setMasterPassword(sessionKey)
      setIsUnlocked(true)
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadEntries(user.id)
      }
    })
  }, [loadEntries])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setUnlockError('')
    if (!unlockPassword) return

    const isValid = await verifyVaultMasterPassword(unlockPassword)
    if (!isValid) {
      setUnlockError("Noto'g'ri master parol. Iltimos qaytadan tekshiring.")
      return
    }

    setMasterPassword(unlockPassword)
    saveVaultSessionKey(unlockPassword)
    setIsUnlocked(true)
    setUnlockPassword('')
    resetLockTimer()
    toast('Ombor ochildi', 'success')
  }

  const handleSetupMaster = async (e: React.FormEvent) => {
    e.preventDefault()
    setUnlockError('')
    if (newMasterPassword.length < 8) {
      setUnlockError("Master parol kamida 8 ta belgidan iborat bo'lishi kerak")
      return
    }
    if (newMasterPassword !== confirmMasterPassword) {
      setUnlockError('Parollar bir-biriga mos kelmadi')
      return
    }

    await setVaultMasterPassword(newMasterPassword)
    saveVaultSessionKey(newMasterPassword)
    setMasterPassword(newMasterPassword)
    setHasMaster(true)
    setIsUnlocked(true)
    setNewMasterPassword('')
    setConfirmMasterPassword('')
    resetLockTimer()
    toast('Master parol muvaffaqiyatli saqlandi', 'success')
  }

  const handleLock = () => {
    clearVaultSession()
    setIsUnlocked(false)
    setMasterPassword('')
    setDecryptedPasswords({})
    setRevealedIds({})
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
  }

  const decryptEntry = async (entry: VaultEntry) => {
    if (decryptedPasswords[entry.id]) return decryptedPasswords[entry.id]
    if (!masterPassword) return null

    const decrypted = await decryptVaultEntry(
      masterPassword,
      entry.encrypted_payload,
      entry.encryption_meta
    )
    if (decrypted) {
      setDecryptedPasswords((prev) => ({ ...prev, [entry.id]: decrypted }))
    }
    return decrypted
  }

  const toggleReveal = async (entry: VaultEntry) => {
    if (!revealedIds[entry.id]) {
      await decryptEntry(entry)
    }
    setRevealedIds((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))
  }

  const copyPassword = async (entry: VaultEntry) => {
    let plain: string | undefined = decryptedPasswords[entry.id]?.password
    if (!plain) {
      const dec = await decryptEntry(entry)
      plain = dec?.password
    }
    if (plain) {
      await navigator.clipboard.writeText(plain)
      toast('Parol nusxalandi!', 'success')
    } else {
      toast('Parolni ochishda xatolik yuz berdi', 'error')
    }
  }

  const generatePassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~'
    let pass = ''
    for (let i = 0; i < 18; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setEntryPassword(pass)
    toast('Kuchli parol generatsiya qilindi', 'success')
  }

  const openCreateModal = () => {
    setEditingEntry(null)
    setPlatformName('')
    setWebsiteUrl('')
    setUsername('')
    setEmail('')
    setEntryPassword('')
    setEntryNotes('')
    setModalOpen(true)
  }

  const openEditModal = async (entry: VaultEntry) => {
    setEditingEntry(entry)
    setPlatformName(entry.platform_name)
    setWebsiteUrl(entry.website_url || '')
    setUsername(entry.username || '')
    setEmail(entry.email || '')
    const dec = await decryptEntry(entry)
    setEntryPassword(dec?.password || '')
    setEntryNotes(dec?.notes || '')
    setModalOpen(true)
  }

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!platformName.trim() || !entryPassword.trim()) {
      toast("Platforma nomi va parol kiritilishi shart", 'error')
      return
    }

    setSaving(true)
    try {
      const { encrypted_payload, encryption_meta } = await encryptVaultEntry(
        masterPassword,
        {
          password: entryPassword.trim(),
          notes: entryNotes.trim() || undefined,
        }
      )

      if (editingEntry) {
        const res = await updateVaultEntry(editingEntry.id, {
          platform_name: platformName.trim(),
          website_url: websiteUrl.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          encrypted_payload,
          encryption_meta,
        })
        if (res?.error) throw new Error(res.error)
        setDecryptedPasswords((prev) => ({
          ...prev,
          [editingEntry.id]: {
            password: entryPassword.trim(),
            notes: entryNotes.trim(),
          },
        }))
        toast('Parol yangilandi', 'success')
      } else {
        const res = await createVaultEntry({
          platform_name: platformName.trim(),
          website_url: websiteUrl.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          encrypted_payload,
          encryption_meta,
        })
        if (res?.error) throw new Error(res.error)
        toast("Yangi parol xavfsiz saqlandi", 'success')
      }
      setModalOpen(false)
      if (userId) loadEntries(userId)
    } catch (err: any) {
      toast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Ushbu parolni rostdan ham o'chirmoqchimisiz?")) return
    setEntries((prev) => prev.filter((e) => e.id !== id))
    const res = await deleteVaultEntry(id)
    if (res?.error) {
      toast(res.error, 'error')
      if (userId) loadEntries(userId)
    } else {
      toast("Parol o'chirildi", 'success')
    }
  }

  const filteredEntries = entries.filter((e) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.platform_name.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.website_url?.toLowerCase().includes(q)
    )
  })

  // Agar ombor qulflangan bo'lsa
  if (!isUnlocked) {
    return (
      <div className="p-6 lg:p-10 max-w-xl mx-auto space-y-8 animate-fadeIn pt-12">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-forest/10 border border-forest/20 text-forest mx-auto flex items-center justify-center shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-darkText tracking-tight">
            Parollar ombori
          </h1>
          <p className="text-sm text-mutedText max-w-md mx-auto">
            Barcha hisoblaringiz parollarini AES-256-GCM algoritmi bilan mijoz tomonida shifrlangan holda xavfsiz saqlang.
          </p>
        </div>

        {!hasMaster ? (
          // Master parol o'rnatish
          <form
            onSubmit={handleSetupMaster}
            className="rounded-3xl p-6 sm:p-8 bg-white border border-darkText/10 shadow-card space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-darkText/5 text-forest font-semibold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Yangi master parol yaratish</span>
            </div>

            <p className="text-xs text-mutedText leading-relaxed">
              <strong>Eslatma:</strong> Ushbu master parol faqat sizning qurilmangizda shifrlash uchun ishlatiladi va serverda saqlanmaydi. Uni eslab qoling, chunki tiklab bo&apos;lmaydi!
            </p>

            <Input
              label="Master parol (kamida 8 belgi)"
              type="password"
              placeholder="••••••••••••"
              value={newMasterPassword}
              onChange={(e) => setNewMasterPassword(e.target.value)}
              required
            />

            <Input
              label="Master parolni tasdiqlang"
              type="password"
              placeholder="••••••••••••"
              value={confirmMasterPassword}
              onChange={(e) => setConfirmMasterPassword(e.target.value)}
              required
            />

            {unlockError && (
              <p className="text-xs text-tomato font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {unlockError}
              </p>
            )}

            <Button variant="primary" size="md" className="w-full mt-2" type="submit">
              Omborni yaratish va ochish
            </Button>
          </form>
        ) : (
          // Master parol bilan ochish
          <form
            onSubmit={handleUnlock}
            className="rounded-3xl p-6 sm:p-8 bg-white border border-darkText/10 shadow-card space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-darkText/5 text-forest font-semibold text-sm">
              <KeyRound className="w-5 h-5" />
              <span>Omborni ochish</span>
            </div>

            <Input
              label="Master parolni kiriting"
              type="password"
              placeholder="••••••••••••"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              required
              autoFocus
            />

            {unlockError && (
              <p className="text-xs text-tomato font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {unlockError}
              </p>
            )}

            <Button variant="primary" size="md" className="w-full mt-2" type="submit">
              Omborni ochish
            </Button>
          </form>
        )}
      </div>
    )
  }

  // Ombor ochiq
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest text-sm font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Mijoz tomonida shifrlangan</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-darkText tracking-tight">
            Parollarim
          </h1>
          <p className="text-mutedText text-sm mt-1">
            AES-256-GCM bilan himoyalangan maxfiy kalitlar ombori
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={handleLock}>
            <Lock className="w-4 h-4" />
            Omborni qulflash
          </Button>
          <Button variant="primary" size="md" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Yangi parol
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedText" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Platforma, login yoki sayt bo'yicha qidirish..."
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-darkText/10 bg-white text-sm text-darkText placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title="Parollar topilmadi"
          description={
            search
              ? "Qidiruvingiz bo'yicha ma'lumot chiqmadi."
              : "Hozircha omborda hech qanday parol saqlanmagan."
          }
          actionLabel="Yangi parol qo'shish"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((item) => {
            const isRevealed = revealedIds[item.id]
            const plainPass = decryptedPasswords[item.id]?.password || '••••••••••••'
            return (
              <div
                key={item.id}
                className="group rounded-3xl p-5 bg-white border border-darkText/10 shadow-sm hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest font-bold shrink-0">
                        {item.platform_name[0]?.toUpperCase() || 'P'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-darkText text-base truncate">
                          {item.platform_name}
                        </h3>
                        {item.website_url && (
                          <a
                            href={
                              item.website_url.startsWith('http')
                                ? item.website_url
                                : `https://${item.website_url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-forest hover:underline inline-flex items-center gap-1 truncate"
                          >
                            <span>{item.website_url.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-mutedText hover:text-darkText hover:bg-cream transition-colors"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(item.id)}
                        className="p-1.5 rounded-lg text-mutedText hover:text-tomato hover:bg-tomato/10 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Login / Email */}
                  {(item.username || item.email) && (
                    <div className="rounded-xl bg-cream/40 p-2.5 text-xs space-y-1 mb-3">
                      {item.username && (
                        <div className="flex justify-between text-mutedText">
                          <span>Login:</span>
                          <span className="font-semibold text-darkText select-all">{item.username}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex justify-between text-mutedText">
                          <span>Email:</span>
                          <span className="font-semibold text-darkText select-all">{item.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Password box */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-darkText/10 bg-white shadow-inner">
                    <span className="font-mono text-xs font-semibold text-darkText select-all truncate">
                      {isRevealed ? plainPass : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleReveal(item)}
                        className="p-1 rounded text-mutedText hover:text-darkText hover:bg-cream transition-colors"
                        title={isRevealed ? "Yashirish" : "Ko'rsatish"}
                      >
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyPassword(item)}
                        className="p-1 rounded text-mutedText hover:text-forest hover:bg-forest/10 transition-colors"
                        title="Nusxalash"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-mutedText/70 pt-3 mt-3 border-t border-darkText/5 flex justify-between">
                  <span>Yangilangan:</span>
                  <span>{formatDate(item.updated_at || item.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Entry Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl border border-darkText/5 p-0 shadow-modal animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-darkText/5">
              <Dialog.Title className="font-display text-xl font-bold text-darkText">
                {editingEntry ? 'Parolni tahrirlash' : 'Yangi parol saqlash'}
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-xl hover:bg-cream transition-colors text-mutedText hover:text-darkText">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
              <Input
                label="Platforma nomi"
                placeholder="Masalan: Google, GitHub, Click..."
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
              />

              <Input
                label="Veb-sayt manzili (ixtiyoriy)"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Login / Foydalanuvchi nomi"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  label="Email"
                  placeholder="nom@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-darkText">Parol</label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs text-forest hover:text-forest-dark font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Tasodifiy kuchli parol
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="Parolni kiriting..."
                  value={entryPassword}
                  onChange={(e) => setEntryPassword(e.target.value)}
                  required
                />
              </div>

              <Textarea
                label="Izoh / Qo'shimcha eslatma"
                placeholder="Xavfsizlik savollari, PIN kod yoki eslatmalar..."
                rows={2}
                value={entryNotes}
                onChange={(e) => setEntryNotes(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Dialog.Close asChild>
                  <Button variant="secondary" size="md" className="flex-1" type="button">
                    Bekor qilish
                  </Button>
                </Dialog.Close>
                <Button variant="primary" size="md" className="flex-1" type="submit" loading={saving}>
                  Shifrlash va saqlash
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
