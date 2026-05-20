import { useQuery } from '@tanstack/react-query'
import { Users, FolderOpen, MessageCircle, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'

function StatCard({ icon, label, value, to, color = 'gold' }: {
  icon: React.ReactNode
  label: string
  value: number | string
  to: string
  color?: 'gold' | 'navy'
}) {
  return (
    <Link to={to}>
      <Card className="hover:border-gold/40 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            color === 'gold' ? 'bg-gold/10 text-gold' : 'bg-navy/10 text-navy'
          }`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-dark">{value}</p>
            <p className="text-xs text-navy/50">{label}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const { data: counts } = useQuery({
    queryKey: ['admin-counts'],
    queryFn: async () => {
      const [tenants, projects, docs, unread] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tenant').eq('is_active', true),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('sender_role', 'tenant').eq('is_read', false),
      ])
      return {
        tenants: tenants.count ?? 0,
        projects: projects.count ?? 0,
        docs: docs.count ?? 0,
        unread: unread.count ?? 0,
      }
    },
  })

  const { data: recentMessages } = useQuery({
    queryKey: ['admin-recent-messages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, profiles!tenant_id(full_name)')
        .eq('sender_role', 'tenant')
        .order('created_at', { ascending: false })
        .limit(5)
      return data ?? []
    },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">לוח בקרה — מנהל</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={20} />} label="דיירים פעילים" value={counts?.tenants ?? '—'} to="/admin/tenants" />
        <StatCard icon={<FolderOpen size={20} />} label="פרויקטים" value={counts?.projects ?? '—'} to="/admin/content" color="navy" />
        <StatCard icon={<FileText size={20} />} label="מסמכים" value={counts?.docs ?? '—'} to="/admin/documents" />
        <StatCard icon={<MessageCircle size={20} />} label="הודעות לא נקראו" value={counts?.unread ?? '—'} to="/admin/chat" color="navy" />
      </div>

      {/* Recent messages */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-dark">הודעות אחרונות</h2>
          <Link to="/admin/chat" className="text-sm text-gold hover:underline">לכל ההודעות</Link>
        </div>
        {recentMessages && recentMessages.length > 0 ? (
          <div className="divide-y divide-border">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xs font-semibold shrink-0">
                  {(msg.profiles as { full_name?: string } | null)?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">
                    {(msg.profiles as { full_name?: string } | null)?.full_name ?? 'דייר'}
                  </p>
                  <p className="text-sm text-navy/60 truncate">{msg.content}</p>
                </div>
                <span className="text-xs text-navy/40 shrink-0">
                  {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-navy/40 text-sm text-center py-6">אין הודעות חדשות</p>
        )}
      </Card>
    </div>
  )
}
