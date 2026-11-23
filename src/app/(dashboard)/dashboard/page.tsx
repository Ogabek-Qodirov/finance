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
  CreditCard,
  Banknote,
  ArrowRightLeft,
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
import { getAccountBalances } from '@/lib/queries/accounts'
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
import { AnalogClock } from '@/components/shared/analog-clock'
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal'
import { EditTransactionModal } from '@/components/transactions/edit-transaction-modal'
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog'
import { TransferModal } from '@/components/wallets/transfer-modal'
import {
  Transaction,
  MonthlyStats,
  CategoryStats,
  DailyExpense,
  BudgetStatus,
  Account,
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
  const [balances, setBalances] = useState<{
    cashBalance: number
    bankBalance: number
    totalBalance: number
    cashAccount: Account | null
    bankAccount: Account | null
  } | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')

  // Modallar holati
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalType, setAddModalType] = useState<'expense' | 'income'>('expense')
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [deleteTxn, setDeleteTxn] = useState<Transaction | null>(null)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  const fetchData = useCallback(async (uid: string, m: number, y: number) => {
    setLoading(true)
    try {
      const prevM = m === 1 ? 12 : m - 1
      const prevY = m === 1 ? y - 1 : y

      const [s, ps, cs, dd, rt, bs, b] = await Promise.all([
        getMonthlyStats(uid, m, y),
        getMonthlyStats(uid, prevM, prevY),
        getCategoryStats(uid, m, y),
        getDailyExpenses(uid, m, y),
        getRecentTransactions(uid, 8),
        getBudgetStatus(uid, m, y),
        getAccountBalances(uid),
      ])

      setStats(s)
      setPrevStats(ps)
      setCategoryStats(cs)
      setDailyData(dd)
      setRecentTxns(rt)
      setBudgetStatus(bs)
      setBalances(b)
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-mutedText text-xs sm:text-sm font-medium tracking-wide">
            {getTodayUzbekDate()}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-darkText mt-1 tracking-tight">
            {getCurrentGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}!
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <AnalogClock />

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

      {/* 1. MOLIYAVIY HISOB (Dual Wallet Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Umumiy mablag' */}
        <div className="p-5 rounded-3xl bg-forest text-cream shadow-sm relative overflow-hidden flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-cream/70 font-semibold block mb-0.5">
              Umumiy mablag&apos;
            </span>
            <span className="font-display text-2xl lg:text-3xl font-bold tabular-nums block">
              {formatCurrency(balances?.totalBalance || 0)}
            </span>
            <span className="text-[11px] text-cream/60 mt-0.5 block">
              Kartadagi + Naqd pul jami
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-mustard shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Bank kartasi */}
        <div className="p-5 rounded-3xl bg-white border border-darkText/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-mutedText font-semibold block mb-0.5">
              Kartadagi mablag&apos;
            </span>
            <span className="font-display text-2xl font-bold text-darkText tabular-nums block">
              {formatCurrency(balances?.bankBalance || 0)}
            </span>
            <span className="text-[11px] text-mutedText/80 mt-0.5 block">
              Bank kartasi balansi
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Naqd pul */}
        <div className="p-5 rounded-3xl bg-white border border-darkText/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-mutedText font-semibold block mb-0.5">
              Naqd pul
            </span>
            <span className="font-display text-2xl font-bold text-darkText tabular-nums block">
              {formatCurrency(balances?.cashBalance || 0)}
            </span>
            <button
              onClick={() => setTransferModalOpen(true)}
              className="text-[11px] font-semibold text-forest hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Pul o&apos;tkazish</span>
            </button>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-mustard/20 flex items-center justify-center text-mustard-dark shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4 ta Moliyaviy oylik ko'rsatkich kartalari */}
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
                          {Math.abs(change)}% o&apos;tgan oyga nisbatan
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
              <div className="h-72 skeleton rounded-2xl" />
            ) : !hasTransactionsInMonth ? (
              <div className="py-12">
                <EmptyState
                  icon={LineChartIcon}
                  title="Ushbu oyda hali operatsiyalar mavjud emas"
                  description={`${getMonthName(month)} ${year} oyi uchun ma'lumotlar kiritilmagan. Yangi amal qo'shib, oylik dinamikani ko'rishingiz mumkin.`}
                  actionLabel="+ Yangi operatsiya qo'shish"
                  onAction={() => {
                    setAddModalType('expense')
                    setAddModalOpen(true)
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={290}>
                  <LineChart
                    data={dailyData}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#EFEBE0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: '#77786F' }}
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
                          : `${v}`
                      }
                      tick={{ fontSize: 11, fill: '#77786F' }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip content={<CustomLineTooltip month={month} />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
                      formatter={(value) => (
                        <span className="text-xs text-darkText font-medium ml-1 mr-4">
                          {value === 'income' ? 'Daromad' : 'Xarajatlar'}
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="income"
                      stroke="#234B38"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#234B38', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#234B38' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="expenses"
                      stroke="#D9654D"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#D9654D', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#D9654D' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kategoriyalar taqsimoti */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Kategoriyalar ulushi</CardTitle>
            <p className="text-xs text-mutedText mt-0.5">
              Eng ko&apos;p mablag&apos; sarflangan yo&apos;nalishlar
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-4 skeleton rounded" />
                      <div className="h-2 skeleton rounded-full" />
                    </div>
                  ))}
              </div>
            ) : categoryStats.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="Kategoriyalar bo'sh"
                  description="Ushbu oy uchun xarajatlar kiritilmagan"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {categoryStats.slice(0, 5).map(({ category, total, percentage }) => (
                  <div key={category.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-darkText flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-darkText tabular-nums">
                          {formatCurrency(total)}
                        </span>
                        <span className="text-mutedText w-8 text-right font-medium">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-cream rounded-full overflow-hidden border border-darkText/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* So'nggi operatsiyalar ro'yxati */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl">So&apos;nggi operatsiyalar</CardTitle>
            <p className="text-xs text-mutedText mt-0.5">
              Oxirgi amalga oshirilgan pul o&apos;tkazmalari
            </p>
          </div>
          <Link
            href="/dashboard/xarajatlar"
            className="text-xs font-semibold text-forest hover:text-forest-dark flex items-center gap-1 transition-colors"
          >
            <span>Barchasi</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <div className="py-8">
              <EmptyState
                title="Hali operatsiyalar mavjud emas"
                description="Yangi xarajat yoki daromad kiritib, hisobingizni yuritishni boshlang."
                actionLabel="+ Operatsiya qo'shish"
                onAction={() => {
                  setAddModalType('expense')
                  setAddModalOpen(true)
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-darkText/10 text-mutedText text-xs font-semibold uppercase tracking-wider text-left">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Nomi / Izoh</th>
                    <th className="pb-3 font-semibold">Kategoriya</th>
                    <th className="pb-3 font-semibold">Manba</th>
                    <th className="pb-3 font-semibold text-right">Summa</th>
                    <th className="pb-3 font-semibold text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkText/5">
                  {recentTxns.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-cream/40 transition-colors group"
                    >
                      <td className="py-3.5 text-mutedText font-medium whitespace-nowrap">
                        {formatDate(t.transaction_date)}
                      </td>
                      <td className="py-3.5 font-semibold text-darkText">
                        {t.description || (t.type === 'expense' ? 'Xarajat' : 'Daromad')}
                      </td>
                      <td className="py-3.5">
                        {t.category ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-darkText/5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: t.category.color }}
                            />
                            {t.category.name}
                          </span>
                        ) : (
                          <span className="text-mutedText text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-mutedText">
                          {t.account?.account_type === 'cash' ? (
                            <>
                              <Banknote className="w-3.5 h-3.5 text-mustard-dark" />
                              <span>Naqd pul</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3.5 h-3.5 text-forest" />
                              <span>Karta</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={cn(
                            t.type === 'expense' ? 'text-tomato' : 'text-forest'
                          )}
                        >
                          {t.type === 'expense' ? '−' : '+'}
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTxn(t)}
                            className="p-1 rounded text-mutedText hover:text-darkText hover:bg-cream"
                            title="Tahrirlash"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTxn(t)}
                            className="p-1 rounded text-mutedText hover:text-tomato hover:bg-tomato/10"
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

      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
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
