import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Eye, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDate, formatFileSize } from '@/lib/utils'
import Card from '@/components/ui/Card'
import type { Document, DocumentCategory } from '@/types'

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contracts: 'חוזים',
  guarantees: 'ערבויות',
  deposits: 'פיקדונות ובטחונות',
  power_of_attorney: 'ייפוי כוח',
  approvals: 'אישורים רשמיים',
  blueprints: 'תוכניות',
}

const CATEGORY_ORDER: DocumentCategory[] = [
  'contracts', 'guarantees', 'deposits', 'power_of_attorney', 'approvals', 'blueprints',
]

function PDFModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col" style={{ height: '90vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-heading font-semibold text-dark truncate">{name}</h3>
          <button onClick={onClose} className="text-navy/60 hover:text-navy p-1 rounded-lg hover:bg-light-gray">
            <X size={20} />
          </button>
        </div>
        <iframe
          src={url}
          title={name}
          className="flex-1 rounded-b-2xl"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const { profile } = useAuth()
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', profile!.id)
        .order('uploaded_at', { ascending: false })
      return (data ?? []) as Document[]
    },
  })

  async function handleView(doc: Document) {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 300) // 5-minute signed URL
    if (data?.signedUrl) {
      setViewingDoc({ url: data.signedUrl, name: doc.name })
    }
  }

  async function handleDownload(doc: Document) {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 60)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = doc.name
      a.click()
    }
  }

  const grouped = CATEGORY_ORDER.reduce<Record<DocumentCategory, Document[]>>(
    (acc, cat) => {
      acc[cat] = documents?.filter((d) => d.category === cat) ?? []
      return acc
    },
    {} as Record<DocumentCategory, Document[]>,
  )

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">המסמכים שלי</h1>

      {isLoading ? (
        <div className="flex justify-center h-32 items-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents?.length === 0 ? (
        <Card className="text-center py-12">
          <FileText size={40} className="text-navy/20 mx-auto mb-3" />
          <p className="text-navy/40">אין מסמכים להצגה עדיין</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {CATEGORY_ORDER.map((cat) => {
            const docs = grouped[cat]
            if (!docs || docs.length === 0) return null
            return (
              <Card key={cat} padding="none">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-heading font-semibold text-dark">{CATEGORY_LABELS[cat]}</h2>
                  <p className="text-xs text-navy/40 mt-0.5">{docs.length} קבצים</p>
                </div>
                <div className="divide-y divide-border">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                      <FileText size={18} className="text-gold shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{doc.name}</p>
                        <p className="text-xs text-navy/40">
                          {formatDate(doc.uploaded_at)} • {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => void handleView(doc)}
                          title="צפייה"
                          className="p-1.5 text-navy/60 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => void handleDownload(doc)}
                          title="הורדה"
                          className="p-1.5 text-navy/60 hover:text-navy hover:bg-light-gray rounded-lg transition-colors"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {viewingDoc && (
        <PDFModal url={viewingDoc.url} name={viewingDoc.name} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  )
}
