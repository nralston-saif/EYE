import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HardHat, MapPin, Star, Mail, Phone, Edit, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contractor }, { data: assignments }] = await Promise.all([
    supabase.from('contractors').select('*').eq('id', id).single(),
    supabase
      .from('event_contractors')
      .select('*, events(id, name, start_date, status)')
      .eq('contractor_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!contractor) {
    notFound()
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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
            <HardHat className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {contractor.first_name} {contractor.last_name}
              </h1>
              {contractor.rating && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  {contractor.rating}/5
                </span>
              )}
            </div>
            {contractor.role && (
              <p className="text-lg text-muted-foreground">{contractor.role}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              {contractor.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {contractor.city}{contractor.state && `, ${contractor.state}`}
                </span>
              )}
              {contractor.email && (
                <a href={`mailto:${contractor.email}`} className="flex items-center gap-1 hover:text-primary">
                  <Mail className="h-4 w-4" />
                  {contractor.email}
                </a>
              )}
              {contractor.phone && (
                <a href={`tel:${contractor.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-4 w-4" />
                  {contractor.phone}
                </a>
              )}
            </div>
            {contractor.specialties && contractor.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {contractor.specialties.map((specialty: string) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/contractors/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="text-2xl font-bold">{formatCurrency(contractor.hourly_rate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Day Rate</p>
                <p className="text-2xl font-bold">{formatCurrency(contractor.day_rate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Documentation</p>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 text-sm ${contractor.w9_on_file ? 'text-green-600' : 'text-muted-foreground'}`}>
                {contractor.w9_on_file ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                W-9 on file
              </div>
              <div className={`flex items-center gap-2 text-sm ${contractor.insurance_on_file ? 'text-green-600' : 'text-muted-foreground'}`}>
                {contractor.insurance_on_file ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                Insurance on file
              </div>
              <div className={`flex items-center gap-2 text-sm ${contractor.nda_signed ? 'text-green-600' : 'text-muted-foreground'}`}>
                {contractor.nda_signed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                NDA signed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event History ({assignments?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!assignments || assignments.length === 0 ? (
              <p className="text-muted-foreground">No event assignments yet</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment: any) => (
                  <Link key={assignment.id} href={`/events/${assignment.events?.id}`}>
                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assignment.events?.name}</p>
                          {assignment.role && (
                            <p className="text-sm text-muted-foreground">{assignment.role}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(assignment.events?.status)}>
                          {assignment.events?.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.events?.start_date && format(new Date(assignment.events.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {contractor.notes ? (
              <p className="whitespace-pre-wrap">{contractor.notes}</p>
            ) : (
              <p className="text-muted-foreground">No notes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
