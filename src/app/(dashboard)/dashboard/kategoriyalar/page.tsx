'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getCategories,
  getCategoryTransactionCount,
} from '@/lib/queries/categories'
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/actions/categories'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Category } from '@/types'

const PRESET_COLORS = [
  '#234B38',
  '#E5B94F',
  '#D9654D',
  '#E99B63',
  '#77786F',
  '#252820',
  '#4A90D9',
  '#9B59B6',
  '#27AE60',
  '#E74C3C',
]

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium text-darkText mb-2 block">
        Belgi rangi
      </label>
      <div className="flex flex-wrap gap-2.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-105"
            style={{
              backgroundColor: c,
              borderColor: value === c ? '#252820' : 'transparent',
              boxShadow:
                value === c ? '0 0 0 2px #F8F5EC, 0 0 0 4px #252820' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface CategoryModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  category?: Category
  onSuccess: () => void
}

function CategoryModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '')
  const [color, setColor] = useState(category?.color || '#234B38')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(category?.name || '')
      setColor(category?.color || '#234B38')
      setError('')
    }
  }, [open, category])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Kategoriya nomi kiritilishi shart')
      return
    }

    setSaving(true)
    const result = category
      ? await updateCategory(category.id, name.trim(), color)
      : await createCategory(name.trim(), color)
    setSaving(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast(
      category ? 'Kategoriya yangilandi' : "Yangi kategoriya qo'shildi",
      'success'
    )
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-3xl shadow-modal p-6 animate-scaleIn border border-darkText/5">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="font-display text-2xl font-bold text-darkText">
              {category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-xl hover:bg-cream transition-colors text-mutedText hover:text-darkText">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-darkText mb-1.5 block">
                Kategoriya nomi
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="Masalan: Sayohat"
                className="w-full h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest transition-all"
              />
              {error && <p className="text-xs text-tomato font-medium mt-1">{error}</p>}
            </div>

            <ColorPicker value={color} onChange={setColor} />

            {/* Oldindan ko'rish (Preview) */}
            <div>
              <label className="text-xs font-semibold text-mutedText uppercase tracking-wider mb-2 block">
                Ko'rinishi
              </label>
              <div className="flex items-center gap-3 p-3.5 bg-cream/70 rounded-2xl border border-darkText/5">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: color + '25' }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </span>
                <span className="text-sm font-bold text-darkText">
                  {name || 'Kategoriya nomi'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <Button variant="secondary" size="md" className="flex-1">
                  Bekor qilish
                </Button>
              </Dialog.Close>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                loading={saving}
                onClick={handleSave}
              >
                Saqlash
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function KategoriyalarPage() {
  const [userId, setUserId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)
  const [deleteCount, setDeleteCount] = useState(0)
  const [replaceCatId, setReplaceCatId] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = async (uid: string) => {
    setLoading(true)
    try {
      const cats = await getCategories(uid)
      setCategories(cats)
    } catch (e) {
      console.error('fetchCategories error:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      fetchCategories(user.id)
    })
  }, [])

  const handleDeleteClick = async (cat: Category) => {
    const count = await getCategoryTransactionCount(cat.id, userId)
    setDeleteCount(count)
    setReplaceCatId('')
    setDeleteCat(cat)
  }

  const handleDelete = async () => {
    if (!deleteCat) return
    if (deleteCount > 0 && !replaceCatId) {
      toast("Iltimos, almashtirish uchun boshqa kategoriyani tanlang", 'error')
      return
    }

    setDeleting(true)
    const result = await deleteCategory(
      deleteCat.id,
      deleteCount > 0 ? replaceCatId : undefined
    )
    setDeleting(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast("Kategoriya o'chirildi", 'success')
    setDeleteCat(null)
    fetchCategories(userId)
  }

  const defaults = categories.filter((c) => c.is_default || !c.user_id)
  const custom = categories.filter((c) => !c.is_default && c.user_id)

  const CategoryItem = ({
    cat,
    editable,
  }: {
    cat: Category
    editable: boolean
  }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-darkText/5 hover:border-darkText/15 transition-all group shadow-sm">
      <div className="flex items-center gap-3.5">
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cat.color + '18' }}
        >
          <span
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
        </span>
        <span className="text-sm font-semibold text-darkText">{cat.name}</span>
      </div>

      {editable ? (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditCat(cat)}
            className="p-2 rounded-xl hover:bg-forest/10 text-mutedText hover:text-forest transition-colors"
            title="Tahrirlash"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(cat)}
            className="p-2 rounded-xl hover:bg-tomato/10 text-mutedText hover:text-tomato transition-colors"
            title="O'chirish"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="p-2 text-mutedText/40" title="Standart kategoriya">
          <Lock className="h-4 w-4" />
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <PageHeader
        title="Kategoriyalar"
        description="Xarajat va daromad turlarini tartibga soling"
        actions={
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Yangi kategoriya
          </Button>
        }
      />

      {/* Shaxsiy kategoriyalar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Mening maxsus kategoriyalarim</CardTitle>
          <p className="text-xs text-mutedText">
            Siz tomoningizdan qo'shilgan va to'liq o'zgartirilishi mumkin bo'lgan kategoriyalar
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-2xl" />
                ))}
            </div>
          ) : custom.length === 0 ? (
            <EmptyState
              title="Shaxsiy kategoriyalar yo'q"
              description="Ehtiyojlaringizga mos o'z kategoriyalaringizni kiriting"
              action={{
                label: '+ Yangi kategoriya qo\'shish',
                onClick: () => setAddOpen(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {custom.map((cat) => (
                <CategoryItem key={cat.id} cat={cat} editable={true} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standart tizim kategoriyalari */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-xl">Standart tizim kategoriyalari</CardTitle>
            <span className="text-[11px] font-semibold text-mutedText px-2.5 py-0.5 bg-cream rounded-full border border-darkText/5">
              O'zgarmas
            </span>
          </div>
          <p className="text-xs text-mutedText">
            Tizim tomonidan oldindan taqdim etilgan umumiy kategoriyalar
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-2xl" />
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {defaults.map((cat) => (
                <CategoryItem key={cat.id} cat={cat} editable={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Qo'shish / Tahrirlash Modali */}
      <CategoryModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => fetchCategories(userId)}
      />

      {editCat && (
        <CategoryModal
          open={!!editCat}
          onOpenChange={(o) => !o && setEditCat(null)}
          category={editCat}
          onSuccess={() => {
            setEditCat(null)
            fetchCategories(userId)
          }}
        />
      )}

      {/* O'chirish Dialogi */}
      <ConfirmationDialog
        open={!!deleteCat}
        onOpenChange={(o) => !o && setDeleteCat(null)}
        title="Kategoriyani o'chirish"
        description={
          <div className="space-y-4 pt-1">
            <p>
              Haqiqatan ham "<strong>{deleteCat?.name}</strong>" kategoriyasini
              o'chirmoqchimisiz?
            </p>
            {deleteCount > 0 && (
              <div className="p-4 bg-tomato/10 rounded-2xl border border-tomato/20 space-y-2">
                <p className="text-tomato text-xs font-bold">
                  Diqqat: Ushbu kategoriyaga biriktirilgan {deleteCount} ta operatsiya mavjud.
                </p>
                <p className="text-xs text-darkText font-medium">
                  Ushbu operatsiyalarni boshqa kategoriyaga ko'chirish uchun tanlang:
                </p>
                <select
                  value={replaceCatId}
                  onChange={(e) => setReplaceCatId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-tomato/30 bg-white px-3 text-xs text-darkText focus:outline-none focus:ring-2 focus:ring-tomato"
                >
                  <option value="">Yangi kategoriyani tanlang</option>
                  {categories
                    .filter((c) => c.id !== deleteCat?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        }
        confirmLabel="O'chirish"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
