'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { MapPin, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn, formatEventType, formatStatus } from '@/lib/utils'
import { toast } from 'sonner'

interface PendingTask {
  id: string
  title: string
  priority: string | null
}

export interface EventListItem {
  id: string
  name: string
  status: string | null
  event_type: string | null
  event_start_date: string | null
  event_end_date: string | null
  location_city: string | null
  location_name: string | null
  location_state: string | null
  client_name: string | null
  completionPercent: number | null
  pendingTasks: PendingTask[]
  daysUntil: number | null
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
]

const TYPE_OPTIONS = [
  { value: 'sko', label: 'SKO' },
  { value: 'summit', label: 'Summit' },
  { value: 'incentive', label: 'Incentive' },
  { value: 'vip_dinner', label: 'VIP Dinner' },
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'retreat', label: 'Retreat' },
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'other', label: 'Other' },
]

function getStatusColor(status: string | null) {
  switch (status) {
    case 'planning': return 'bg-blue-100 text-blue-800'
    case 'confirmed': return 'bg-green-100 text-green-800'
    case 'in_progress': return 'bg-yellow-100 text-yellow-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    case 'on_hold': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string | null) {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function EventsList({ events }: { events: EventListItem[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkType, setBulkType] = useState('')
  const [applying, setApplying] = useState(false)

  // Completed events sort to the bottom; everything else keeps the
  // server's event_start_date-desc order (Array.sort is stable).
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aDone = a.status === 'completed' ? 1 : 0
        const bDone = b.status === 'completed' ? 1 : 0
        return aDone - bDone
      }),
    [events]
  )

  const allSelected = events.length > 0 && selectedIds.size === events.length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === events.length ? new Set() : new Set(events.map((e) => e.id))
    )
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setBulkStatus('')
    setBulkType('')
  }

  const handleApply = async () => {
    if (!bulkStatus && !bulkType) {
      toast.info('Choose a status or type to apply')
      return
    }

    const update: { status?: string; event_type?: string } = {}
    if (bulkStatus) update.status = bulkStatus
    if (bulkType) update.event_type = bulkType

    setApplying(true)
    const ids = Array.from(selectedIds)
    const { error } = await supabase
      .from('events')
      .update({ ...update, updated_at: new Date().toISOString() })
      .in('id', ids)
    setApplying(false)

    if (error) {
      toast.error('Failed to update events')
      return
    }

    toast.success(`Updated ${ids.length} event${ids.length === 1 ? '' : 's'}`)
    clearSelection()
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* Selection / bulk-action bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          Select all
        </label>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bulkType} onValueChange={setBulkType}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Set type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleApply} disabled={applying}>
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Events */}
      <div className="grid gap-4">
        {sortedEvents.map((event) => {
          const isCompleted = event.status === 'completed'
          const isSelected = selectedIds.has(event.id)

          return (
            <Card
              key={event.id}
              className={cn(
                'transition-shadow hover:shadow-md',
                isCompleted && 'border-l-4 border-l-green-500 bg-muted/30',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(event.id)}
                    className="mt-1.5"
                    aria-label={`Select ${event.name}`}
                  />
                  <Link href={`/events/${event.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                          <h3 className="font-semibold text-lg">{event.name}</h3>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {formatStatus(event.status)}
                          </Badge>
                          {event.event_type && (
                            <Badge variant="secondary">
                              {formatEventType(event.event_type)}
                            </Badge>
                          )}
                          {event.daysUntil !== null && (
                            <Badge variant="secondary" className="text-xs">
                              {event.daysUntil === 0
                                ? 'Today'
                                : event.daysUntil > 0
                                ? `In ${event.daysUntil} days`
                                : `${Math.abs(event.daysUntil)} days ago`}
                            </Badge>
                          )}
                          {event.completionPercent !== null && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {event.completionPercent}% complete
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {event.client_name && <span>{event.client_name}</span>}
                          {(event.location_city || event.location_name) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location_name || event.location_city}
                              {event.location_city && event.location_state && `, ${event.location_state}`}
                            </span>
                          )}
                        </div>
                        {event.completionPercent !== null && (
                          <div className="mt-2 w-48">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${event.completionPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {event.pendingTasks.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {event.pendingTasks.map((task) => (
                              <span key={task.id} className="inline-flex items-center gap-1 text-xs">
                                <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                <Badge
                                  variant="outline"
                                  className={`${getPriorityColor(task.priority)} text-xs px-1 py-0`}
                                >
                                  {task.priority}
                                </Badge>
                                <span className="text-muted-foreground truncate max-w-[200px]">
                                  {task.title}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium">
                          {event.event_start_date
                            ? format(new Date(event.event_start_date), 'MMM d, yyyy')
                            : 'TBD'}
                        </p>
                        {event.event_end_date &&
                          event.event_start_date !== event.event_end_date && (
                            <p className="text-sm text-muted-foreground">
                              to {format(new Date(event.event_end_date), 'MMM d')}
                            </p>
                          )}
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
