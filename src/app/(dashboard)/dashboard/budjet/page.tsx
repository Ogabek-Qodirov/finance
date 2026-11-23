'use client'
import { useState, useEffect } from 'react'
import { Target, AlertTriangle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getBudgetStatus, getBudgetHistory } from '@/lib/queries/budgets'
import { upsertBudget } from '@/lib/actions/budgets'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { BudgetStatus } from '@/types'
import { cn } from '@/lib/utils'

export default function BudjetPage() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [userId, setUserId] = useState('')
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async (uid: string) => {
    setLoading(true)
    try {
      const [bs, hist] = await Promise.all([
        getBudgetStatus(uid, currentMonth, currentYear),
        getBudgetHistory(uid, 6),
      ])
      setBudgetStatus(bs)
      setHistory(hist)
      setBudgetInput(bs.budget?.amount ? String(bs.budget.amount) : '')
    } catch (e) {
      console.error('Budjet fetchData error:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      fetchData(user.id)
    })
  }, [])

  const handleSave = async () => {
    const amount = Number(budgetInput)
    if (!amount || amount <= 0) {
      toast("Budjet summasi 0 dan katta bo'lishi kerak", 'error')
      return
    }

    setSaving(true)
    const result = await upsertBudget(currentMonth, currentYear, amount)
    setSaving(false)

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast("Budjet muvaffaqiyatli saqlandi", 'success')
    setEditing(false)
    if (userId) fetchData(userId)
  }

  const pct = budgetStatus?.percentage || 0

  const alertConfig =
    pct >= 100
      ? {
          icon: XCircle,
          color: 'text-tomato',
          bg: 'bg-tomato/10 border-tomato/20',
          title: "Budjet tugadi!",
          msg: "Joriy oylik xarajatlar belgilangan limitdan oshib ketdi.",
        }
      : pct >= 90
      ? {
          icon: AlertTriangle,
          color: 'text-tomato',
          bg: 'bg-tomato/10 border-tomato/20',
          title: "Diqqat: Budjet 90% dan oshdi!",
          msg: "Limit tugashiga oz qoldi. Iltimos, xarajatlaringizni cheklang.",
        }
      : pct >= 75
      ? {
          icon: AlertTriangle,
          color: 'text-mustard-dark',
          bg: 'bg-mustard/15 border-mustard/30',
          title: "Budjetingiz 75% dan oshdi",
          msg: "Oylik rejangizning asosiy qismidan foydalanib bo'ldingiz.",
        }
      : pct >= 50
      ? {
          icon: TrendingUp,
          color: 'text-forest',
          bg: 'bg-forest/5 border-forest/15',
          title: "Yarim budjet sarflandi",
          msg: "Budjetingizning 50% qismidan foydalandingiz. Nazoratda davom eting.",
        }
      : null

  const barColor =
    pct >= 100
      ? '#D9654D'
      : pct >= 90
      ? '#D9654D'
      : pct >= 75
      ? '#E5B94F'
      : '#234B38'

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <PageHeader
        title="Budjet Boshqaruvi"
        description={`${getMonthName(currentMonth)} ${currentYear} uchun oylik xarajatlar limiti`}
      />

      {/* Joriy oy budjet kartasi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {getMonthName(currentMonth)} {currentYear} budjeti
              </CardTitle>
              <p className="text-xs text-mutedText mt-0.5">
                Oylik xarajat cheklovini belgilang va sarf-xarajatlarni jilovlang
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing((e) => !e)}
            >
              {editing
                ? 'Bekor qilish'
                : budgetStatus?.budget
                ? "O'zgartirish"
                : 'Limit belgilash'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4 py-4">
              <div className="skeleton h-12 w-52 rounded-xl" />
              <div className="skeleton h-3 w-full rounded-full" />
            </div>
          ) : !budgetStatus?.budget && !editing ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-forest/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-forest">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-darkText mb-2">
                Budjet belgilanmagan
              </h3>
              <p className="text-mutedText text-sm max-w-sm mx-auto mb-6">
                Ushbu oy uchun xarajatlar chegarasini belgilab, o'z mablag'ingizni tejashni boshlang
              </p>
              <Button variant="primary" size="lg" onClick={() => setEditing(true)}>
                Oylik budjet belgilash
              </Button>
            </div>
          ) : editing ? (
            <div className="space-y-5 py-2">
              <Input
                label={`${getMonthName(currentMonth)} ${currentYear} uchun limit summasi (UZS)`}
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Masalan: 5000000"
                min="1"
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  loading={saving}
                >
                  Budjetni saqlash
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* 3 ta ko'rsatkich */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-cream/60 rounded-2xl border border-darkText/5">
                <div>
                  <p className="text-xs text-mutedText font-medium mb-1">
                    Belgilangan limit
                  </p>
                  <p className="font-display text-2xl font-bold text-darkText tabular-nums">
                    {formatCurrency(budgetStatus?.budget?.amount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mutedText font-medium mb-1">
                    Sarflandi
                  </p>
                  <p className="font-display text-2xl font-bold text-tomato tabular-nums">
                    {formatCurrency(budgetStatus?.spent || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mutedText font-medium mb-1">
                    Qolgan mablag'
                  </p>
                  <p
                    className="font-display text-2xl font-bold tabular-nums"
                    style={{
                      color:
                        (budgetStatus?.remaining || 0) >= 0 ? '#234B38' : '#D9654D',
                    }}
                  >
                    {formatCurrency(Math.max(0, budgetStatus?.remaining || 0))}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-darkText">
                    Umumiy sarflanish darajasi
                  </span>
                  <span
                    className="font-bold tabular-nums text-sm"
                    style={{ color: barColor }}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-4 bg-cream rounded-full overflow-hidden border border-darkText/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>

              {/* Ogohlantirish bloki */}
              {alertConfig && (
                <div
                  className={cn(
                    'flex items-start gap-3.5 rounded-2xl p-4 border animate-fadeIn',
                    alertConfig.bg
                  )}
                >
                  <alertConfig.icon
                    className={cn('h-5 w-5 flex-shrink-0 mt-0.5', alertConfig.color)}
                  />
                  <div>
                    <h5 className="font-bold text-sm text-darkText">
                      {alertConfig.title}
                    </h5>
                    <p className="text-xs text-darkText/80 mt-0.5">
                      {alertConfig.msg}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* O'tgan oylar budjet tarixi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Budjet tarixi</CardTitle>
          <p className="text-xs text-mutedText">
            Oxirgi 6 oylik limit va haqiqiy sarf-xarajatlar natijasi
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-darkText/5 text-mutedText text-xs font-semibold uppercase tracking-wider">
                    <th className="text-left px-6 py-4">Oy / Yil</th>
                    <th className="text-right px-6 py-4">Budjet</th>
                    <th className="text-right px-6 py-4">Haqiqiy sarf</th>
                    <th className="text-right px-6 py-4">Qoldiq</th>
                    <th className="text-right px-6 py-4">Natija</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkText/5">
                  {history.map(
                    ({ month, year, budget, spent, remaining, status }) => (
                      <tr
                        key={`${month}-${year}`}
                        className="hover:bg-cream/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-darkText">
                          {getMonthName(month)} {year}
                        </td>
                        <td className="px-6 py-4 text-right text-sm tabular-nums font-medium text-darkText">
                          {budget?.amount ? (
                            formatCurrency(budget.amount)
                          ) : (
                            <span className="text-mutedText">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm tabular-nums font-semibold text-tomato">
                          {formatCurrency(spent)}
                        </td>
                        <td
                          className="px-6 py-4 text-right text-sm tabular-nums font-semibold"
                          style={{
                            color: remaining >= 0 ? '#234B38' : '#D9654D',
                          }}
                        >
                          {formatCurrency(Math.abs(remaining))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!budget ? (
                            <span className="text-xs text-mutedText">
                              Belgilanmagan
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full',
                                status === 'exceeded'
                                  ? 'bg-tomato/15 text-tomato'
                                  : status === 'danger'
                                  ? 'bg-tomato/10 text-tomato'
                                  : status === 'warning'
                                  ? 'bg-mustard/20 text-darkText'
                                  : 'bg-forest/10 text-forest'
                              )}
                            >
                              {status === 'exceeded'
                                ? "Oshib ketdi"
                                : status === 'danger'
                                ? "Xavfli"
                                : status === 'warning'
                                ? "Ehtiyotkor"
                                : "A'lo"}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
