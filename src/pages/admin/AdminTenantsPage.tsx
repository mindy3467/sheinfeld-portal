import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import type { UserProfile } from '@/types'

export default function AdminTenantsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('full_name', { ascending: true })
      return (data ?? []) as UserProfile[]
    },
  })

  async function toggleActive(tenant: UserProfile) {
    await supabase
      .from('profiles')
      .update({ is_active: !tenant.is_active })
      .eq('id', tenant.id)
    void queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
    setActionId(null)
  }

  async function resetPassword(email: string) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    alert(`קישור לאיפוס סיסמה נשלח ל-${email}`)
    setActionId(null)
  }

  const filtered = tenants?.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()),
  ) ?? []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-semibold text-dark">ניהול דיירים</h1>
        <Button variant="gold" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          הוספת דייר
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 end-3 text-navy/40" />
        <input
          type="text"
          placeholder="חיפוש לפי שם או אימייל..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 pe-9 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white"
        />
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-navy/40 py-12 text-sm">לא נמצאו דיירים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((tenant) => (
              <div key={tenant.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-navy text-sm font-semibold shrink-0">
                  {tenant.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark text-sm">{tenant.full_name}</p>
                  <p className="text-xs text-navy/50">{tenant.email}</p>
                </div>
                <Badge variant={tenant.is_active ? 'green' : 'red'}>
                  {tenant.is_active ? 'פעיל' : 'מושהה'}
                </Badge>
                <div className="relative">
                  <button
                    className="p-1.5 text-navy/40 hover:text-navy rounded-lg hover:bg-light-gray"
                    onClick={() => setActionId(actionId === tenant.id ? null : tenant.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {actionId === tenant.id && (
                    <div className="absolute end-0 top-full mt-1 w-44 bg-white border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                      <button
                        className="w-full text-start px-4 py-2.5 text-sm hover:bg-light-gray text-dark"
                        onClick={() => void resetPassword(tenant.email)}
                      >
                        איפוס סיסמה
                      </button>
                      <button
                        className={`w-full text-start px-4 py-2.5 text-sm hover:bg-light-gray ${
                          tenant.is_active ? 'text-red-600' : 'text-green-700'
                        }`}
                        onClick={() => void toggleActive(tenant)}
                      >
                        {tenant.is_active ? 'השהיית חשבון' : 'הפעלת חשבון'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create tenant modal (simplified) */}
      {showCreate && <CreateTenantModal onClose={() => setShowCreate(false)} onCreated={() => {
        void queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
        setShowCreate(false)
      }} />}
    </div>
  )
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', project_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name')
      return data ?? []
    },
  })

  async function handleCreate() {
    if (!form.full_name || !form.email) {
      setError('שם ואימייל הם שדות חובה')
      return
    }
    setLoading(true)
    setError(null)

    // Create auth user via admin API (requires service role — done via Edge Function in production)
    // For now, create the profile record; auth user created separately by admin
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: tempPassword,
      options: { data: { full_name: form.full_name } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      await supabase.from('profiles').insert({
        user_id: authData.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        role: 'tenant',
        project_id: form.project_id || null,
        is_active: true,
      })

      await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    }

    setLoading(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="font-heading text-lg font-semibold text-dark mb-4">הוספת דייר חדש</h2>
        <div className="flex flex-col gap-3">
          <Input label="שם מלא" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="אימייל" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="טלפון" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-navy-dark">פרויקט</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-navy-dark focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            >
              <option value="">ללא פרויקט</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button variant="gold" loading={loading} onClick={() => void handleCreate()}>
            יצירה ושליחת הזמנה
          </Button>
        </div>
      </div>
    </div>
  )
}
