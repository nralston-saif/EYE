import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { HardHat, MapPin, Star, Mail, Phone, CheckCircle, XCircle } from 'lucide-react'

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string; specialty?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contractors')
    .select('*')
    .order('last_name', { ascending: true })

  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`)
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  if (params.specialty) {
    query = query.contains('specialties', [params.specialty])
  }

  const { data: contractors } = await query

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div>
      <Header
        title="Contractors"
        description="Manage your contractor directory"
        action={{ label: 'Add Contractor', href: '/contractors/new' }}
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <Input
              name="search"
              placeholder="Search by name..."
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

      {/* Contractors List */}
      {!contractors || contractors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No contractors found</p>
            <Link href="/contractors/new" className="text-primary hover:underline mt-2 inline-block">
              Add your first contractor
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contractors.map((contractor: any) => (
            <Link key={contractor.id} href={`/contractors/${contractor.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <HardHat className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {contractor.first_name} {contractor.last_name}
                        </h3>
                        {contractor.rating && (
                          <span className="flex items-center gap-1 text-sm text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            {contractor.rating}
                          </span>
                        )}
                      </div>
                      {contractor.role && (
                        <p className="text-sm text-muted-foreground">{contractor.role}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {contractor.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {contractor.city}{contractor.state && `, ${contractor.state}`}
                          </span>
                        )}
                      </div>

                      {contractor.specialties && contractor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contractor.specialties.slice(0, 3).map((specialty: string) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs">
                        {contractor.hourly_rate && (
                          <span className="text-muted-foreground">
                            {formatCurrency(contractor.hourly_rate)}/hr
                          </span>
                        )}
                        {contractor.day_rate && (
                          <span className="text-muted-foreground">
                            {formatCurrency(contractor.day_rate)}/day
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span className={`flex items-center gap-1 text-xs ${contractor.w9_on_file ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {contractor.w9_on_file ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          W-9
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${contractor.insurance_on_file ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {contractor.insurance_on_file ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          Insurance
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${contractor.nda_signed ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {contractor.nda_signed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          NDA
                        </span>
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
