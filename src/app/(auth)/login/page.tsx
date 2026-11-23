'use client'
import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email("Noto'g'ri elektron pochta manzili"),
  password: z.string().min(1, 'Parol kiritilishi shart'),
})
type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState('')
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth-code-error') {
      setServerError("Tasdiqlash havolasi eskirgan yoki yaroqsiz. Iltimos qaytadan urinib ko'ring.")
    }
  }, [searchParams])

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setEmailNotConfirmed(false)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('email not confirmed')) {
          setEmailNotConfirmed(true)
          setServerError(
            "Elektron pochtangiz hali tasdiqlanmagan. Iltimos, emailingizga (inbox/spam) yuborilgan tasdiqlash xatini oching va havolani bosing."
          )
        } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          setServerError("Elektron pochta yoki parol noto'g'ri kiritildi.")
        } else {
          setServerError(error.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setServerError(err?.message || "Tizimga kirishda xatolik yuz berdi.")
    }
  }

  return (
    <form
      method="POST"
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(onSubmit)(e)
      }}
      className="space-y-4"
    >
      <Input
        label="Elektron pochta"
        type="email"
        placeholder="nomingiz@misol.uz"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="space-y-1.5">
        <Input
          label="Parol"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-forest hover:text-forest-dark font-medium hover:underline transition-colors"
          >
            Parolni unutdingizmi?
          </Link>
        </div>
      </div>

      {serverError && (
        <div className="bg-tomato/10 border border-tomato/20 rounded-xl px-4 py-3 text-sm text-tomato space-y-1.5">
          <p className="font-medium">{serverError}</p>
          {emailNotConfirmed && (
            <p className="text-xs text-darkText/70">
              Maslahat: Agar xat bormasa, Supabase boshqaruv panelida (Authentication &gt; Providers &gt; Email) <strong>Confirm email</strong> sozlamasini o'chirib qo'yishingiz mumkin.
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2"
        loading={isSubmitting}
      >
        Kirish
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-darkText tracking-tight">Xush kelibsiz</h2>
        <p className="text-mutedText mt-2 text-sm">
          Hisobingizga kirish uchun ma'lumotlaringizni kiriting
        </p>
      </div>

      <Suspense fallback={<div className="h-48 flex items-center justify-center text-mutedText text-sm">Yuklanmoqda...</div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-mutedText mt-6">
        Hisobingiz yo'qmi?{' '}
        <Link href="/register" className="text-forest font-semibold hover:underline">
          Ro'yxatdan o'ting
        </Link>
      </p>
    </div>
  )
}
