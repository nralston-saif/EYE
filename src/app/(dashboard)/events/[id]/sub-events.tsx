'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SubEvent } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { format } from 'date-fns'

interface SubEventsProps {
  eventId: string
}

export function SubEvents({ eventId }: SubEventsProps) {
  const supabase = createClient()
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SubEvent | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
  })

  useEffect(() => {
    fetchSubEvents()
  }, [eventId])

  const fetchSubEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sub_events')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })
      .order('date', { ascending: true })

    if (error) {
      toast.error('Failed to load sub-events')
    } else {
      setSubEvents(data || [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({ name: '', date: '', start_time: '', end_time: '', location: '', description: '' })
    setEditing(null)
  }

  const openEdit = (se: SubEvent) => {
    setEditing(se)
    setFormData({
      name: se.name,
      date: se.date || '',
      start_time: se.start_time || '',
      end_time: se.end_time || '',
      location: se.location || '',
      description: se.description || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    const payload = {
      event_id: eventId,
      name: formData.name,
      date: formData.date || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      location: formData.location || null,
      description: formData.description || null,
      sort_order: editing ? editing.sort_order : subEvents.length,
    }

    if (editing) {
      const { error } = await supabase
        .from('sub_events')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editing.id)

      if (error) {
        toast.error('Failed to update sub-event')
      } else {
        toast.success('Sub-event updated')
        fetchSubEvents()
      }
    } else {
      const { error } = await supabase.from('sub_events').insert(payload)

      if (error) {
        toast.error('Failed to create sub-event')
      } else {
        toast.success('Sub-event created')
        fetchSubEvents()
      }
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sub-event?')) return

    const { error } = await supabase.from('sub_events').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete sub-event')
    } else {
      toast.success('Sub-event deleted')
      setSubEvents(subEvents.filter((se) => se.id !== id))
    }
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = subEvents.findIndex((se) => se.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= subEvents.length) return

    const updated = [...subEvents]
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]

    // Update sort_order for both
    await Promise.all([
      supabase.from('sub_events').update({ sort_order: idx }).eq('id', updated[idx].id),
      supabase.from('sub_events').update({ sort_order: swapIdx }).eq('id', updated[swapIdx].id),
    ])

    setSubEvents(updated)
  }

  const formatTime = (time: string | null) => {
    if (!time) return ''
    const [h, m] = time.split(':')
    const d = new Date()
    d.setHours(parseInt(h), parseInt(m))
    return format(d, 'h:mm a')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sub-Events</h2>
          <p className="text-sm text-muted-foreground">
            Manage sub-events like receptions, dinners, and activities
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sub-Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Sub-Event' : 'Add Sub-Event'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Reception"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Grand Ballroom"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about this sub-event..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit">{editing ? 'Save Changes' : 'Add Sub-Event'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading sub-events...</div>
      ) : subEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No sub-events yet</h3>
            <p className="text-muted-foreground mb-4">
              Add sub-events like Welcome Reception, Farewell Dinner, etc.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subEvents.map((se, idx) => (
                <TableRow key={se.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMove(se.id, 'up')}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMove(se.id, 'down')}
                        disabled={idx === subEvents.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{se.name}</TableCell>
                  <TableCell>
                    {se.date ? format(new Date(se.date), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {se.start_time && (
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {formatTime(se.start_time)}
                        {se.end_time && <> - {formatTime(se.end_time)}</>}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {se.location && (
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {se.location}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {se.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(se)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(se.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
