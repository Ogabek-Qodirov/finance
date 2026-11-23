'use client'
import { useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { deleteTransaction } from '@/lib/actions/transactions'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/types'

interface DeleteTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
  onSuccess: () => void
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteTransaction(transaction.id)
    setLoading(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast("Operatsiya o'chirildi", 'success')
    onOpenChange(false)
    onSuccess()
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-darkText/40 backdrop-blur-sm z-50 animate-fadeIn" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-3xl shadow-modal p-6 animate-scaleIn border border-darkText/5">
          <AlertDialog.Title className="font-display text-2xl font-bold text-darkText mb-2">
            Operatsiyani o'chirish
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-mutedText mb-5 leading-relaxed">
            Haqiqatan ham ushbu operatsiyani o'chirmoqchimisiz? Ushbu amal qaytarilmaydi.
          </AlertDialog.Description>

          <div className="bg-cream/70 rounded-2xl p-4 mb-6 space-y-1.5 border border-darkText/5">
            <p className="text-sm font-semibold text-darkText truncate">
              {transaction.description || (transaction.type === 'expense' ? 'Xarajat' : 'Daromad')}
            </p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: transaction.type === 'expense' ? '#D9654D' : '#234B38' }}
            >
              {formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-mutedText font-medium">
              {formatDate(transaction.transaction_date)}
            </p>
          </div>

          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" size="md" className="flex-1" disabled={loading}>
                Bekor qilish
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              loading={loading}
              onClick={handleDelete}
            >
              O'chirish
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
