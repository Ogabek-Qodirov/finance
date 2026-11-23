'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ArrowRightLeft, CreditCard, Banknote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAccounts } from '@/lib/queries/accounts'
import { createTransfer } from '@/lib/actions/transfers'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Account } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  fromAccountId: z.string().min(1, 'Manba hamyon tanlanishi shart'),
  toAccountId: z.string().min(1, 'Qabul qiluvchi hamyon tanlanishi shart'),
  amount: z
    .string()
    .min(1, 'Summa kiritilishi shart')
    .refine((v) => Number(v) > 0, { message: "Summa 0 dan katta bo'lishi kerak" }),
  transferDate: z.string().min(1, 'Sana kiritilishi shart'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TransferModal({ open, onOpenChange, onSuccess }: TransferModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: '',
      transferDate: today,
      description: '',
    },
  })

  const fromAccountId = watch('fromAccountId')
  const toAccountId = watch('toAccountId')

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getAccounts(user.id).then((accs) => {
          setAccounts(accs)
          const cash = accs.find((a) => a.account_type === 'cash')
          const bank = accs.find((a) => a.account_type === 'bank')
          // Default: Naqd pul -> Bank kartasi
          if (cash && bank) {
            setValue('fromAccountId', cash.id)
            setValue('toAccountId', bank.id)
          } else if (accs.length >= 2) {
            setValue('fromAccountId', accs[0].id)
            setValue('toAccountId', accs[1].id)
          }
        })
      }
    })
  }, [open, setValue])

  const handleSwap = () => {
    const curFrom = fromAccountId
    const curTo = toAccountId
    setValue('fromAccountId', curTo)
    setValue('toAccountId', curFrom)
  }

  const onSubmit = async (data: FormData) => {
    if (data.fromAccountId === data.toAccountId) {
      toast("Chiqish va kirish hamyoni bir xil bo'lishi mumkin emas", 'error')
      return
    }

    const fromAcc = accounts.find((a) => a.id === data.fromAccountId)
    if (fromAcc && Number(fromAcc.balance) < Number(data.amount)) {
      toast("Hamyonda yetarli mablag' mavjud emas", 'error')
      return
    }

    const result = await createTransfer({
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: Number(data.amount),
      description: data.description?.trim() || undefined,
      transferDate: data.transferDate,
    })

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast("Pul o'tkazmasi muvaffaqiyatli bajarildi", 'success')
    reset()
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl border border-darkText/5 p-0 shadow-modal animate-scaleIn max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-darkText/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="font-display text-xl font-bold text-darkText">
                  Pul o&apos;tkazish
                </Dialog.Title>
                <p className="text-xs text-mutedText">Hamyonlar o&apos;rtasida ichki transfer</p>
              </div>
            </div>
            <Dialog.Close className="p-2 rounded-xl hover:bg-cream transition-colors text-mutedText hover:text-darkText">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Yo'nalish: Qayerdan -> Qayerga */}
            <div className="relative rounded-2xl bg-cream/40 border border-darkText/10 p-3.5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block mb-1">
                  Qayerdan (Chiqish)
                </label>
                <select
                  {...register('fromAccountId')}
                  className="w-full h-10 rounded-xl border border-darkText/15 bg-white px-3 text-sm text-darkText font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                >
                  <option value="">Hamyonni tanlang</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === toAccountId}>
                      {a.name} ({Number(a.balance).toLocaleString('uz-UZ')} so&apos;m)
                    </option>
                  ))}
                </select>
                {errors.fromAccountId && (
                  <p className="text-xs text-tomato mt-1">{errors.fromAccountId.message}</p>
                )}
              </div>

              {/* Swap button */}
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full bg-white border border-darkText/15 shadow-sm hover:bg-cream flex items-center justify-center text-forest transition-colors"
                  title="O'rnini almashtirish"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block mb-1">
                  Qayerga (Kirish)
                </label>
                <select
                  {...register('toAccountId')}
                  className="w-full h-10 rounded-xl border border-darkText/15 bg-white px-3 text-sm text-darkText font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                >
                  <option value="">Hamyonni tanlang</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                      {a.name} ({Number(a.balance).toLocaleString('uz-UZ')} so&apos;m)
                    </option>
                  ))}
                </select>
                {errors.toAccountId && (
                  <p className="text-xs text-tomato mt-1">{errors.toAccountId.message}</p>
                )}
              </div>
            </div>

            {/* Summa */}
            <Input
              label="Summa (UZS)"
              type="number"
              placeholder="Masalan: 200000"
              min="1"
              error={errors.amount?.message}
              {...register('amount')}
            />

            {/* Sana */}
            <Input
              label="O'tkazma sanasi"
              type="date"
              error={errors.transferDate?.message}
              {...register('transferDate')}
            />

            {/* Izoh */}
            <Textarea
              label="Izoh (ixtiyoriy)"
              placeholder="Masalan: Bankomatdan naqd pul yechish..."
              rows={2}
              {...register('description')}
            />

            <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 text-xs text-forest/90">
              ℹ️ <strong>Eslatma:</strong> Ichki o&apos;tkazmalar oylik xarajat yoki daromadga ta&apos;sir qilmaydi. Umumiy mablag&apos; o&apos;zgarmaydi.
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <Button variant="secondary" size="md" className="flex-1" type="button">
                  Bekor qilish
                </Button>
              </Dialog.Close>
              <Button variant="primary" size="md" className="flex-1" type="submit" loading={isSubmitting}>
                O&apos;tkazish
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
