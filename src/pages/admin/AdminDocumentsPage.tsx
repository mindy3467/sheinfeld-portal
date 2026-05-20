import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatDate, formatFileSize } from '@/lib/utils'
import type { Document, DocumentCategory, UserProfile } from '@/types'

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contracts: 'חוזים',
  guarantees: 'ערבויות',
  deposits: 'פיקדונות',
  power_of_attorney: 'ייפוי כוח',
  approvals: 'אישורים',
  blueprints: 'תוכניות',
}

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [category, setCategory] = useState<DocumentCategory>('contracts')
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')

  const { data: tenants } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'tenant').eq('is_active', true).order('full_name')
      return (data ?? []) as UserProfile[]
    },
  })

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-docs', selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', selectedTenantId!)
        .order('uploaded_at', { ascending: false })
      return (data ?? []) as Document[]
    },
  })

  const selectedTenant = tenants?.find((t) => t.id === selectedTenantId)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedTenant) return
    setUploading(true)

    const path = `${selectedTenant.user_id}/${category}/${Date.now()}_${file.name}`
    const { error: storageError } = await supabase.storage.from('documents').upload(path, file)

    if (!storageError) {
      await supabase.from('documents').insert({
        tenant_id: selectedTenant.id,
        project_id: selectedTenant.project_id,
        category,
        name: fileName || file.name,
        storage_path: path,
        file_size: file.size,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin-docs', selectedTenantId] })
    }

    setUploading(false)
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`למחוק את "${doc.name}"?`)) return
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    void queryClient.invalidateQueries({ queryKey: ['admin-docs', selectedTenantId] })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">ניהול מסמכים</h1>

      {/* Tenant selector */}
      <Card className="mb-6">
        <label className="text-sm font-medium text-navy-dark block mb-2">בחר דייר</label>
        <select
          value={selectedTenantId ?? ''}
          onChange={(e) => setSelectedTenantId(e.target.value || null)}
          className="w-full max-w-sm rounded-lg border border-border bg-white px-4 py-2 text-sm text-navy-dark focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
        >
          <option value="">— בחר דייר —</option>
          {tenants?.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name} — {t.email}</option>
          ))}
        </select>
      </Card>

      {selectedTenantId && (
        <>
          {/* Upload */}
          <Card className="mb-6">
            <h2 className="font-heading font-semibold text-dark mb-4">העלאת מסמך</h2>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-navy-dark">קטגוריה</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-navy-dark focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-48">
                  <label className="text-sm font-medium text-navy-dark">שם לתצוגה (אופציונלי)</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="שם המסמך..."
                    className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-navy-dark focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                  />
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={(e) => void handleUpload(e)} />
              <Button
                variant="gold"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
                className="self-start"
              >
                <Upload size={16} />
                בחר קובץ להעלאה
              </Button>
            </div>
          </Card>

          {/* Documents list */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading font-semibold text-dark">מסמכי {selectedTenant?.full_name}</h2>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !documents?.length ? (
              <p className="text-center text-navy/40 py-10 text-sm">אין מסמכים עדיין</p>
            ) : (
              <div className="divide-y divide-border">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText size={18} className="text-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="gray">{CATEGORY_LABELS[doc.category]}</Badge>
                        <span className="text-xs text-navy/40">{formatDate(doc.uploaded_at)} • {formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleDelete(doc)}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
