import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { SourcingClient } from './sourcing-client'

export default async function SourcingPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location_city, location_state, start_date, end_date')
    .order('event_start_date', { ascending: false })

  return (
    <div>
      <Header
        title="Sourcing"
        description="AI-powered research to source hotels, venues, and vendors"
      />
      <SourcingClient events={events || []} />
    </div>
  )
}
