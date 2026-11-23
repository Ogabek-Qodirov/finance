'use client'
import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCategories } from '@/lib/queries/categories'
import { createTransaction } from '@/lib/actions/transactions'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Category } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z
    .string()
    .min(1, 'Summa kiritilishi shart')
    .refine((v) => Number(v) > 0, { message: "Summa 0 dan katta bo'lishi kerak" }),
  categoryId: z.string().min(1, 'Kategoriya tanlanishi shart'),
  description: z.string().optional(),
  transactionDate: z.string().min(1, 'Sana kiritilishi shart'),
})

type FormData = z.infer<typeof schema>

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: 'expense' | 'income'
  onSuccess: () => void
}

export function AddTransactionModal({
  open,
  onOpenChange,
  defaultType = 'expense',
  onSuccess,
}: AddTransactionModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      amount: '',
      categoryId: '',
      description: '',
      transactionDate: today,
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      type: defaultType,
      amount: '',
      categoryId: '',
      description: '',
      transactionDate: today,
    })
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getCategories(user.id).then(setCategories)
      }
    })
  }, [open, defaultType])

  const onSubmit = async (data: FormData) => {
    const result = await createTransaction({
      type: data.type,
      amount: Number(data.amount),
      categoryId: data.categoryId,
      description: data.description?.trim() || undefined,
      transactionDate: data.transactionDate,
    })

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast("Operatsiya muvaffaqiyatli saqlandi", 'success')
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-modal animate-scaleIn max-h-[90vh] overflow-y-auto border border-darkText/5">
          <div className="flex items-center justify-between p-6 border-b border-darkText/5">
            <Dialog.Title className="font-display text-2xl font-bold text-darkText">
              Yangi operatsiya
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-xl hover:bg-cream transition-colors text-mutedText hover:text-darkText">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Tur tanlash: Xarajat / Daromad */}
            <div>
              <label className="text-sm font-medium text-darkText mb-2 block">
                Operatsiya turi
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="flex rounded-xl border border-darkText/15 p-1 bg-cream/40">
                    {(['expense', 'income'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={cn(
                          'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                          field.value === t
                            ? t === 'expense'
                              ? 'bg-tomato text-white shadow-sm'
                              : 'bg-forest text-cream shadow-sm'
                            : 'text-mutedText hover:text-darkText hover:bg-white/60'
                        )}
                      >
                        {t === 'expense' ? 'Xarajat' : 'Daromad'}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Summa */}
            <Input
              label="Summa (UZS)"
              type="number"
              placeholder="Masalan: 150000"
              min="1"
              step="any"
              error={errors.amount?.message}
              {...register('amount')}
            />

            {/* Kategoriya */}
            <div>
              <label className="text-sm font-medium text-darkText mb-1.5 block">
                Kategoriya
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(
                      'w-full h-11 rounded-xl border bg-white px-3.5 text-sm text-darkText transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent',
                      errors.categoryId ? 'border-tomato' : 'border-darkText/15 hover:border-darkText/30'
                    )}
                  >
                    <option value="">Kategoriyani tanlang</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-tomato font-medium mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Izoh */}
            <Textarea
              label="Izoh (ixtiyoriy)"
              placeholder="Xarajat yoki daromad haqida qisqacha ma'lumot..."
              error={errors.description?.message}
              {...register('description')}
            />

            {/* Sana */}
            <Input
              label="Operatsiya sanasi"
              type="date"
              error={errors.transactionDate?.message}
              {...register('transactionDate')}
            />

            {/* Tugmalar */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <Button variant="secondary" size="md" className="flex-1" type="button">
                  Bekor qilish
                </Button>
              </Dialog.Close>
              <Button variant="primary" size="md" className="flex-1" type="submit" loading={isSubmitting}>
                Saqlash
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
