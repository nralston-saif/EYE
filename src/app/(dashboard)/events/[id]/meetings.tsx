'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Calendar, Clock, MapPin, Video, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Meeting } from '@/types/database'

interface EventMeetingsProps {
  eventId: string
}

export function EventMeetings({ eventId }: EventMeetingsProps) {
  const supabase = createClient()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchMeetings = async () => {
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true })
    if (data) setMeetings(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMeetings()
  }, [eventId])

  const handleCreateMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const date = formData.get('date') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string

    const { error } = await supabase.from('meetings').insert({
      event_id: eventId,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      meeting_type: formData.get('meeting_type') as string || 'internal',
      start_time: `${date}T${startTime}:00`,
      end_time: `${date}T${endTime}:00`,
      location: formData.get('location') as string || null,
      teams_link: formData.get('teams_link') as string || null,
    })

    if (error) {
      toast.error('Failed to create meeting')
      return
    }

    toast.success('Meeting created')
    setDialogOpen(false)
    fetchMeetings()
  }

  const handleDeleteMeeting = async (id: string) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete meeting')
      return
    }
    toast.success('Meeting deleted')
    fetchMeetings()
  }

  const getMeetingTypeColor = (type: string | null) => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800'
      case 'vendor': return 'bg-purple-100 text-purple-800'
      case 'internal': return 'bg-green-100 text-green-800'
      case 'onsite': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading meetings...</div>
  }

  const upcomingMeetings = meetings.filter(m => new Date(m.start_time) >= new Date())
  const pastMeetings = meetings.filter(m => new Date(m.start_time) < new Date())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Meetings ({meetings.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="Kickoff Call" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_type">Type</Label>
                <Select name="meeting_type" defaultValue="internal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input id="start_time" name="start_time" type="time" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input id="end_time" name="end_time" type="time" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Conference Room A / Virtual" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teams_link">Teams/Video Link</Label>
                <Input id="teams_link" name="teams_link" placeholder="https://teams.microsoft.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Notes</Label>
                <Textarea id="description" name="description" placeholder="Meeting agenda..." rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Meeting</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Meetings are stored locally. Connect Microsoft 365 in Settings to sync with Outlook Calendar.
      </p>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No meetings scheduled. Create meetings to track calls and site visits.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcomingMeetings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{meeting.title}</h3>
                            <Badge variant="outline" className={getMeetingTypeColor(meeting.meeting_type)}>
                              {meeting.meeting_type}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(meeting.start_time), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
                            </span>
                            {meeting.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </span>
                            )}
                            {meeting.teams_link && (
                              <a
                                href={meeting.teams_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Video className="h-3 w-3" />
                                Join
                              </a>
                            )}
                          </div>
                          {meeting.description && (
                            <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMeeting(meeting.id)}
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

          {pastMeetings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Past</h3>
              <div className="space-y-3">
                {pastMeetings.map((meeting) => (
                  <Card key={meeting.id} className="opacity-60">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{meeting.title}</h3>
                            <Badge variant="outline" className={getMeetingTypeColor(meeting.meeting_type)}>
                              {meeting.meeting_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{format(new Date(meeting.start_time), 'MMM d, yyyy')}</span>
                            <span>
                              {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMeeting(meeting.id)}
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
        </div>
      )}
    </div>
  )
}
