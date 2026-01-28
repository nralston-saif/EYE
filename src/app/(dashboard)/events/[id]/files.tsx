'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Upload, FileText, Download, Trash2, File } from 'lucide-react'
import { format } from 'date-fns'
import type { EventFile } from '@/types/database'

interface EventFilesProps {
  eventId: string
}

const FILE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'beo', label: 'BEO' },
  { value: 'run_of_show', label: 'Run of Show' },
  { value: 'design', label: 'Design' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'other', label: 'Other' },
]

export function EventFiles({ eventId }: EventFilesProps) {
  const supabase = createClient()
  const [files, setFiles] = useState<EventFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('general')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('event_files')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setFiles(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [eventId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${eventId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('event-files')
      .upload(fileName, file)

    if (uploadError) {
      toast.error('Failed to upload file')
      setUploading(false)
      return
    }

    // Create database record
    const { error: dbError } = await supabase.from('event_files').insert({
      event_id: eventId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: fileName,
      category: selectedCategory,
    })

    if (dbError) {
      toast.error('Failed to save file record')
      setUploading(false)
      return
    }

    toast.success('File uploaded')
    setDialogOpen(false)
    setUploading(false)
    fetchFiles()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownload = async (file: EventFile) => {
    const { data } = await supabase.storage
      .from('event-files')
      .createSignedUrl(file.storage_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const handleDelete = async (file: EventFile) => {
    // Delete from storage
    await supabase.storage.from('event-files').remove([file.storage_path])

    // Delete from database
    const { error } = await supabase.from('event_files').delete().eq('id', file.id)

    if (error) {
      toast.error('Failed to delete file')
      return
    }

    toast.success('File deleted')
    fetchFiles()
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'contract': return 'bg-purple-100 text-purple-800'
      case 'proposal': return 'bg-blue-100 text-blue-800'
      case 'beo': return 'bg-green-100 text-green-800'
      case 'run_of_show': return 'bg-yellow-100 text-yellow-800'
      case 'design': return 'bg-pink-100 text-pink-800'
      case 'vendor': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading files...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Files ({files.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No files uploaded yet. Upload files to keep everything organized.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getCategoryColor(file.category)}>
                        {file.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.created_at && format(new Date(file.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(file)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
