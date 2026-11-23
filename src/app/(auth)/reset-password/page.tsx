'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z
  .object({
    password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Kiritilgan parollar mos kelmadi',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
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
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      setServerError("Xatolik yuz berdi. Havola eskirgan bo'lishi mumkin.")
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-darkText tracking-tight">
          Yangi parol o'rnatish
        </h2>
        <p className="text-mutedText mt-2 text-sm">
          Hisobingiz uchun yangi xavfsiz parol kiriting
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Yangi parol"
          type="password"
          placeholder="Kamida 6 ta belgi"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Parolni tasdiqlang"
          type="password"
          placeholder="Yangi parolni qayta tering"
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
          Parolni saqlash
        </Button>
      </form>
    </div>
  )
}
