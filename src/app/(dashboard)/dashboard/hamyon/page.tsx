'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Plus,
  RefreshCw,
  History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAccounts, getAccountBalances } from '@/lib/queries/accounts'
import { getTransfers } from '@/lib/queries/transfers'
import { deleteTransfer } from '@/lib/actions/transfers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton'
import { TransferModal } from '@/components/wallets/transfer-modal'
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal'
import { toast } from '@/hooks/use-toast'
import { Account, Transfer } from '@/types'

export default function HamyonPage() {
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<{
    cashBalance: number
    bankBalance: number
    totalBalance: number
    cashAccount: Account | null
    bankAccount: Account | null
  } | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [txnModalOpen, setTxnModalOpen] = useState(false)
  const [txnModalType, setTxnModalType] = useState<'expense' | 'income'>('income')
  const [userId, setUserId] = useState<string>('')

  const loadData = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const [b, tr] = await Promise.all([
        getAccountBalances(uid),
        getTransfers(uid),
      ])
      setBalances(b)
      setTransfers(tr)
    } catch (e) {
      console.error('loadData error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadData(user.id)
      }
    })
  }, [loadData])

  const handleDeleteTransfer = async (transferId: string) => {
    if (!confirm("O'tkazmani bekor qilmoqchimisiz? Mablag'lar asl hamyonlariga qaytariladi.")) return
    const res = await deleteTransfer(transferId)
    if (res?.error) {
      toast(res.error, 'error')
      return
    }
    toast("O'tkazma bekor qilindi va balanslar tiklandi", 'success')
    if (userId) loadData(userId)
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest text-sm font-semibold mb-1">
            <Wallet className="w-4 h-4" />
            <span>Moliyaviy hisoblar</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-darkText tracking-tight">
            Hamyonlarim
          </h1>
          <p className="text-mutedText text-sm mt-1">
            Bank kartasi va naqd pul mablag&apos;larini boshqarish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setTxnModalType('income')
              setTxnModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Mablag&apos; qo&apos;shish
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setTransferModalOpen(true)}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Pul o&apos;tkazish
          </Button>
        </div>
      </div>

      {/* Balans Kartalari */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Jami mablag' */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-forest to-[#1A382A] text-cream shadow-card relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-cream/70 font-semibold">
                Umumiy mablag&apos;
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-mustard">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display text-3xl lg:text-4xl font-bold text-cream tabular-nums mb-1">
              {formatCurrency(balances?.totalBalance || 0)}
            </div>
            <p className="text-xs text-cream/70">
              Bank kartasi + Naqd pul jami balansi
            </p>
          </div>

          {/* Bank kartasi */}
          <div className="rounded-3xl p-6 bg-white border border-darkText/10 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-mutedText font-semibold">
                Bank kartasi
              </span>
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-darkText tabular-nums mb-1">
              {formatCurrency(balances?.bankBalance || 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-mutedText pt-2 border-t border-darkText/5 mt-3">
              <span>Ulushi:</span>
              <span className="font-semibold text-darkText">
                {balances?.totalBalance
                  ? Math.round(((balances.bankBalance || 0) / balances.totalBalance) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Naqd pul */}
          <div className="rounded-3xl p-6 bg-white border border-darkText/10 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-mutedText font-semibold">
                Naqd pul
              </span>
              <div className="w-9 h-9 rounded-xl bg-mustard/20 flex items-center justify-center text-mustard-dark">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-darkText tabular-nums mb-1">
              {formatCurrency(balances?.cashBalance || 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-mutedText pt-2 border-t border-darkText/5 mt-3">
              <span>Ulushi:</span>
              <span className="font-semibold text-darkText">
                {balances?.totalBalance
                  ? Math.round(((balances.cashBalance || 0) / balances.totalBalance) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* O'tkazmalar tarixi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
              <History className="w-4 h-4" />
            </div>
            <CardTitle className="text-xl">O&apos;tkazmalar tarixi</CardTitle>
          </div>
          {userId && (
            <button
              onClick={() => loadData(userId)}
              className="text-xs text-mutedText hover:text-darkText flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yangilash</span>
            </button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : transfers.length === 0 ? (
            <EmptyState
              title="Hozircha o'tkazmalar mavjud emas"
              description="Bank kartasi va naqd pul o'rtasida pul o'tkazganingizda, ular shu yerda ko'rinadi."
              actionLabel="Pul o'tkazish"
              onAction={() => setTransferModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-darkText/10 text-mutedText text-xs font-semibold uppercase tracking-wider text-left">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Qayerdan</th>
                    <th className="pb-3 font-semibold">Qayerga</th>
                    <th className="pb-3 font-semibold">Izoh</th>
                    <th className="pb-3 font-semibold text-right">Summa</th>
                    <th className="pb-3 font-semibold text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkText/5">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-3.5 text-mutedText font-medium whitespace-nowrap">
                        {formatDate(tr.transfer_date)}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-darkText/5 font-medium text-xs text-darkText">
                          {tr.from_account?.account_type === 'cash' ? (
                            <Banknote className="w-3.5 h-3.5 text-mustard-dark" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-forest" />
                          )}
                          {tr.from_account?.name || 'Hamyon'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-darkText/5 font-medium text-xs text-darkText">
                          {tr.to_account?.account_type === 'cash' ? (
                            <Banknote className="w-3.5 h-3.5 text-mustard-dark" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-forest" />
                          )}
                          {tr.to_account?.name || 'Hamyon'}
                        </span>
                      </td>
                      <td className="py-3.5 text-mutedText max-w-xs truncate">
                        {tr.description || '—'}
                      </td>
                      <td className="py-3.5 text-right font-bold text-darkText tabular-nums whitespace-nowrap">
                        {formatCurrency(tr.amount)}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTransfer(tr.id)}
                          className="p-1.5 rounded-lg text-mutedText hover:text-tomato hover:bg-tomato/10 transition-colors"
                          title="Bekor qilish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modallar */}
      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        onSuccess={() => {
          if (userId) loadData(userId)
        }}
      />

      <AddTransactionModal
        open={txnModalOpen}
        onOpenChange={setTxnModalOpen}
        defaultType={txnModalType}
        onSuccess={() => {
          if (userId) loadData(userId)
        }}
      />
    </div>
  )
}
