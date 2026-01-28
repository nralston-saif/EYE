import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { User, Building2, Mail, Phone, Star } from 'lucide-react'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contacts')
    .select('*, clients(id, name)')
    .order('last_name', { ascending: true })

  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  const { data: contacts } = await query

  return (
    <div>
      <Header
        title="Contacts"
        description="All contacts across your clients"
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <Input
              name="search"
              placeholder="Search by name or email..."
              defaultValue={params.search}
              className="max-w-sm"
            />
          </form>
        </CardContent>
      </Card>

      {/* Contacts List */}
      {!contacts || contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No contacts found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contacts are added through client pages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact: any) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    )}
                    {contact.clients && (
                      <Link
                        href={`/clients/${contact.clients.id}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mt-1"
                      >
                        <Building2 className="h-3 w-3" />
                        {contact.clients.name}
                      </Link>
                    )}
                    <div className="flex flex-col gap-1 mt-3">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary truncate"
                        >
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                        >
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
