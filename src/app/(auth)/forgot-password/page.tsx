'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email("Noto'g'ri elektron pochta formati"),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setServerError("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.")
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="animate-fadeIn text-center space-y-4 py-4">
        <div className="w-14 h-14 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-forest" />
        </div>
        <h2 className="font-display text-2xl font-bold text-darkText">Havola yuborildi</h2>
        <p className="text-mutedText text-sm max-w-sm mx-auto">
          Elektron pochtangizni tekshiring. Parolni tiklash uchun maxsus havola yuborildi.
        </p>
        <div className="pt-4">
          <Link href="/login">
            <Button variant="secondary" size="md">
              Kirish oynasiga qaytish
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
          Parolni tiklash
        </h2>
        <p className="text-mutedText mt-2 text-sm">
          Elektron pochta manzilingizni kiriting, biz sizga tiklash havolasini yuboramiz
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Elektron pochta"
          type="email"
          placeholder="nomingiz@misol.uz"
          error={errors.email?.message}
          {...register('email')}
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
          Tiklash havolasini yuborish
        </Button>
      </form>

      <p className="text-center text-sm text-mutedText mt-6">
        <Link href="/login" className="text-forest font-semibold hover:underline">
          Kirish oynasiga qaytish
        </Link>
      </p>
    </div>
  )
}
