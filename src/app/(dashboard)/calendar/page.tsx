import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { Calendar as CalendarIcon, Clock, MapPin, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Parse month from query params or use current month
  const currentDate = params.month ? new Date(params.month) : new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Fetch meetings and events for this month
  const [{ data: meetings }, { data: events }] = await Promise.all([
    supabase
      .from('meetings')
      .select('*, events(id, name)')
      .gte('start_time', monthStart.toISOString())
      .lte('start_time', monthEnd.toISOString())
      .order('start_time', { ascending: true }),
    supabase
      .from('events')
      .select('id, name, start_date, end_date, status, clients(name)')
      .or(`start_date.gte.${monthStart.toISOString().split('T')[0]},end_date.gte.${monthStart.toISOString().split('T')[0]}`)
      .lte('start_date', monthEnd.toISOString().split('T')[0])
      .order('start_date', { ascending: true }),
  ])

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const prevMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd')
  const nextMonth = format(addMonths(currentDate, 1), 'yyyy-MM-dd')

  const getMeetingTypeColor = (type: string | null) => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800'
      case 'vendor': return 'bg-purple-100 text-purple-800'
      case 'internal': return 'bg-green-100 text-green-800'
      case 'onsite': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Group meetings by date
  const meetingsByDate = (meetings || []).reduce((acc: any, meeting: any) => {
    const date = format(new Date(meeting.start_time), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(meeting)
    return acc
  }, {})

  return (
    <div>
      <Header
        title="Calendar"
        description="View meetings and events"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/calendar?month=${prevMonth}`}>Previous</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/calendar">Today</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/calendar?month=${nextMonth}`}>Next</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {/* Padding for days before month start */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="p-2" />
                ))}
                {days.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayMeetings = meetingsByDate[dateKey] || []
                  const hasEvents = events?.some(
                    (e: any) => e.start_date === dateKey || e.end_date === dateKey
                  )

                  return (
                    <div
                      key={dateKey}
                      className={`min-h-[80px] p-1 border rounded-md ${
                        isToday(day) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <p className={`text-sm font-medium ${
                        isToday(day) ? 'text-primary' : ''
                      }`}>
                        {format(day, 'd')}
                      </p>
                      <div className="space-y-1 mt-1">
                        {dayMeetings.slice(0, 2).map((meeting: any) => (
                          <div
                            key={meeting.id}
                            className="text-xs p-1 rounded bg-primary/20 truncate"
                            title={meeting.title}
                          >
                            {format(new Date(meeting.start_time), 'h:mm a')} - {meeting.title}
                          </div>
                        ))}
                        {dayMeetings.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{dayMeetings.length - 2} more
                          </p>
                        )}
                        {hasEvents && dayMeetings.length === 0 && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title="Event" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground mt-4">
            Meetings are stored locally. Connect Microsoft 365 in Settings to sync with Outlook Calendar.
          </p>
        </div>

        {/* Upcoming */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              {!meetings || meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings this month</p>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 5).map((meeting: any) => (
                    <div key={meeting.id} className="border-l-2 border-primary pl-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{meeting.title}</p>
                        <Badge variant="outline" className={getMeetingTypeColor(meeting.meeting_type)}>
                          {meeting.meeting_type}
                        </Badge>
                      </div>
                      {meeting.events && (
                        <Link
                          href={`/events/${meeting.events.id}`}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {meeting.events.name}
                        </Link>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(meeting.start_time), 'MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(meeting.start_time), 'h:mm a')}
                        </span>
                      </div>
                      {meeting.teams_link && (
                        <a
                          href={meeting.teams_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          <Video className="h-3 w-3" />
                          Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Events This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {!events || events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events this month</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event: any) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="p-2 rounded hover:bg-muted/50 transition-colors">
                        <p className="font-medium text-sm">{event.name}</p>
                        {event.clients?.name && (
                          <p className="text-xs text-muted-foreground">{event.clients.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.start_date && format(new Date(event.start_date), 'MMM d')}
                          {event.end_date && event.start_date !== event.end_date && (
                            <> - {format(new Date(event.end_date), 'MMM d')}</>
                          )}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
