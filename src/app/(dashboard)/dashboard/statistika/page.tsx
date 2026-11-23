'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  CreditCard,
  Banknote,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import {
  getMonthlyStats,
  getCategoryStats,
  getDailyExpenses,
} from '@/lib/queries/transactions'
import {
  getMonthlyComparison,
  getHighestSpendingDay,
} from '@/lib/queries/analytics'
import {
  formatCurrency,
  getMonthName,
  formatDateShort,
} from '@/lib/utils'
import { MonthSelector } from '@/components/shared/month-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import {
  MonthlyStats,
  CategoryStats,
  DailyExpense,
  MonthlyComparison,
} from '@/types'
import { cn } from '@/lib/utils'

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
}: any) => {
  if (percentage < 6) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${Math.round(percentage)}%`}
    </text>
  )
}

export default function StatistikaPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryStats[]>([])
  const [dailyData, setDailyData] = useState<DailyExpense[]>([])
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null)
  const [topDay, setTopDay] = useState<{ date: string; amount: number } | null>(null)

  const fetchData = useCallback(async (uid: string, m: number, y: number) => {
    setLoading(true)
    try {
      const [s, cs, dd, comp, td] = await Promise.all([
        getMonthlyStats(uid, m, y),
        getCategoryStats(uid, m, y),
        getDailyExpenses(uid, m, y),
        getMonthlyComparison(uid, m, y),
        getHighestSpendingDay(uid, m, y),
      ])
      setStats(s)
      setCategoryData(cs)
      setDailyData(dd)
      setComparison(comp)
      setTopDay(td)
    } catch (e) {
      console.error('Statistika fetchData error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      fetchData(user.id, month, year)
    })
  }, [fetchData])

  useEffect(() => {
    if (userId) {
      fetchData(userId, month, year)
    }
  }, [month, year, userId, fetchData])

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const totalExpense = stats?.totalExpenses || 0
  const cardExpense = stats?.cardExpenses || 0
  const cashExpense = stats?.cashExpenses || 0
  const cardPct = totalExpense > 0 ? Math.round((cardExpense / totalExpense) * 100) : 0
  const cashPct = totalExpense > 0 ? Math.round((cashExpense / totalExpense) * 100) : 0

  const paymentSourceData = [
    { name: 'Bank kartasi', value: cardExpense, color: '#234B38', percentage: cardPct },
    { name: 'Naqd pul', value: cashExpense, color: '#E5B94F', percentage: cashPct },
  ].filter((d) => d.value > 0)

  const overviewCards = stats
    ? [
        {
          label: 'Jami xarajatlar',
          value: formatCurrency(stats.totalExpenses),
          sub: `${stats.transactionCount} ta operatsiya`,
          color: 'text-tomato',
        },
        {
          label: 'Jami daromadlar',
          value: formatCurrency(stats.totalIncome),
          sub: 'Ushbu oy tushumi',
          color: 'text-forest',
        },
        {
          label: 'Sof balans',
          value: formatCurrency(Math.abs(stats.netBalance)),
          sub: stats.netBalance >= 0 ? "Ijobiy qoldiq" : "Kamomad (xarajat ko'p)",
          color: stats.netBalance >= 0 ? 'text-forest' : 'text-tomato',
        },
        {
          label: "O'rtacha kunlik xarajat",
          value: formatCurrency(stats.avgDailyExpenses),
          sub: "Faol xarajat kunlari bo'yicha",
          color: 'text-darkText',
        },
        {
          label: "Eng ko'p xarajat qilingan kun",
          value: topDay ? formatDateShort(topDay.date) : '—',
          sub: topDay ? formatCurrency(topDay.amount) : "Ma'lumot yo'q",
          color: 'text-darkText',
        },
        {
          label: 'Eng yirik xarajat sohasi',
          value: categoryData[0]?.category.name || '—',
          sub: categoryData[0] ? formatCurrency(categoryData[0].total) : "Ma'lumot yo'q",
          color: 'text-darkText',
        },
      ]
    : []

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <PageHeader
        title="Statistika va Tahlil"
        description="Moliyaviy odatlaringiz va oylik taqqoslashlar hisoboti"
        actions={
          <MonthSelector
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m)
              setYear(y)
            }}
          />
        }
      />

      {/* 6 ta asosiy tahliliy kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading
          ? Array(6)
              .fill(0)
              .map((_, i) => <SkeletonCard key={i} />)
          : overviewCards.map(({ label, value, sub, color }) => (
              <Card key={label} className="card-hover">
                <CardContent className="p-6">
                  <p className="text-xs text-mutedText font-semibold tracking-wide uppercase mb-2">
                    {label}
                  </p>
                  <p className={cn('font-display text-2xl font-bold tabular-nums', color)}>
                    {value}
                  </p>
                  {sub && <p className="text-xs text-mutedText mt-1.5 font-medium">{sub}</p>}
                </CardContent>
              </Card>
            ))}
      </div>

      {/* 2. TO'LOV MANBASI BO'YICHA STATISTIKA (Karta vs Naqd pul) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">To&apos;lov manbasi bo&apos;yicha xarajatlar</CardTitle>
          <p className="text-xs text-mutedText">
            Kartadan va naqd puldan sarflangan mablag&apos;lar tahlili
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 skeleton rounded-2xl" />
          ) : totalExpense === 0 ? (
            <EmptyState
              title="Xarajatlar mavjud emas"
              description="Bu oyda hali to'lovlar amalga oshirilmagan"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Donut chart */}
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentSourceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {paymentSourceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Xarajat']}
                      contentStyle={{
                        background: '#252820',
                        border: 'none',
                        borderRadius: 16,
                        color: '#F8F5EC',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Tafsilotlar: Karta & Naqd */}
              <div className="md:col-span-2 space-y-4">
                {/* Bank kartasi */}
                <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest/15 flex items-center justify-center text-forest">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                        Bank kartasi orqali
                      </div>
                      <div className="font-display text-xl font-bold text-darkText tabular-nums mt-0.5">
                        {formatCurrency(cardExpense)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-forest">{cardPct}%</span>
                    <div className="text-[11px] text-mutedText">ulushi</div>
                  </div>
                </div>

                {/* Naqd pul */}
                <div className="p-4 rounded-2xl bg-mustard/10 border border-mustard/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mustard/25 flex items-center justify-center text-mustard-dark">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                        Naqd pul orqali
                      </div>
                      <div className="font-display text-xl font-bold text-darkText tabular-nums mt-0.5">
                        {formatCurrency(cashExpense)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-mustard-dark">{cashPct}%</span>
                    <div className="text-[11px] text-mutedText">ulushi</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2 ustunli grafiklar bloki */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kunlik moliyaviy dinamika (Daromad va Xarajatlar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Moliyaviy dinamika</CardTitle>
            <p className="text-xs text-mutedText">Oy davomida daromad va xarajatlar to&apos;lqini</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 skeleton rounded-2xl" />
            ) : dailyData.every((d) => d.expenses === 0 && d.income === 0) ? (
              <EmptyState title="Ma'lumot topilmadi" description="Bu oyda hali moliyaviy operatsiyalar qayd etilmagan" />
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#234B38" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#234B38" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D9654D" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D9654D" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEBE0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: '#77786F' }}
                      axisLine={false}
                      tickLine={false}
                      interval={3}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`
                      }
                      tick={{ fontSize: 10, fill: '#77786F' }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        formatCurrency(v),
                        name === 'income' ? 'Daromad' : 'Xarajat',
                      ]}
                      labelFormatter={(l) => `${l}-kun`}
                      contentStyle={{
                        background: '#252820',
                        border: 'none',
                        borderRadius: 16,
                        color: '#F8F5EC',
                        fontSize: 12,
                        padding: '10px 14px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Daromad"
                      stroke="#234B38"
                      strokeWidth={2}
                      fill="url(#incomeAreaGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Xarajatlar"
                      stroke="#D9654D"
                      strokeWidth={2}
                      fill="url(#expenseAreaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-darkText/5">
                  <span className="flex items-center gap-2 text-xs text-mutedText font-medium">
                    <span className="w-3 h-3 rounded-md bg-forest block shadow-sm" />
                    Daromad
                  </span>
                  <span className="flex items-center gap-2 text-xs text-mutedText font-medium">
                    <span className="w-3 h-3 rounded-md bg-tomato block shadow-sm" />
                    Xarajatlar
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kategoriyalar donut diagrammasi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Kategoriyalar doiraviy grafigi</CardTitle>
            <p className="text-xs text-mutedText">Xarajatlarning sohalar bo&apos;yicha ulushi</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 skeleton rounded-2xl" />
            ) : categoryData.length === 0 ? (
              <EmptyState
                title="Xarajatlar kategoriyasi yo'q"
                description="Ushbu oyda hali xarajatlar qayd etilmagan. Xarajat kiritilgach, ulushlar diagrammada aks etadi."
              />
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey={(d: any) => d.category.name}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.category.color} stroke="#FFFFFF" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Summa']}
                      contentStyle={{
                        background: '#252820',
                        border: 'none',
                        borderRadius: 16,
                        color: '#F8F5EC',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-darkText/5 justify-center">
                  {categoryData.map(({ category, percentage }) => (
                    <span key={category.id} className="flex items-center gap-1.5 text-xs text-mutedText">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-darkText">{category.name}</span>
                      <span className="text-[11px] text-mutedText">({percentage}%)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Oylik taqqoslash (Current vs Previous) */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Oylik solishtirma hisobot</CardTitle>
            <p className="text-xs text-mutedText">
              {getMonthName(month)} {year} va {getMonthName(prevMonth)} {prevYear} o&apos;rtasidagi farq
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Xarajat taqqoslash */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-darkText">Xarajatlar o&apos;zgarishi</span>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
                      comparison.expenseChange <= 0
                        ? 'bg-forest/10 text-forest'
                        : 'bg-tomato/10 text-tomato'
                    )}
                  >
                    {comparison.expenseChange > 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(comparison.expenseChange)}% {comparison.expenseChange <= 0 ? 'tejaldi' : 'oshdi'}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs text-mutedText mb-1">
                      <span>{getMonthName(month)} (Bu oy)</span>
                      <span className="font-semibold text-darkText">
                        {formatCurrency(comparison.currentExpenses)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden border border-darkText/5">
                      <div
                        className="h-full bg-forest rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            (comparison.currentExpenses /
                              (Math.max(comparison.currentExpenses, comparison.previousExpenses) || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-mutedText mb-1">
                      <span>{getMonthName(prevMonth)} (O&apos;tgan oy)</span>
                      <span className="font-semibold text-darkText">
                        {formatCurrency(comparison.previousExpenses)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden border border-darkText/5">
                      <div
                        className="h-full bg-mutedText/40 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            (comparison.previousExpenses /
                              (Math.max(comparison.currentExpenses, comparison.previousExpenses) || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Daromad taqqoslash */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-darkText">Daromadlar o&apos;zgarishi</span>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
                      comparison.incomeChange >= 0
                        ? 'bg-forest/10 text-forest'
                        : 'bg-tomato/10 text-tomato'
                    )}
                  >
                    {comparison.incomeChange >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(comparison.incomeChange)}% {comparison.incomeChange >= 0 ? "o'sdi" : 'kamaydi'}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs text-mutedText mb-1">
                      <span>{getMonthName(month)} (Bu oy)</span>
                      <span className="font-semibold text-darkText">
                        {formatCurrency(comparison.currentIncome)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden border border-darkText/5">
                      <div
                        className="h-full bg-softOrange rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            (comparison.currentIncome /
                              (Math.max(comparison.currentIncome, comparison.previousIncome) || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-mutedText mb-1">
                      <span>{getMonthName(prevMonth)} (O&apos;tgan oy)</span>
                      <span className="font-semibold text-darkText">
                        {formatCurrency(comparison.previousIncome)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden border border-darkText/5">
                      <div
                        className="h-full bg-mutedText/40 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            (comparison.previousIncome /
                              (Math.max(comparison.currentIncome, comparison.previousIncome) || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kategoriya bo'yicha batafsil jadval */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kategoriyalar bo&apos;yicha batafsil hisobot</CardTitle>
          <p className="text-xs text-mutedText">
            Har bir soha bo&apos;yicha xarajatlar va ularning to&apos;lov manbasi (Karta / Naqd pul)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))}
            </div>
          ) : categoryData.length === 0 ? (
            <EmptyState title="Kategoriya xarajatlari yo'q" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-darkText/5 text-mutedText text-xs font-semibold uppercase tracking-wider">
                    <th className="text-left px-6 py-4">Kategoriya</th>
                    <th className="text-right px-6 py-4">Jami summa</th>
                    <th className="text-right px-6 py-4">Karta orqali</th>
                    <th className="text-right px-6 py-4">Naqd pulda</th>
                    <th className="text-right px-6 py-4">Amallar soni</th>
                    <th className="text-right px-6 py-4">Umumiy ulush</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkText/5">
                  {categoryData.map(({ category, total, count, percentage, cardAmount, cashAmount }) => (
                    <tr key={category.id} className="hover:bg-cream/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-semibold text-darkText">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold tabular-nums text-darkText">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium tabular-nums text-forest">
                        {formatCurrency(cardAmount || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium tabular-nums text-mustard-dark">
                        {formatCurrency(cashAmount || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-mutedText">
                        {count} ta
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-cream rounded-full overflow-hidden border border-darkText/5">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: category.color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-darkText w-8">
                            {percentage}%
                          </span>
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
    </div>
  )
}
