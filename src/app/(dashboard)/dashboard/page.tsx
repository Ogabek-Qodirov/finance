'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Target,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  ChevronRight,
  LineChart as LineChartIcon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  getMonthlyStats,
  getCategoryStats,
  getDailyExpenses,
  getRecentTransactions,
} from '@/lib/queries/transactions'
import { getBudgetStatus } from '@/lib/queries/budgets'
import {
  formatCurrency,
  getTodayUzbekDate,
  getCurrentGreeting,
  formatDate,
  getMonthName,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AmountDisplay } from '@/components/shared/amount-display'
import { MonthSelector } from '@/components/shared/month-selector'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton'
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal'
import { EditTransactionModal } from '@/components/transactions/edit-transaction-modal'
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog'
import {
  Transaction,
  MonthlyStats,
  CategoryStats,
  DailyExpense,
  BudgetStatus,
} from '@/types'
import { cn } from '@/lib/utils'

// Interaktiv Chiziqli Grafik Tooltipi
const CustomLineTooltip = ({ active, payload, label, month }: any) => {
  if (!active || !payload?.length) return null

  const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0
  const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0
  const net = income - expenses

  return (
    <div className="bg-darkText text-cream rounded-2xl p-3.5 text-xs shadow-modal border border-cream/10 space-y-2 min-w-[170px]">
      <p className="text-cream/70 font-semibold border-b border-cream/10 pb-1.5">
        {label}-{getMonthName(month).toLowerCase()}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-cream/90 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-forest border border-white" />
            Daromad:
          </span>
          <span className="font-bold text-cream tabular-nums">
            +{formatCurrency(income)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-cream/90 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-tomato border border-white" />
            Xarajatlar:
          </span>
          <span className="font-bold text-cream tabular-nums">
            −{formatCurrency(expenses)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-cream/10 text-[11px]">
          <span className="text-cream/60">Sof farq:</span>
          <span
            className={cn(
              'font-bold tabular-nums',
              net >= 0 ? 'text-mustard' : 'text-tomato-light'
            )}
          >
            {net >= 0 ? '+' : ''}
            {formatCurrency(net)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [prevStats, setPrevStats] = useState<MonthlyStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [dailyData, setDailyData] = useState<DailyExpense[]>([])
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')

  // Modallar holati
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalType, setAddModalType] = useState<'expense' | 'income'>('expense')
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [deleteTxn, setDeleteTxn] = useState<Transaction | null>(null)

  const fetchData = useCallback(async (uid: string, m: number, y: number) => {
    setLoading(true)
    try {
      const prevM = m === 1 ? 12 : m - 1
      const prevY = m === 1 ? y - 1 : y

      const [s, ps, cs, dd, rt, bs] = await Promise.all([
        getMonthlyStats(uid, m, y),
        getMonthlyStats(uid, prevM, prevY),
        getCategoryStats(uid, m, y),
        getDailyExpenses(uid, m, y),
        getRecentTransactions(uid, 8),
        getBudgetStatus(uid, m, y),
      ])

      setStats(s)
      setPrevStats(ps)
      setCategoryStats(cs)
      setDailyData(dd)
      setRecentTxns(rt)
      setBudgetStatus(bs)
    } catch (e) {
      console.error('fetchData error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const name =
        user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      setUserName(name)
      fetchData(user.id, month, year)
    })
  }, [fetchData])

  useEffect(() => {
    if (userId) {
      fetchData(userId, month, year)
    }
  }, [month, year, userId, fetchData])

  const onMonthChange = (m: number, y: number) => {
    setMonth(m)
    setYear(y)
  }

  const calcChange = (curr: number, prev: number) => {
    if (!prev || prev === 0) return null
    return Math.round(((curr - prev) / prev) * 100)
  }

  const hasTransactionsInMonth = dailyData.some(
    (d) => d.expenses > 0 || d.income > 0
  )

  const statCards = stats
    ? [
        {
          label: 'Jami xarajatlar',
          amount: stats.totalExpenses,
          icon: ArrowDownCircle,
          color: 'text-tomato',
          bg: 'bg-tomato/10',
          type: 'expense' as const,
          change: calcChange(stats.totalExpenses, prevStats?.totalExpenses || 0),
          lowerIsBetter: true,
        },
        {
          label: 'Jami daromadlar',
          amount: stats.totalIncome,
          icon: ArrowUpCircle,
          color: 'text-forest',
          bg: 'bg-forest/10',
          type: 'income' as const,
          change: calcChange(stats.totalIncome, prevStats?.totalIncome || 0),
          lowerIsBetter: false,
        },
        {
          label: "Qolgan mablag'",
          amount: stats.netBalance,
          icon: Wallet,
          color: stats.netBalance >= 0 ? 'text-forest' : 'text-tomato',
          bg: 'bg-mustard/15',
          type: (stats.netBalance >= 0 ? 'income' : 'expense') as
            | 'income'
            | 'expense',
          change: null,
          lowerIsBetter: false,
        },
        {
          label: 'Oylik budjet',
          amount: budgetStatus?.budget?.amount || 0,
          icon: Target,
          color: 'text-softOrange',
          bg: 'bg-softOrange/10',
          type: 'neutral' as const,
          change: null,
          lowerIsBetter: false,
          budgetPct: budgetStatus?.percentage,
        },
      ]
    : []

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Yuqori qism (Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-mutedText text-xs sm:text-sm font-medium tracking-wide">
            {getTodayUzbekDate()}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-darkText mt-1 tracking-tight">
            {getCurrentGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}!
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setAddModalType('income')
              setAddModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Daromad
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setAddModalType('expense')
              setAddModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Yangi xarajat
          </Button>
        </div>
      </div>

      {/* 4 ta Moliyaviy umumiy kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(
              ({
                label,
                amount,
                icon: Icon,
                color,
                bg,
                type,
                change,
                lowerIsBetter,
                budgetPct,
              }) => (
                <Card key={label} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-mutedText font-medium tracking-wide uppercase">
                        {label}
                      </span>
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                        <Icon className={cn('h-4 w-4', color)} />
                      </div>
                    </div>

                    <AmountDisplay
                      amount={Math.abs(amount)}
                      type={type}
                      size="lg"
                      className="block mb-1"
                    />

                    {budgetPct !== undefined ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-darkText/5">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              budgetPct >= 100
                                ? 'bg-tomato'
                                : budgetPct >= 75
                                ? 'bg-mustard'
                                : 'bg-forest'
                            )}
                            style={{ width: `${Math.min(budgetPct || 0, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-mutedText">
                          <span>{budgetPct}% ishlatildi</span>
                          <span>
                            Qoldi:{' '}
                            {formatCurrency(Math.max(0, budgetStatus?.remaining || 0))}
                          </span>
                        </div>
                      </div>
                    ) : change !== null ? (
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-2 text-xs font-medium',
                          lowerIsBetter
                            ? change < 0
                              ? 'text-forest'
                              : 'text-tomato'
                            : change > 0
                            ? 'text-forest'
                            : 'text-tomato'
                        )}
                      >
                        {change > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {Math.abs(change)}% o'tgan oyga nisbatan
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-mutedText mt-2 block">
                        Joriy oylik balans
                      </span>
                    )}
                  </CardContent>
                </Card>
              )
            )}
      </div>

      {/* Oylik Sarf-xarajatlar Line Chart va Kategoriyalar taqsimoti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaktiv Chiziqli Grafik (Line Chart) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Oylik sarf-xarajatlar</CardTitle>
                <p className="text-xs text-mutedText mt-0.5">
                  Kunlik daromad va xarajatlar dinamikasi (Chiziqli grafik)
                </p>
              </div>
              <MonthSelector month={month} year={year} onChange={onMonthChange} />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="h-64 flex items-end gap-1.5 pt-6">
                {Array(20)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="skeleton flex-1 rounded-t-lg"
                      style={{ height: `${30 + Math.random() * 60}%` }}
                    />
                  ))}
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                {!hasTransactionsInMonth && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-cream/80 border border-darkText/10 text-xs">
                    <span className="text-mutedText font-medium">
                      {getMonthName(month)} {year} oyi uchun hali operatsiyalar kiritilmagan. Grafikda nol darajasi ko'rsatilmoqda.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAddModalType('expense')
                        setAddModalOpen(true)
                      }}
                      className="text-forest font-bold hover:underline self-start sm:self-auto"
                    >
                      + Yangi operatsiya qo'shish
                    </button>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={dailyData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#EFEBE0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: '#77786F' }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}M`
                          : v >= 1000
                          ? `${(v / 1000).toFixed(0)}K`
                          : String(v)
                      }
                      tick={{ fontSize: 10, fill: '#77786F' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      content={<CustomLineTooltip month={month} />}
                      cursor={{ stroke: '#234B38', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                      formatter={(value) => (
                        <span className="font-semibold text-darkText text-xs ml-1">
                          {value}
                        </span>
                      )}
                    />
                    {/* Daromad chizig'i (To'q o'rmon yashili) */}
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Daromad"
                      stroke="#234B38"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: '#234B38',
                        stroke: '#FFFFFF',
                        strokeWidth: 1.5,
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#234B38',
                        stroke: '#FFFFFF',
                        strokeWidth: 2,
                      }}
                    />
                    {/* Xarajatlar chizig'i (Pomidor qizili) */}
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Xarajatlar"
                      stroke="#D9654D"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: '#D9654D',
                        stroke: '#FFFFFF',
                        strokeWidth: 1.5,
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#D9654D',
                        stroke: '#FFFFFF',
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kategoriyalar taqsimoti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Kategoriyalar ulushi</CardTitle>
            <p className="text-xs text-mutedText">
              Eng ko'p mablag' sarflangan yo'nalishlar
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, i) => <SkeletonRow key={i} />)
            ) : categoryStats.length === 0 ? (
              <EmptyState
                title="Kategoriyalar bo'sh"
                description="Ushbu oy uchun xarajatlar kiritilmagan"
              />
            ) : (
              categoryStats.slice(0, 6).map(({ category, total, percentage }) => (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-darkText font-medium truncate">
                        {category.name}
                      </span>
                    </div>
                    <span className="tabular-nums font-semibold text-darkText text-xs sm:text-sm">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-cream rounded-full overflow-hidden border border-darkText/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-mutedText">
                    <span>Umumiy xarajatning</span>
                    <span className="font-medium">{percentage}% qismi</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* So'nggi operatsiyalar jadvali */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">So'nggi operatsiyalar</CardTitle>
              <p className="text-xs text-mutedText">
                Oxirgi amalga oshirilgan pul o'tkazmalari
              </p>
            </div>
            <Link href="/dashboard/xarajatlar">
              <Button variant="ghost" size="sm" className="text-forest hover:bg-forest/5">
                Barchasi <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <EmptyState
              title="Operatsiyalar mavjud emas"
              description="Hali hech qanday xarajat yoki daromad kiritilmagan"
              action={{
                label: '+ Birinchi xarajatni qo\'shish',
                onClick: () => {
                  setAddModalType('expense')
                  setAddModalOpen(true)
                },
              }}
            />
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[550px]">
                <thead>
                  <tr className="border-b border-darkText/5 text-mutedText text-xs font-semibold uppercase tracking-wider">
                    <th className="text-left px-6 py-3.5">Sana</th>
                    <th className="text-left px-6 py-3.5">Nomi / Izoh</th>
                    <th className="text-left px-6 py-3.5">Kategoriya</th>
                    <th className="text-right px-6 py-3.5">Summa</th>
                    <th className="text-right px-6 py-3.5">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkText/5">
                  {recentTxns.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-cream/40 transition-colors group"
                    >
                      <td className="px-6 py-3.5 text-xs text-mutedText whitespace-nowrap font-medium">
                        {formatDate(txn.transaction_date)}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-darkText max-w-[220px] truncate">
                        {txn.description ||
                          (txn.type === 'expense' ? 'Xarajat' : 'Daromad')}
                      </td>
                      <td className="px-6 py-3.5">
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
                      <td className="px-6 py-3.5 text-right">
                        <AmountDisplay
                          amount={txn.amount}
                          type={txn.type}
                          showSign
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTxn(txn)}
                            className="p-1.5 rounded-lg hover:bg-forest/10 text-mutedText hover:text-forest transition-colors"
                            title="Tahrirlash"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTxn(txn)}
                            className="p-1.5 rounded-lg hover:bg-tomato/10 text-mutedText hover:text-tomato transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
      <AddTransactionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        defaultType={addModalType}
        onSuccess={() => {
          if (userId) fetchData(userId, month, year)
        }}
      />

      {editTxn && (
        <EditTransactionModal
          open={!!editTxn}
          onOpenChange={(o) => !o && setEditTxn(null)}
          transaction={editTxn}
          onSuccess={() => {
            setEditTxn(null)
            if (userId) fetchData(userId, month, year)
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
            if (userId) fetchData(userId, month, year)
          }}
        />
      )}
    </div>
  )
}
