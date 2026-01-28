import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Building2, MapPin, Globe } from 'lucide-react'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string; tag?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('*, contacts(id), events(id)')
    .order('name', { ascending: true })

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  if (params.tag) {
    query = query.contains('tags', [params.tag])
  }

  const { data: clients } = await query

  return (
    <div>
      <Header
        title="Clients"
        description="Manage your client companies"
        action={{ label: 'New Client', href: '/clients/new' }}
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <Input
              name="search"
              placeholder="Search clients..."
              defaultValue={params.search}
              className="max-w-xs"
            />
            <Input
              name="city"
              placeholder="Filter by city..."
              defaultValue={params.city}
              className="max-w-xs"
            />
          </form>
        </CardContent>
      </Card>

      {/* Clients List */}
      {!clients || clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No clients found</p>
            <Link href="/clients/new" className="text-primary hover:underline mt-2 inline-block">
              Add your first client
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: any) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      {client.industry && (
                        <p className="text-sm text-muted-foreground">{client.industry}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {client.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {client.city}{client.state && `, ${client.state}`}
                          </span>
                        )}
                        {client.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Website
                          </span>
                        )}
                      </div>
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {client.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{client.contacts?.length || 0} contacts</span>
                        <span>{client.events?.length || 0} events</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
