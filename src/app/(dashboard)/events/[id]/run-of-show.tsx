'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RunOfShowItem, SubEvent } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  FileDown,
  Loader2,
  ListOrdered,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { format } from 'date-fns'

interface RunOfShowProps {
  eventId: string
}

export function RunOfShow({ eventId }: RunOfShowProps) {
  const supabase = createClient()
  const [items, setItems] = useState<RunOfShowItem[]>([])
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RunOfShowItem | null>(null)
  const [exporting, setExporting] = useState(false)

  const [formData, setFormData] = useState({
    time: '',
    activity: '',
    location: '',
    person_responsible: '',
    notes: '',
    sub_event_id: '',
  })

  useEffect(() => {
    fetchItems()
    fetchSubEvents()
  }, [eventId])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('run_of_show_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (error) {
      toast.error('Failed to load run of show')
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  const fetchSubEvents = async () => {
    const { data } = await supabase
      .from('sub_events')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (data) setSubEvents(data)
  }

  const resetForm = () => {
    setFormData({ time: '', activity: '', location: '', person_responsible: '', notes: '', sub_event_id: '' })
    setEditing(null)
  }

  const openEdit = (item: RunOfShowItem) => {
    setEditing(item)
    setFormData({
      time: item.time,
      activity: item.activity,
      location: item.location || '',
      person_responsible: item.person_responsible || '',
      notes: item.notes || '',
      sub_event_id: item.sub_event_id || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.time.trim() || !formData.activity.trim()) {
      toast.error('Time and activity are required')
      return
    }

    const payload = {
      event_id: eventId,
      time: formData.time,
      activity: formData.activity,
      location: formData.location || null,
      person_responsible: formData.person_responsible || null,
      notes: formData.notes || null,
      sub_event_id: formData.sub_event_id || null,
      sort_order: editing ? editing.sort_order : items.length,
    }

    if (editing) {
      const { error } = await supabase
        .from('run_of_show_items')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editing.id)

      if (error) {
        toast.error('Failed to update item')
      } else {
        toast.success('Item updated')
        fetchItems()
      }
    } else {
      const { error } = await supabase.from('run_of_show_items').insert(payload)

      if (error) {
        toast.error('Failed to add item')
      } else {
        toast.success('Item added')
        fetchItems()
      }
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return

    const { error } = await supabase.from('run_of_show_items').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete item')
    } else {
      toast.success('Item deleted')
      setItems(items.filter((i) => i.id !== id))
    }
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= items.length) return

    const updated = [...items]
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]

    await Promise.all([
      supabase.from('run_of_show_items').update({ sort_order: idx }).eq('id', updated[idx].id),
      supabase.from('run_of_show_items').update({ sort_order: swapIdx }).eq('id', updated[swapIdx].id),
    ])

    setItems(updated)
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/run-of-show/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `run-of-show-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF exported')
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  // Group items by sub-event
  const subEventMap = new Map(subEvents.map((se) => [se.id, se]))
  const hasSubEvents = subEvents.length > 0
  const groupedItems = hasSubEvents
    ? items.reduce(
        (acc, item) => {
          const key = item.sub_event_id || '__ungrouped'
          if (!acc[key]) acc[key] = []
          acc[key].push(item)
          return acc
        },
        {} as Record<string, RunOfShowItem[]>
      )
    : { __all: items }

  const renderTable = (tableItems: RunOfShowItem[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <TableHead className="w-32">Time</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableItems.map((item, idx) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => handleMove(item.id, 'up')}
                  disabled={idx === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => handleMove(item.id, 'down')}
                  disabled={idx === tableItems.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
            <TableCell className="font-medium whitespace-nowrap">{item.time}</TableCell>
            <TableCell>{item.activity}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
            <TableCell className="text-sm">{item.person_responsible || '-'}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
              {item.notes || '-'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Run of Show</h2>
          <p className="text-sm text-muted-foreground">
            Detailed schedule of activities for this event
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={exporting || items.length === 0}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
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
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {subEvents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sub-Event</Label>
                    <Select
                      value={formData.sub_event_id}
                      onValueChange={(v) => setFormData({ ...formData, sub_event_id: v === 'none' ? '' : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-event (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sub-event</SelectItem>
                        {subEvents.map((se) => (
                          <SelectItem key={se.id} value={se.id}>
                            {se.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="e.g., 9:00 AM or 9:00 - 10:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Activity *</Label>
                    <Input
                      value={formData.activity}
                      onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                      placeholder="e.g., Registration"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Main Lobby"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Input
                      value={formData.person_responsible}
                      onChange={(e) => setFormData({ ...formData, person_responsible: e.target.value })}
                      placeholder="e.g., Jane Smith"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editing ? 'Save Changes' : 'Add Item'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading run of show...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-4">
              Build your event schedule by adding run of show items
            </p>
          </CardContent>
        </Card>
      ) : hasSubEvents ? (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([key, groupItems]) => {
            const subEvent = key !== '__ungrouped' ? subEventMap.get(key) : null
            return (
              <div key={key}>
                <h3 className="text-base font-semibold mb-2">
                  {subEvent ? subEvent.name : 'General'}
                  {subEvent?.date && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {format(new Date(subEvent.date), 'MMM d, yyyy')}
                    </span>
                  )}
                </h3>
                <Card>{renderTable(groupItems)}</Card>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>{renderTable(items)}</Card>
      )}
    </div>
  )
}
