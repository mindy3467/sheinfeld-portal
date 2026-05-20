import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Project, TimelineStep } from '@/types'

export default function AdminContentPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { data: projects } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').order('name')
      return (data ?? []) as Project[]
    },
  })

  const selectedProject = projects?.find((p) => p.id === selectedProjectId)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">ניהול תוכן</h1>

      {/* Project selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-navy-dark">בחר פרויקט:</label>
          <select
            value={selectedProjectId ?? ''}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            className="flex-1 max-w-xs rounded-lg border border-border bg-white px-4 py-2 text-sm text-navy-dark focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          >
            <option value="">— בחר פרויקט —</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {selectedProject && (
        <>
          <SignatureEditor project={selectedProject} />
          <TimelineEditor projectId={selectedProject.id} />
          <HandoverEditor project={selectedProject} />
        </>
      )}

      {!selectedProjectId && (
        <div className="text-center py-16 text-navy/40">
          <p>בחר פרויקט כדי לנהל את התוכן שלו</p>
        </div>
      )}
    </div>
  )
}

function SignatureEditor({ project }: { project: Project }) {
  const queryClient = useQueryClient()
  const [count, setCount] = useState(String(project.signature_count))
  const [total, setTotal] = useState(String(project.signature_total))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase
      .from('projects')
      .update({ signature_count: Number(count), signature_total: Number(total) })
      .eq('id', project.id)
    void queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
    void queryClient.invalidateQueries({ queryKey: ['project', project.id] })
    setSaving(false)
  }

  return (
    <Card className="mb-4">
      <h2 className="font-heading font-semibold text-dark mb-4">עדכון חתימות</h2>
      <div className="flex gap-3 items-end flex-wrap">
        <Input
          label="מספר חתומים"
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-28"
        />
        <Input
          label={'סה"כ בעלי דירות'}
          type="number"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className="w-28"
        />
        <Button variant="gold" loading={saving} onClick={() => void save()}>שמור</Button>
      </div>
    </Card>
  )
}

function TimelineEditor({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()

  const { data: steps } = useQuery({
    queryKey: ['timeline', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('timeline_steps')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
      return (data ?? []) as TimelineStep[]
    },
  })

  async function updateStep(id: string, updates: Partial<TimelineStep>) {
    await supabase.from('timeline_steps').update(updates).eq('id', id)
    void queryClient.invalidateQueries({ queryKey: ['timeline', projectId] })
  }

  async function deleteStep(id: string) {
    await supabase.from('timeline_steps').delete().eq('id', id)
    void queryClient.invalidateQueries({ queryKey: ['timeline', projectId] })
  }

  async function addStep() {
    const order = (steps?.length ?? 0) + 1
    await supabase.from('timeline_steps').insert({
      project_id: projectId,
      title: 'שלב חדש',
      status: 'upcoming',
      sort_order: order,
    })
    void queryClient.invalidateQueries({ queryKey: ['timeline', projectId] })
  }

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-dark">לוח זמנים</h2>
        <Button variant="ghost" size="sm" onClick={() => void addStep()}>
          <Plus size={14} />
          הוסף שלב
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {steps?.map((step) => (
          <div key={step.id} className="flex items-start gap-3 p-3 bg-light-gray rounded-xl">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                defaultValue={step.title}
                onBlur={(e) => void updateStep(step.id, { title: e.target.value })}
                className="col-span-1 sm:col-span-2 px-3 py-1.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="שם השלב"
              />
              <select
                defaultValue={step.status}
                onChange={(e) => void updateStep(step.id, { status: e.target.value as TimelineStep['status'] })}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="completed">הושלם</option>
                <option value="active">בתהליך</option>
                <option value="upcoming">עתידי</option>
              </select>
              <input
                type="date"
                defaultValue={step.date?.slice(0, 10) ?? ''}
                onBlur={(e) => void updateStep(step.id, { date: e.target.value || null })}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <input
                defaultValue={step.admin_note ?? ''}
                onBlur={(e) => void updateStep(step.id, { admin_note: e.target.value || null })}
                className="col-span-1 sm:col-span-3 px-3 py-1.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="הערת מנהל (אופציונלי)"
              />
            </div>
            <button
              onClick={() => void deleteStep(step.id)}
              className="text-red-400 hover:text-red-600 p-1 mt-1"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function HandoverEditor({ project }: { project: Project }) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(project.handover_date?.slice(0, 10) ?? '')
  const [note, setNote] = useState(project.handover_note ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase
      .from('projects')
      .update({ handover_date: date || null, handover_note: note || null })
      .eq('id', project.id)
    void queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
    void queryClient.invalidateQueries({ queryKey: ['project', project.id] })
    setSaving(false)
  }

  return (
    <Card className="mb-4">
      <h2 className="font-heading font-semibold text-dark mb-4">תאריך מסירה</h2>
      <div className="flex flex-col gap-3">
        <Input
          label="תאריך מסירה"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-xs"
        />
        <Input
          label="הערה לתאריך"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='לדוג׳: עודכן בשל מצב הביטחוני'
        />
        <Button variant="gold" loading={saving} onClick={() => void save()} className="self-start">
          שמור
        </Button>
      </div>
    </Card>
  )
}
