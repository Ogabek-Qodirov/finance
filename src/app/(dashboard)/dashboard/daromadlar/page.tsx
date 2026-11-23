'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getTransactions, getMonthlyStats } from '@/lib/queries/transactions'
import { getCategories } from '@/lib/queries/categories'
import { formatCurrency, getMonthName, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AmountDisplay } from '@/components/shared/amount-display'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonRow } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal'
import { EditTransactionModal } from '@/components/transactions/edit-transaction-modal'
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog'
import { Transaction, Category, TransactionFilters } from '@/types'

export default function DaromadlarPage() {
  const now = new Date()
  const [userId, setUserId] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalIncome, setTotalIncome] = useState(0)

  // Modals
  const [addOpen, setAddOpen] = useState(false)
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [deleteTxn, setDeleteTxn] = useState<Transaction | null>(null)

  // Filters
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'income',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    sortBy: 'newest',
  })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const PER_PAGE = 15

  const fetchData = useCallback(
    async (uid: string, f: TransactionFilters, catId?: string, query?: string) => {
      setLoading(true)
      try {
        const [txns, stats] = await Promise.all([
          getTransactions(uid, {
            ...f,
            categoryId: catId || undefined,
            search: query || undefined,
          }),
          getMonthlyStats(uid, f.month || now.getMonth() + 1, f.year || now.getFullYear()),
        ])
        setTransactions(txns)
        setTotalIncome(stats.totalIncome)
      } catch (e) {
        console.error('fetchData error:', e)
      }
      setLoading(false)
    },
    []
  )

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      getCategories(user.id).then(setCategories)
      fetchData(user.id, filters, selectedCategory, search)
    })
  }, [])

  useEffect(() => {
    if (userId) {
      setPage(0)
      fetchData(userId, filters, selectedCategory, search)
    }
  }, [filters, selectedCategory, search, userId, fetchData])

  const paged = transactions.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(transactions.length / PER_PAGE)

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <PageHeader
        title="Daromadlar"
        description={`${getMonthName(filters.month || now.getMonth() + 1)} ${filters.year || now.getFullYear()} dagi daromadlar ro'yxati`}
        actions={
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Yangi daromad
          </Button>
        }
      />

      {/* Filterlar paneli */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Qidiruv */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mutedText" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Izoh bo'yicha qidirish..."
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-darkText/15 bg-white text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest transition-all"
              />
            </div>

            {/* Oy tanlash */}
            <select
              value={`${filters.month}-${filters.year}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-')
                setFilters((f) => ({ ...f, month: +m, year: +y }))
              }}
              className="h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                return { m: d.getMonth() + 1, y: d.getFullYear() }
              }).map(({ m, y }) => (
                <option key={`${m}-${y}`} value={`${m}-${y}`}>
                  {getMonthName(m)} {y}
                </option>
              ))}
            </select>

            {/* Kategoriya */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="">Barcha kategoriyalar</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Saralash */}
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sortBy: e.target.value as any }))
              }
              className="h-11 rounded-xl border border-darkText/15 bg-white px-3.5 text-sm text-darkText focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="newest">Eng yangi</option>
              <option value="oldest">Eng eski</option>
              <option value="highest">Eng katta summa</option>
              <option value="lowest">Eng kichik summa</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Hisobot qatori */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <span className="text-sm text-mutedText font-medium">
          Topildi: <span className="text-darkText font-semibold">{transactions.length} ta daromad</span>
        </span>
        <span className="text-sm font-medium text-darkText">
          Jami daromad:{' '}
          <span className="text-forest font-bold tabular-nums text-base">
            {formatCurrency(totalIncome)}
          </span>
        </span>
      </div>

      {/* Jadval */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
            </div>
          ) : paged.length === 0 ? (
            <EmptyState
              title="Daromadlar topilmadi"
              description="Ushbu oy uchun hech qanday daromad kiritilmagan"
              action={{
                label: '+ Yangi daromad',
                onClick: () => setAddOpen(true),
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px]">
                  <thead>
                    <tr className="border-b border-darkText/5 text-mutedText text-xs font-semibold uppercase tracking-wider">
                      <th className="text-left px-6 py-4">Sana</th>
                      <th className="text-left px-6 py-4">Nomi / Izoh</th>
                      <th className="text-left px-6 py-4">Kategoriya</th>
                      <th className="text-right px-6 py-4">Summa</th>
                      <th className="text-right px-6 py-4">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-darkText/5">
                    {paged.map((txn) => (
                      <tr
                        key={txn.id}
                        className="hover:bg-cream/40 transition-colors group"
                      >
                        <td className="px-6 py-4 text-xs font-medium text-mutedText whitespace-nowrap">
                          {formatDate(txn.transaction_date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-darkText max-w-[220px] truncate">
                          {txn.description || 'Daromad'}
                        </td>
                        <td className="px-6 py-4">
                          {txn.category ? (
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-darkText/5"
                              style={{
                                backgroundColor: txn.category.color + '15',
                                color: txn.category.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: txn.category.color }}
                              />
                              {txn.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-mutedText">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <AmountDisplay
                            amount={txn.amount}
                            type="income"
                            showSign
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditTxn(txn)}
                              className="p-1.5 rounded-lg hover:bg-forest/10 text-mutedText hover:text-forest transition-colors"
                              title="Tahrirlash"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTxn(txn)}
                              className="p-1.5 rounded-lg hover:bg-tomato/10 text-mutedText hover:text-tomato transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sahifalash */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-darkText/5">
                  <span className="text-xs text-mutedText">
                    Sahifa {page + 1} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Oldingi
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Keyingi
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modallar */}
      <AddTransactionModal
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultType="income"
        onSuccess={() => {
          if (userId) fetchData(userId, filters, selectedCategory, search)
        }}
      />

      {editTxn && (
        <EditTransactionModal
          open={!!editTxn}
          onOpenChange={(o) => !o && setEditTxn(null)}
          transaction={editTxn}
          onSuccess={() => {
            setEditTxn(null)
            if (userId) fetchData(userId, filters, selectedCategory, search)
          }}
        />
      )}

      {deleteTxn && (
        <DeleteTransactionDialog
          open={!!deleteTxn}
          onOpenChange={(o) => !o && setDeleteTxn(null)}
          transaction={deleteTxn}
          onSuccess={() => {
            setDeleteTxn(null)
            if (userId) fetchData(userId, filters, selectedCategory, search)
          }}
        />
      )}
    </div>
  )
}
