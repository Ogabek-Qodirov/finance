'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Pin,
  Plus,
  Search,
  Trash2,
  Pencil,
  Clock,
  X,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { createClient } from '@/lib/supabase/client'
import { getNotes } from '@/lib/queries/notes'
import { createNote, updateNote, deleteNote } from '@/lib/actions/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { Note } from '@/types'
import { cn, formatDate } from '@/lib/utils'

export default function QaydlarPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [search, setSearch] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadNotes = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const data = await getNotes(uid)
      setNotes(data)
    } catch (e) {
      console.error('loadNotes error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadNotes(user.id)
      }
    })
  }, [loadNotes])

  const openCreateModal = () => {
    setEditingNote(null)
    setTitle('')
    setContent('')
    setIsPinned(false)
    setModalOpen(true)
  }

  const openEditModal = (n: Note) => {
    setEditingNote(n)
    setTitle(n.title)
    setContent(n.content || '')
    setIsPinned(n.is_pinned)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast('Qayd sarlavhasi kiritilishi shart', 'error')
      return
    }

    setSaving(true)
    try {
      if (editingNote) {
        const res = await updateNote(editingNote.id, {
          title: title.trim(),
          content: content.trim() || undefined,
          is_pinned: isPinned,
        })
        if (res?.error) throw new Error(res.error)
        toast('Qayd yangilandi', 'success')
      } else {
        const res = await createNote({
          title: title.trim(),
          content: content.trim() || undefined,
        })
        if (res?.error) throw new Error(res.error)
        if (isPinned && res.note) {
          await updateNote(res.note.id, { is_pinned: true })
        }
        toast("Qayd saqlandi", 'success')
      }
      setModalOpen(false)
      if (userId) loadNotes(userId)
    } catch (err: any) {
      toast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePin = async (n: Note) => {
    const nextPin = !n.is_pinned
    setNotes((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, is_pinned: nextPin } : item))
    )
    const res = await updateNote(n.id, { is_pinned: nextPin })
    if (res?.error) {
      toast(res.error, 'error')
      if (userId) loadNotes(userId)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Ushbu qaydni o'chirmoqchimisiz?")) return
    setNotes((prev) => prev.filter((item) => item.id !== id))
    const res = await deleteNote(id)
    if (res?.error) {
      toast(res.error, 'error')
      if (userId) loadNotes(userId)
    } else {
      toast("Qayd o'chirildi", 'success')
    }
  }

  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true
    return (
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned)
  const regularNotes = filteredNotes.filter((n) => !n.is_pinned)

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest text-sm font-semibold mb-1">
            <FileText className="w-4 h-4" />
            <span>Fikrlar va eslatmalar</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-darkText tracking-tight">
            Qaydlarim
          </h1>
          <p className="text-mutedText text-sm mt-1">
            Muhim ma&apos;lumotlar va rejalarni tezda yozib boring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedText" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qaydlardan qidirish..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-darkText/10 bg-white text-sm text-darkText placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
          <Button variant="primary" size="md" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Yangi qayd
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="Hozircha hech qanday qayd yo'q"
          description="Fikrlaringiz, rejalar yoki muhim ma'lumotlarni yozib qoldirish uchun yangi qayd yarating."
          actionLabel="Qayd yaratish"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-8">
          {/* Qadalgan qaydlar */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mutedText mb-3">
                <Pin className="w-3.5 h-3.5 text-mustard-dark fill-mustard" />
                <span>Qadalgan qaydlar</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    onEdit={openEditModal}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Barcha boshqa qaydlar */}
          <div>
            {pinnedNotes.length > 0 && (
              <div className="text-xs font-semibold uppercase tracking-wider text-mutedText mb-3">
                Barcha qaydlar
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularNotes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onEdit={openEditModal}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-3xl border border-darkText/5 p-0 shadow-modal animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-darkText/5">
              <Dialog.Title className="font-display text-xl font-bold text-darkText">
                {editingNote ? 'Qaydni tahrirlash' : 'Yangi qayd'}
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-xl hover:bg-cream transition-colors text-mutedText hover:text-darkText">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <Input
                label="Qayd sarlavhasi"
                placeholder="Sarlavhani kiriting..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Qayd matni"
                placeholder="Fikrlaringizni shu yerga yozing..."
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-darkText/20 text-forest focus:ring-forest w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pinCheckbox" className="text-xs font-medium text-darkText cursor-pointer select-none">
                  Yuqoriga qadab qo&apos;yish (Pin)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <Dialog.Close asChild>
                  <Button variant="secondary" size="md" className="flex-1" type="button">
                    Bekor qilish
                  </Button>
                </Dialog.Close>
                <Button variant="primary" size="md" className="flex-1" type="submit" loading={saving}>
                  Saqlash
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  note: Note
  onEdit: (n: Note) => void
  onTogglePin: (n: Note) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      onClick={() => onEdit(note)}
      className="group relative rounded-2xl p-5 bg-white border border-darkText/10 shadow-sm hover:shadow-card hover:border-darkText/20 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-darkText text-base line-clamp-1 group-hover:text-forest transition-colors">
            {note.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin(note)
            }}
            className={cn(
              'p-1 rounded-lg transition-colors shrink-0',
              note.is_pinned
                ? 'text-mustard-dark fill-mustard'
                : 'text-mutedText/40 hover:text-darkText'
            )}
            title={note.is_pinned ? 'Qadalishni bekor qilish' : 'Qadab qo\'yish'}
          >
            <Pin className={cn('w-4 h-4', note.is_pinned && 'fill-current')} />
          </button>
        </div>

        <p className="text-xs text-mutedText leading-relaxed line-clamp-4 whitespace-pre-wrap">
          {note.content || "Matn kiritilmagan"}
        </p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-mutedText/70 pt-4 mt-2 border-t border-darkText/5">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(note.updated_at || note.created_at)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(note.id)
          }}
          className="p-1 text-mutedText/40 hover:text-tomato rounded transition-colors opacity-0 group-hover:opacity-100"
          title="O'chirish"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
