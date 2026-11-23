'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2 } from 'lucide-react'

const schema = z
  .object({
    fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
    email: z.string().email("Noto'g'ri elektron pochta formati"),
    password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Kiritilgan parollar mos kelmadi',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (formData: FormData) => {
    setServerError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('user already exists')
        ) {
          setServerError("Ushbu elektron pochta manzili allaqachon ro'yxatdan o'tgan. Iltimos, hisobingizga kiring.")
        } else {
          setServerError(error.message)
        }
        return
      }

      // Check if session was created directly or if email verification is needed
      if (data?.session) {
        router.push('/dashboard')
        router.refresh()
      } else if (data?.user) {
        // Confirmation email was sent
        setRegisteredEmail(formData.email)
      }
    } catch (err: any) {
      setServerError(err?.message || "Kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.")
    }
  }

  if (registeredEmail) {
    return (
      <div className="animate-fadeIn text-center space-y-6 py-6">
        <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto text-forest">
          <Mail className="h-8 w-8" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-darkText tracking-tight">
            Elektron pochtangizni tasdiqlang
          </h2>
          <p className="text-mutedText text-sm mt-2 max-w-sm mx-auto">
            Biz <strong className="text-darkText">{registeredEmail}</strong> manziliga tasdiqlash xatini yubordik.
          </p>
        </div>

        <div className="bg-cream-dark/60 border border-darkText/10 rounded-2xl p-4 text-xs text-mutedText text-left space-y-2">
          <p className="font-medium text-darkText flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-forest" /> Keyingi qadamlar:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Elektron pochtangizni (inbox yoki spam) oching.</li>
            <li>Supabase tasdiqlash havolasini bosing.</li>
            <li>So'ngra quyidagi tugma orqali tizimga kiring.</li>
          </ol>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <Button variant="primary" size="lg" className="w-full">
              Kirish sahifasiga o'tish
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-darkText tracking-tight">
          Ro'yxatdan o'tish
        </h2>
        <p className="text-mutedText mt-2 text-sm">
          Yangi hisob yarating va moliyangizni to'liq nazorat qiling
        </p>
      </div>

      <form
        method="POST"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(onSubmit)(e)
        }}
        className="space-y-4"
      >
        <Input
          label="To'liq ismingiz"
          placeholder="Ism Familiya"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Elektron pochta"
          type="email"
          placeholder="nomingiz@misol.uz"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Parol"
          type="password"
          placeholder="Kamida 6 ta belgi"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Parolni tasdiqlang"
          type="password"
          placeholder="Parolni qayta tering"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && (
          <div className="bg-tomato/10 border border-tomato/20 rounded-xl px-4 py-3 text-sm text-tomato">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          loading={isSubmitting}
        >
          Ro'yxatdan o'tish
        </Button>
      </form>

      <p className="text-center text-sm text-mutedText mt-6">
        Allaqachon hisobingiz bormi?{' '}
        <Link href="/login" className="text-forest font-semibold hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  )
}
