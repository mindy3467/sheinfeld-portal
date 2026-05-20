import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Clock, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import Card from '@/components/ui/Card'
import type { TimelineStep } from '@/types'

function TimelineItem({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const isCompleted = step.status === 'completed'
  const isActive = step.status === 'active'

  return (
    <div className="flex gap-4 relative">
      {/* Connector line */}
      {!isLast && (
        <div className={`absolute top-8 start-5 w-0.5 h-full -translate-x-1/2 ${isCompleted ? 'bg-gold' : 'bg-border'}`} />
      )}

      {/* Icon */}
      <div className="shrink-0 z-10">
        {isCompleted ? (
          <CheckCircle2 size={40} className="text-gold" />
        ) : isActive ? (
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
            <Clock size={18} className="text-white" />
          </div>
        ) : (
          <Circle size={40} className="text-border" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-8 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className={`font-heading font-semibold ${isCompleted || isActive ? 'text-dark' : 'text-navy/40'}`}>
              {step.title}
            </h3>
            {step.date && (
              <p className="text-sm text-navy/50 mt-0.5">{formatDate(step.date)}</p>
            )}
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isCompleted ? 'bg-green-100 text-green-700' :
            isActive ? 'bg-gold/15 text-gold-dark' :
            'bg-gray-100 text-gray-400'
          }`}>
            {isCompleted ? 'הושלם' : isActive ? 'בתהליך' : 'עתידי'}
          </span>
        </div>
        {step.admin_note && (
          <p className="text-sm text-navy/60 mt-2 bg-light-gray rounded-lg px-3 py-2">
            {step.admin_note}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ProjectStatusPage() {
  const { profile } = useAuth()

  const { data: project, isLoading: loadingProject } = useQuery({
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

  const { data: steps, isLoading: loadingSteps } = useQuery({
    queryKey: ['timeline', profile?.project_id],
    enabled: !!profile?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('timeline_steps')
        .select('*')
        .eq('project_id', profile!.project_id!)
        .order('sort_order', { ascending: true })
      return (data ?? []) as TimelineStep[]
    },
  })

  const signaturePct = project
    ? Math.round((project.signature_count / project.signature_total) * 100)
    : 0

  if (loadingProject || loadingSteps) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">מצב הפרויקט</h1>

      {/* Signature progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-dark">התקדמות חתימות</h2>
          <span className="text-2xl font-bold text-gold font-heading">{signaturePct}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-3 bg-light-gray rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-l from-gold to-gold-light rounded-full transition-all duration-700"
            style={{ width: `${signaturePct}%` }}
          />
        </div>
        {project && (
          <p className="text-sm text-navy/60">
            {project.signature_count} מתוך {project.signature_total} בעלי דירות חתמו
          </p>
        )}
      </Card>

      {/* Handover date */}
      {project?.handover_date && (
        <Card className="mb-6 bg-gradient-to-br from-navy-dark to-dark text-white border-0">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-gold shrink-0" />
            <div>
              <p className="text-white/60 text-sm">תאריך מסירה משוער</p>
              <p className="font-heading text-xl font-semibold">{formatDate(project.handover_date)}</p>
              {project.handover_note && (
                <p className="text-white/50 text-xs mt-1">{project.handover_note}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <h2 className="font-heading text-lg font-semibold text-dark mb-6">לוח זמנים</h2>
        {steps && steps.length > 0 ? (
          <div>
            {steps.map((step, i) => (
              <TimelineItem key={step.id} step={step} isLast={i === steps.length - 1} />
            ))}
          </div>
        ) : (
          <p className="text-navy/40 text-sm text-center py-8">לוח הזמנים יעודכן בקרוב</p>
        )}
      </Card>
    </div>
  )
}
