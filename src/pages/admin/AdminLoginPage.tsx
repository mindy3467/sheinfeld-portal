import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  email: z.string().min(1, 'שדה חובה'),
  password: z.string().min(1, 'שדה חובה'),
})

type FormData = z.infer<typeof schema>

export default function AdminLoginPage() {
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (profile?.role === 'admin') {
    navigate('/admin/dashboard', { replace: true })
    return null
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('אימייל או סיסמה שגויים.')
      return
    }
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div
        className="w-full max-w-sm mx-4 bg-white rounded-2xl p-8"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy-dark mb-3">
            <Building2 size={22} className="text-gold" />
          </div>
          <h1 className="font-heading text-xl text-dark font-semibold">כניסת מנהל</h1>
          <p className="text-navy/50 text-sm mt-1">קבוצת שינפלד — פאנל ניהול</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <Input
            label="אימייל"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="סיסמה"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p className="text-sm text-red-500 text-center">{serverError}</p>
          )}

          <Button type="submit" variant="navy" size="lg" loading={isSubmitting} className="w-full mt-1">
            כניסה לפאנל ניהול
          </Button>
        </form>
      </div>
    </div>
  )
}
