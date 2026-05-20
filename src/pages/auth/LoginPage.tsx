import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  email: z.string().min(1, 'שדה חובה'),
  password: z.string().min(1, 'שדה חובה'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Already logged in — redirect
  if (profile) {
    const dest = profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    navigate(dest, { replace: true })
    return null
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('שם משתמש או סיסמה שגויים. אנא נסו שנית.')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-navy-dark">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(184,149,106,0.3) 40px,
              rgba(184,149,106,0.3) 41px
            )
          `,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-dark opacity-90" />

      {/* Gold decorative lines */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Login card */}
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl p-8 lg:p-10"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy-dark mb-4">
            <span className="font-heading text-gold text-2xl font-bold">ש</span>
          </div>
          <h1 className="font-heading text-2xl text-dark font-semibold">קבוצת שינפלד</h1>
          <p className="text-navy/60 text-sm mt-1">פורטל הדיירים — פינוי בינוי ותמ"א 38</p>
        </div>

        {/* Form */}
        {!showReset ? (
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
            <Input
              label="שם משתמש (אימייל)"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="סיסמה"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              כניסה לפורטל
            </Button>

            <button
              type="button"
              className="text-sm text-navy/60 hover:text-gold transition-colors text-center"
              onClick={() => setShowReset(true)}
            >
              שכחתי סיסמה
            </button>
          </form>
        ) : (
          <ResetForm onBack={() => setShowReset(false)} />
        )}

        {/* Footer */}
        <p className="text-xs text-navy/40 text-center mt-8 pt-6 border-t border-border">
          הגישה לפורטל מוגבלת לדיירים שחתמו על הסכם בלבד
        </p>
      </div>
    </div>
  )
}

function ResetForm({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    if (!email) return
    setLoading(true)
    await resetPassword(email)
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-medium mb-2">הוראות איפוס נשלחו!</p>
        <p className="text-sm text-navy/60 mb-4">אנא בדקו את תיבת הדואר האלקטרוני שלכם.</p>
        <button type="button" className="text-sm text-gold hover:underline" onClick={onBack}>
          חזרה להתחברות
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy/70 text-center">
        הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס הסיסמה.
      </p>
      <Input
        label="כתובת אימייל"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <Button variant="gold" size="lg" loading={loading} onClick={() => void handleReset()} className="w-full">
        שלח קישור לאיפוס
      </Button>
      <button type="button" className="text-sm text-navy/60 hover:text-gold transition-colors text-center" onClick={onBack}>
        חזרה להתחברות
      </button>
    </div>
  )
}
