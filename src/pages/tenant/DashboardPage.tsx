import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, Home, FileText, MessageCircle, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { daysUntil, formatDate } from '@/lib/utils'
import Card from '@/components/ui/Card'

function CircularProgress({ pct }: { pct: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke="#B8956A" strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

interface StatCardProps {
  to: string
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  badge?: number
}

function StatCard({ to, icon, label, children, badge }: StatCardProps) {
  return (
    <Link to={to}>
      <Card className="hover:border-gold/40 transition-colors cursor-pointer group relative">
        {badge != null && badge > 0 && (
          <span className="absolute top-4 start-4 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="text-gold group-hover:scale-110 transition-transform">{icon}</div>
          <div>{children}</div>
          <span className="text-xs text-navy/50">{label}</span>
        </div>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()

  const { data: project } = useQuery({
    queryKey: ['project', profile?.project_id],
    enabled: !!profile?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', profile!.project_id!)
        .single()
      return data
    },
  })

  const { data: docsCount } = useQuery({
    queryKey: ['docs-count', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile!.id)
      return count ?? 0
    },
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile!.id)
        .eq('sender_role', 'admin')
        .eq('is_read', false)
      return count ?? 0
    },
  })

  const { data: currentStep } = useQuery({
    queryKey: ['current-step', profile?.project_id],
    enabled: !!profile?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('timeline_steps')
        .select('title')
        .eq('project_id', profile!.project_id!)
        .eq('status', 'active')
        .single()
      return data
    },
  })

  const signaturePct = project
    ? Math.round((project.signature_count / project.signature_total) * 100)
    : 0

  const days = daysUntil(project?.handover_date ?? null)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-semibold text-dark">
          שלום, {profile?.full_name?.split(' ')[0] ?? ''}
        </h1>
        {project && (
          <p className="text-navy/60 mt-1">{project.name}</p>
        )}
        {currentStep && (
          <div className="inline-flex items-center gap-2 mt-3 bg-gold/10 text-gold-dark rounded-full px-4 py-1.5 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            הפרויקט נמצא כעת: {currentStep.title}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard to="/project-status" icon={<TrendingUp size={28} />} label="אחוז חתימות">
          <div className="relative inline-flex items-center justify-center">
            <CircularProgress pct={signaturePct} />
            <span className="absolute text-lg font-bold text-dark font-heading">
              {signaturePct}%
            </span>
          </div>
        </StatCard>

        <StatCard to="/project-status" icon={<Calendar size={28} />} label="ימים עד מסירה">
          <div className="py-1">
            {days != null ? (
              <>
                <span className="text-3xl font-bold font-heading text-dark">{days.toLocaleString('he-IL')}</span>
                <span className="text-sm text-navy/50 block">ימים</span>
              </>
            ) : (
              <span className="text-sm text-navy/40">טרם נקבע</span>
            )}
            {project?.handover_date && (
              <span className="text-xs text-navy/40 block">{formatDate(project.handover_date)}</span>
            )}
          </div>
        </StatCard>

        <StatCard to="/documents" icon={<FileText size={28} />} label="המסמכים שלי">
          <span className="text-3xl font-bold font-heading text-dark">{docsCount ?? '—'}</span>
        </StatCard>

        <StatCard to="/chat" icon={<MessageCircle size={28} />} label="הודעות" badge={unreadCount ?? 0}>
          <div className="text-3xl font-bold font-heading text-dark">
            {unreadCount != null && unreadCount > 0 ? (
              <span className="text-red-500">{unreadCount}</span>
            ) : (
              <Home size={28} className="text-gold/50" />
            )}
          </div>
        </StatCard>
      </div>

      {/* Quick links */}
      <Card>
        <h2 className="font-heading text-lg font-semibold text-dark mb-4">ניווט מהיר</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: '/project-status', label: 'מצב הפרויקט', desc: 'לוח זמנים ואחוז חתימות', icon: TrendingUp },
            { to: '/apartment', label: 'הדירה שלי', desc: 'פרטי הדירה והמפרט', icon: Home },
            { to: '/documents', label: 'מסמכים', desc: 'חוזים, ערבויות ועוד', icon: FileText },
          ].map(({ to, label, desc, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-light-gray transition-colors group"
            >
              <Icon size={20} className="text-gold mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-medium text-dark text-sm">{label}</p>
                <p className="text-xs text-navy/50">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
