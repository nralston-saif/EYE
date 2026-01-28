import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, MapPin, Globe, Edit, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ClientContacts } from './contacts'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: events }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('events')
      .select('id, name, start_date, status, event_type')
      .eq('client_id', id)
      .order('start_date', { ascending: false }),
  ])

  if (!client) {
    notFound()
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-muted-foreground">
              {client.industry && <span>{client.industry}</span>}
              {client.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {client.city}{client.state && `, ${client.state}`}
                </span>
              )}
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {client.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/clients/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="events">Events ({events?.length || 0})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ClientContacts clientId={id} />
        </TabsContent>

        <TabsContent value="events">
          {!events || events.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No events for this client yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((event: any) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{event.name}</h3>
                            <Badge variant="outline" className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </div>
                          {event.event_type && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {event.start_date ? format(new Date(event.start_date), 'MMM d, yyyy') : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                {client.address || client.city ? (
                  <div className="space-y-1">
                    {client.address && <p>{client.address}</p>}
                    {client.city && (
                      <p>
                        {client.city}
                        {client.state && `, ${client.state}`}
                        {client.zip && ` ${client.zip}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No address on file</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {client.notes ? (
                  <p className="whitespace-pre-wrap">{client.notes}</p>
                ) : (
                  <p className="text-muted-foreground">No notes</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
