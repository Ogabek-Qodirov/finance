'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Pencil,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { createClient } from '@/lib/supabase/client'
import { getTasks } from '@/lib/queries/tasks'
import { createTask, updateTask, deleteTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonRow } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { Task, TaskPriority, TaskStatus } from '@/types'
import { cn, formatDate } from '@/lib/utils'

export default function VazifalarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'done'>('all')
  const [search, setSearch] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [saving, setSaving] = useState(false)

  const loadTasks = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const data = await getTasks(uid)
      setTasks(data)
    } catch (e) {
      console.error('loadTasks error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadTasks(user.id)
      }
    })
  }, [loadTasks])

  const openCreateModal = () => {
    setEditingTask(null)
    setTitle('')
    setDescription('')
    setDueDate(new Date().toISOString().split('T')[0])
    setStartTime('')
    setEndTime('')
    setPriority('medium')
    setModalOpen(true)
  }

  const openEditModal = (t: Task) => {
    setEditingTask(t)
    setTitle(t.title)
    setDescription(t.description || '')
    setDueDate(t.due_date || '')
    setStartTime(t.start_time || '')
    setEndTime(t.end_time || '')
    setPriority(t.priority)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast('Vazifa nomi kiritilishi shart', 'error')
      return
    }

    setSaving(true)
    try {
      if (editingTask) {
        const res = await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
          startTime: startTime || null,
          endTime: endTime || null,
          priority,
        })
        if (res?.error) throw new Error(res.error)
        toast('Vazifa yangilandi', 'success')
      } else {
        const res = await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          priority,
        })
        if (res?.error) throw new Error(res.error)
        toast("Vazifa qo'shildi", 'success')
      }
      setModalOpen(false)
      if (userId) loadTasks(userId)
    } catch (err: any) {
      toast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (t: Task) => {
    const nextStatus: TaskStatus = t.status === 'done' ? 'pending' : 'done'
    // Optimistic update
    setTasks((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, status: nextStatus } : item))
    )
    const res = await updateTask(t.id, { status: nextStatus })
    if (res?.error) {
      toast(res.error, 'error')
      if (userId) loadTasks(userId)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Ushbu vazifani o'chirmoqchimisiz?")) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
    const res = await deleteTask(id)
    if (res?.error) {
      toast(res.error, 'error')
      if (userId) loadTasks(userId)
    } else {
      toast("Vazifa o'chirildi", 'success')
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const match =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      if (!match) return false
    }

    if (filter === 'today') {
      return t.due_date === todayStr && t.status !== 'done'
    }
    if (filter === 'upcoming') {
      return t.due_date && t.due_date > todayStr && t.status !== 'done'
    }
    if (filter === 'done') {
      return t.status === 'done'
    }
    return true
  })

  const completedCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest text-sm font-semibold mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Shaxsiy reja</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-darkText tracking-tight">
            Vazifalarim
          </h1>
          <p className="text-mutedText text-sm mt-1">
            Kundalik maqsadlar va ishlaringizni rejalashtiring
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Yangi vazifa
        </Button>
      </div>

      {/* Progress Card */}
      <div className="rounded-3xl p-6 bg-white border border-darkText/10 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-mutedText">
            Bajarilish darajasi
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-bold text-darkText">{progressPct}%</span>
            <span className="text-sm text-mutedText">
              ({completedCount} / {totalCount} bajarildi)
            </span>
          </div>
        </div>
        <div className="flex-1 max-w-md">
          <div className="w-full h-3 rounded-full bg-cream overflow-hidden border border-darkText/5">
            <div
              className="h-full rounded-full bg-forest transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex rounded-xl bg-white border border-darkText/10 p-1 shadow-sm overflow-x-auto">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'today', label: 'Bugun' },
            { id: 'upcoming', label: 'Rejalashtirilgan' },
            { id: 'done', label: 'Bajarilgan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all',
                filter === tab.id
                  ? 'bg-forest text-cream shadow-sm'
                  : 'text-mutedText hover:text-darkText hover:bg-cream/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedText" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vazifalardan qidirish..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-darkText/10 bg-white text-sm text-darkText placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="Vazifalar topilmadi"
          description={
            search
              ? "Qidiruvingiz bo'yicha hech qanday vazifa chiqmadi."
              : "Ushbu bo'limda hozircha vazifalar mavjud emas."
          }
          actionLabel="Yangi vazifa qo'shish"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const isDone = t.status === 'done'
            const isToday = t.due_date === todayStr
            return (
              <div
                key={t.id}
                className={cn(
                  'group rounded-2xl p-4 bg-white border border-darkText/10 shadow-sm hover:shadow-card transition-all flex items-start sm:items-center justify-between gap-4',
                  isDone && 'bg-cream/30 opacity-70'
                )}
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className="mt-0.5 sm:mt-0 text-mutedText hover:text-forest transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-forest fill-forest/10" />
                    ) : (
                      <Square className="w-5 h-5 text-darkText/30 hover:text-forest" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-sm font-semibold text-darkText',
                          isDone && 'line-through text-mutedText'
                        )}
                      >
                        {t.title}
                      </span>

                      {/* Priority badge */}
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                          t.priority === 'high' && 'bg-tomato/10 text-tomato',
                          t.priority === 'medium' && 'bg-mustard/20 text-mustard-dark',
                          t.priority === 'low' && 'bg-forest/10 text-forest'
                        )}
                      >
                        {t.priority === 'high' ? 'Muhim' : t.priority === 'medium' ? "O'rta" : 'Oddiy'}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-xs text-mutedText mt-1 line-clamp-1">{t.description}</p>
                    )}

                    {/* Due date / Time */}
                    {(t.due_date || t.start_time) && (
                      <div className="flex items-center gap-3 text-[11px] text-mutedText mt-1.5 flex-wrap">
                        {t.due_date && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 font-medium',
                              isToday && !isDone && 'text-forest font-semibold'
                            )}
                          >
                            <Calendar className="w-3 h-3" />
                            {isToday ? 'Bugun' : formatDate(t.due_date)}
                          </span>
                        )}
                        {(t.start_time || t.end_time) && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {t.start_time}
                            {t.end_time ? ` - ${t.end_time}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg text-mutedText hover:text-darkText hover:bg-cream transition-colors"
                    title="Tahrirlash"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg text-mutedText hover:text-tomato hover:bg-tomato/10 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl border border-darkText/5 p-0 shadow-modal animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-darkText/5">
              <Dialog.Title className="font-display text-xl font-bold text-darkText">
                {editingTask ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-xl hover:bg-cream transition-colors text-mutedText hover:text-darkText">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <Input
                label="Vazifa nomi"
                placeholder="Masalan: Hisobot tayyorlash..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Batafsil izoh (ixtiyoriy)"
                placeholder="Qo'shimcha tafsilotlar yoki eslatmalar..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Muddati"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />

                <div>
                  <label className="text-sm font-medium text-darkText mb-1.5 block">
                    Muhimlik darajasi
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full h-11 rounded-xl border border-darkText/15 bg-white px-3 text-sm text-darkText font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                  >
                    <option value="low">Oddiy</option>
                    <option value="medium">O&apos;rta</option>
                    <option value="high">Muhim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Boshlanish vaqti"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <Input
                  label="Tugash vaqti"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
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
