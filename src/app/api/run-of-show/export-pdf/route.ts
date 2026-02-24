import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { RunOfShowPDF } from '@/lib/pdf/run-of-show-pdf'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Fetch event with client
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, client:clients(*)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch sub-events
    const { data: subEvents } = await supabase
      .from('sub_events')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    // Fetch run of show items
    const { data: items, error: itemsError } = await supabase
      .from('run_of_show_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch run of show items' },
        { status: 500 }
      )
    }

    // Generate PDF
    const pdfElement = RunOfShowPDF({
      event: event as any,
      items: items || [],
      subEvents: subEvents || [],
    })
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="run-of-show-${event.name.replace(/[^a-z0-9]/gi, '-')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
