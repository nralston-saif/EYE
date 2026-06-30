'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Calendar, Trash2, MessageSquare, Paperclip, Upload, Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Task, Contractor, TaskNote, TaskFile } from '@/types/database'

interface EventTasksProps {
  eventId: string
}

export function EventTasks({ eventId }: EventTasksProps) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({})
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({})

  // Task detail / edit state
  const [detailTask, setDetailTask] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    contractor_id: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [notes, setNotes] = useState<TaskNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [files, setFiles] = useState<TaskFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, contractors(*)')
      .eq('event_id', eventId)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (data) {
      setTasks(data as any[])
      fetchCounts(data.map((t: any) => t.id))
    }
    setLoading(false)
  }

  const fetchCounts = async (taskIds: string[]) => {
    if (taskIds.length === 0) {
      setNoteCounts({})
      setFileCounts({})
      return
    }
    const [{ data: noteRows }, { data: fileRows }] = await Promise.all([
      supabase.from('task_notes').select('task_id').in('task_id', taskIds),
      supabase.from('task_files').select('task_id').in('task_id', taskIds),
    ])
    const tally = (rows: { task_id: string }[] | null) => {
      const map: Record<string, number> = {}
      for (const r of rows || []) map[r.task_id] = (map[r.task_id] || 0) + 1
      return map
    }
    setNoteCounts(tally(noteRows as any))
    setFileCounts(tally(fileRows as any))
  }

  const fetchContractors = async () => {
    const { data } = await supabase.from('contractors').select('*').order('last_name')
    if (data) setContractors(data)
  }

  useEffect(() => {
    fetchTasks()
    fetchContractors()
  }, [eventId])

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from('tasks').insert({
      event_id: eventId,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      due_date: formData.get('due_date') as string || null,
      priority: formData.get('priority') as string || 'medium',
      contractor_id: formData.get('contractor_id') as string || null,
      status: 'pending',
    })

    if (error) {
      toast.error('Failed to create task')
      return
    }

    toast.success('Task created')
    setDialogOpen(false)
    fetchTasks()
  }

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update task')
      return
    }

    fetchTasks()
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      toast.error('Failed to delete task')
      return
    }

    toast.success('Task deleted')
    fetchTasks()
  }

  // ---- Task detail / edit ----
  const openDetail = (task: any) => {
    setDetailTask(task)
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
      contractor_id: task.contractor_id || '',
    })
    setNewNote('')
    fetchNotes(task.id)
    fetchFiles(task.id)
  }

  const closeDetail = () => {
    setDetailTask(null)
    setNotes([])
    setFiles([])
  }

  const handleSaveEdit = async () => {
    if (!detailTask) return
    if (!editForm.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSavingEdit(true)
    const { error } = await supabase
      .from('tasks')
      .update({
        title: editForm.title,
        description: editForm.description || null,
        due_date: editForm.due_date || null,
        priority: editForm.priority,
        contractor_id: editForm.contractor_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', detailTask.id)
    setSavingEdit(false)

    if (error) {
      toast.error('Failed to save task')
      return
    }
    toast.success('Task saved')
    closeDetail()
    fetchTasks()
  }

  // ---- Notes ----
  const fetchNotes = async (taskId: string) => {
    const { data } = await supabase
      .from('task_notes')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    setNotes((data as TaskNote[]) || [])
  }

  const handleAddNote = async () => {
    if (!detailTask || !newNote.trim()) return
    setAddingNote(true)
    const { error } = await supabase.from('task_notes').insert({
      task_id: detailTask.id,
      content: newNote.trim(),
    })
    setAddingNote(false)
    if (error) {
      toast.error('Failed to add note')
      return
    }
    setNewNote('')
    fetchNotes(detailTask.id)
    setNoteCounts((prev) => ({ ...prev, [detailTask.id]: (prev[detailTask.id] || 0) + 1 }))
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!detailTask) return
    const { error } = await supabase.from('task_notes').delete().eq('id', noteId)
    if (error) {
      toast.error('Failed to delete note')
      return
    }
    fetchNotes(detailTask.id)
    setNoteCounts((prev) => ({ ...prev, [detailTask.id]: Math.max(0, (prev[detailTask.id] || 1) - 1) }))
  }

  // ---- Files ----
  const fetchFiles = async (taskId: string) => {
    const { data } = await supabase
      .from('task_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    setFiles((data as TaskFile[]) || [])
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !detailTask) return

    setUploading(true)
    const storagePath = `tasks/${detailTask.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('event-files')
      .upload(storagePath, file)

    if (uploadError) {
      toast.error('Failed to upload file')
      setUploading(false)
      return
    }

    const { error: dbError } = await supabase.from('task_files').insert({
      task_id: detailTask.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
    })

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (dbError) {
      toast.error('Failed to save file record')
      return
    }
    toast.success('File uploaded')
    fetchFiles(detailTask.id)
    setFileCounts((prev) => ({ ...prev, [detailTask.id]: (prev[detailTask.id] || 0) + 1 }))
  }

  const handleDownloadFile = async (file: TaskFile) => {
    const { data } = await supabase.storage
      .from('event-files')
      .createSignedUrl(file.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleDeleteFile = async (file: TaskFile) => {
    if (!detailTask) return
    await supabase.storage.from('event-files').remove([file.storage_path])
    const { error } = await supabase.from('task_files').delete().eq('id', file.id)
    if (error) {
      toast.error('Failed to delete file')
      return
    }
    fetchFiles(detailTask.id)
    setFileCounts((prev) => ({ ...prev, [detailTask.id]: Math.max(0, (prev[detailTask.id] || 1) - 1) }))
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const TaskMeta = ({ task }: { task: any }) => (
    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
      {task.due_date && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(task.due_date), 'MMM d, yyyy')}
        </span>
      )}
      {task.contractors && (
        <span>
          {task.contractors.first_name} {task.contractors.last_name}
        </span>
      )}
      {(noteCounts[task.id] || 0) > 0 && (
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {noteCounts[task.id]}
        </span>
      )}
      {(fileCounts[task.id] || 0) > 0 && (
        <span className="flex items-center gap-1">
          <Paperclip className="h-3 w-3" />
          {fileCounts[task.id]}
        </span>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Tasks ({tasks.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="Task title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Task details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input id="due_date" name="due_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor_id">Assign To</Label>
                <Select name="contractor_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tasks yet. Add your first task to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">To Do ({pendingTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => toggleTaskStatus(task)}
                      className="mt-1"
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openDetail(task)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <TaskMeta task={task} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Completed ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border opacity-60"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => toggleTaskStatus(task)}
                      className="mt-1"
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openDetail(task)}
                    >
                      <p className="font-medium line-through">{task.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Task detail / edit dialog */}
      <Dialog open={!!detailTask} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>

          {detailTask && (
            <div className="space-y-6 pt-2">
              {/* Edit form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Task details..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={editForm.due_date}
                      onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={editForm.priority}
                      onValueChange={(v) => setEditForm({ ...editForm, priority: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select
                    value={editForm.contractor_id}
                    onValueChange={(v) => setEditForm({ ...editForm, contractor_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDetail}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Updates / Notes */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Updates &amp; Notes ({notes.length})
                </h3>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an update or note..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="self-end"
                  >
                    {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {note.created_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No updates yet.</p>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Documents ({files.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border p-2"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteFile(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents attached.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
