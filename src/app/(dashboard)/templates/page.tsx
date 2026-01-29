'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DocumentTemplate, GeneratedDocument, DocumentType, DocumentStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, FileText, Pencil, FileOutput, Trash2, Download, Eye, Files } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const typeLabels: Record<DocumentType, string> = {
  rfp: 'RFP',
  sow: 'SOW',
  msa: 'MSA',
  contract: 'Contract',
}

const typeColors: Record<DocumentType, string> = {
  rfp: 'bg-blue-100 text-blue-800',
  sow: 'bg-purple-100 text-purple-800',
  msa: 'bg-green-100 text-green-800',
  contract: 'bg-orange-100 text-orange-800',
}

const statusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  final: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  signed: 'bg-green-100 text-green-800',
}

interface GeneratedDocWithEvent extends GeneratedDocument {
  event?: { name: string } | null
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewingDoc, setViewingDoc] = useState<GeneratedDocWithEvent | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
    fetchGeneratedDocs()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      toast.error('Failed to load templates')
      console.error(error)
    } else {
      setTemplates(data || [])
    }
    setLoading(false)
  }

  const fetchGeneratedDocs = async () => {
    const { data, error } = await supabase
      .from('generated_documents')
      .select('*, event:events(name)')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setGeneratedDocs(data as unknown as GeneratedDocWithEvent[])
    }
  }

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Delete this generated document?')) return

    const { error } = await supabase
      .from('generated_documents')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete document')
    } else {
      toast.success('Document deleted')
      setGeneratedDocs(generatedDocs.filter((d) => d.id !== id))
    }
  }

  const handleDownloadDoc = (doc: GeneratedDocWithEvent) => {
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    const { error } = await supabase
      .from('document_templates')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete template')
    } else {
      toast.success('Template deleted')
      setTemplates(templates.filter((t) => t.id !== id))
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || template.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Templates</h1>
          <p className="text-muted-foreground">
            Create and manage RFP, SOW, MSA, and Contract templates
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rfp">RFP</SelectItem>
            <SelectItem value="sow">SOW</SelectItem>
            <SelectItem value="msa">MSA</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {templates.length === 0
                ? 'Get started by creating your first template'
                : 'Try adjusting your search or filters'}
            </p>
            {templates.length === 0 && (
              <Link href="/templates/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={typeColors[template.type]}>
                      {typeLabels[template.type]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Updated{' '}
                  {template.updated_at
                    ? format(new Date(template.updated_at), 'MMM d, yyyy')
                    : 'N/A'}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Link href={`/templates/${template.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/templates/${template.id}/generate`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <FileOutput className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generated Documents Section */}
      {generatedDocs.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Generated Documents</h2>
            <span className="text-sm text-muted-foreground">
              (Recent {generatedDocs.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium line-clamp-1">{doc.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={typeColors[doc.type]}>
                          {typeLabels[doc.type]}
                        </Badge>
                        <Badge variant="outline" className={statusColors[doc.status]}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {doc.event && (
                    <p className="text-xs text-muted-foreground">
                      Event: {doc.event.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : 'N/A'}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewingDoc(doc)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadDoc(doc)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            {viewingDoc && (
              <>
                <Badge className={typeColors[viewingDoc.type]}>
                  {typeLabels[viewingDoc.type]}
                </Badge>
                <Badge variant="outline" className={statusColors[viewingDoc.status]}>
                  {viewingDoc.status}
                </Badge>
                {viewingDoc.event && (
                  <span className="text-sm text-muted-foreground">
                    Event: {viewingDoc.event.name}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="bg-muted/50 rounded-lg p-4 max-h-[50vh] overflow-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {viewingDoc?.content}
            </pre>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setViewingDoc(null)}>
              Close
            </Button>
            {viewingDoc && (
              <Button onClick={() => handleDownloadDoc(viewingDoc)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
