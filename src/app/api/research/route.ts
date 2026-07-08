import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Web-search research calls routinely exceed Vercel's default function timeout
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, eventId, category, eventContext } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Build the research prompt
    const systemPrompt = `You are a research assistant for an experiential marketing and event planning company.
Your job is to research and compile information about venues, hotels, vendors, and services for corporate events.

When researching, provide:
- Specific recommendations with names and details
- Addresses and contact information when available
- Capacity/size information when relevant
- Price ranges or estimates when available
- Why each option might be good for the event
- Links to websites when available

Format your response as a JSON object with this structure:
{
  "summary": "Brief summary of findings",
  "results": [
    {
      "name": "Name of venue/hotel/vendor",
      "type": "hotel|venue|vendor|restaurant|activity|transport|other",
      "address": "Full address if available",
      "website": "URL if available",
      "phone": "Phone number if available",
      "priceRange": "$ / $$ / $$$ / $$$$ or specific range",
      "capacity": "Capacity info if relevant",
      "highlights": ["Key feature 1", "Key feature 2"],
      "notes": "Why this might be good for the event"
    }
  ],
  "sources": ["URL sources used for research"]
}

Always return valid JSON. If you can't find specific information, omit that field rather than making it up.`

    const userPrompt = eventContext
      ? `Research request: ${query}\n\nEvent context: ${eventContext}`
      : query

    // Call OpenAI with web search
    const response = await openai.responses.create({
      model: 'gpt-5.5',
      instructions: systemPrompt,
      input: userPrompt,
      tools: [{ type: 'web_search' }],
    })

    const textContent = response.output_text

    // Try to parse as JSON
    let parsedResults
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON found, create a simple structure
        parsedResults = {
          summary: textContent,
          results: [],
          sources: []
        }
      }
    } catch {
      // If JSON parsing fails, return the raw text
      parsedResults = {
        summary: textContent,
        results: [],
        sources: []
      }
    }

    // Save to database if eventId is provided
    if (eventId) {
      const { error: dbError } = await (supabase as any).from('research_results').insert({
        event_id: eventId,
        query,
        category: category || 'general',
        results: parsedResults,
        sources: parsedResults.sources || [],
      })

      if (dbError) {
        console.error('Failed to save research results:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedResults,
    })
  } catch (error: any) {
    console.error('Research API error:', error)
    const errorMessage = error?.message || 'Failed to perform research'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
