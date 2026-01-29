'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import { Search, Loader2, ExternalLink, MapPin, Phone, DollarSign, Users, Trash2, Sparkles, Save } from 'lucide-react'
import { format } from 'date-fns'

interface EventResearchProps {
  eventId: string
  eventContext?: {
    name: string
    location_city?: string | null
    location_state?: string | null
    start_date?: string | null
    end_date?: string | null
  }
}

interface ResearchResult {
  name: string
  type?: string
  address?: string
  website?: string
  phone?: string
  priceRange?: string
  capacity?: string
  highlights?: string[]
  notes?: string
}

interface SavedResearch {
  id: string
  query: string
  category: string
  results: {
    summary?: string
    results?: ResearchResult[]
    sources?: string[]
  }
  created_at: string
}

const CATEGORIES = [
  { value: 'hotels', label: 'Hotels' },
  { value: 'venues', label: 'Venues' },
  { value: 'catering', label: 'Catering' },
  { value: 'vendors', label: 'Vendors/Services' },
  { value: 'activities', label: 'Activities' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'general', label: 'General' },
]

const QUICK_PROMPTS = [
  { label: 'Boutique Hotels', prompt: 'Find upscale boutique hotels with meeting space' },
  { label: 'Event Venues', prompt: 'Find unique event venues for corporate events' },
  { label: 'Catering', prompt: 'Find high-end catering companies' },
  { label: 'Team Activities', prompt: 'Find team building activities and experiences' },
  { label: 'Transportation', prompt: 'Find luxury transportation and shuttle services' },
  { label: 'AV/Production', prompt: 'Find AV and production companies for events' },
]

export function EventResearch({ eventId, eventContext }: EventResearchProps) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentCategory, setCurrentCategory] = useState('general')
  const [currentResults, setCurrentResults] = useState<{
    summary?: string
    results?: ResearchResult[]
    sources?: string[]
  } | null>(null)

  const fetchSavedResearch = async () => {
    const { data } = await (supabase as any)
      .from('research_results')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setSavedResearch(data as SavedResearch[])
  }

  useEffect(() => {
    fetchSavedResearch()
  }, [eventId])

  const handleResearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a research query')
      return
    }

    setLoading(true)
    setCurrentResults(null)

    try {
      // Build context string
      let contextStr = ''
      if (eventContext) {
        const parts = []
        if (eventContext.name) parts.push(`Event: ${eventContext.name}`)
        if (eventContext.location_city) {
          parts.push(`Location: ${eventContext.location_city}${eventContext.location_state ? `, ${eventContext.location_state}` : ''}`)
        }
        if (eventContext.start_date) {
          parts.push(`Date: ${format(new Date(eventContext.start_date), 'MMMM yyyy')}`)
        }
        contextStr = parts.join('. ')
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category,
          eventContext: contextStr,
          // Don't pass eventId - we'll save manually
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Research failed')
      }

      setCurrentResults(data.data)
      setCurrentQuery(query)
      setCurrentCategory(category)
      toast.success('Research complete')
    } catch (error) {
      console.error('Research error:', error)
      toast.error('Failed to perform research')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveResearch = async () => {
    if (!currentResults || !currentQuery) return

    setSaving(true)
    try {
      const { error } = await (supabase as any).from('research_results').insert({
        event_id: eventId,
        query: currentQuery,
        category: currentCategory,
        results: currentResults,
        sources: currentResults.sources || [],
      })

      if (error) throw error

      toast.success('Research saved')
      setCurrentResults(null)
      setCurrentQuery('')
      fetchSavedResearch()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save research')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    const location = eventContext?.location_city
      ? `in ${eventContext.location_city}${eventContext.location_state ? `, ${eventContext.location_state}` : ''}`
      : ''
    setQuery(`${prompt} ${location}`.trim())
  }

  const handleDeleteResearch = async (id: string) => {
    const { error } = await (supabase as any).from('research_results').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Research deleted')
    fetchSavedResearch()
  }

  const ResultCard = ({ result }: { result: ResearchResult }) => (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{result.name}</h4>
            {result.type && (
              <Badge variant="secondary" className="text-xs">
                {result.type}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            {result.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {result.address}
              </span>
            )}
            {result.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {result.phone}
              </span>
            )}
            {result.priceRange && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {result.priceRange}
              </span>
            )}
            {result.capacity && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {result.capacity}
              </span>
            )}
          </div>

          {result.highlights && result.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.highlights.map((h, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {h}
                </Badge>
              ))}
            </div>
          )}

          {result.notes && (
            <p className="text-sm text-muted-foreground mt-2">{result.notes}</p>
          )}
        </div>

        {result.website && (
          <a
            href={result.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Research Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Research Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt(p.prompt)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Research Query</Label>
            <Textarea
              placeholder="e.g., Find 5 boutique hotels in downtown Austin with meeting space for 50 people, March 2026"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="w-48">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-end">
              <Button onClick={handleResearch} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Research
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Results */}
      {currentResults && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentResults.summary && (
              <p className="text-muted-foreground">{currentResults.summary}</p>
            )}

            {currentResults.results && currentResults.results.length > 0 && (
              <div className="grid gap-4">
                {currentResults.results.map((result, i) => (
                  <ResultCard key={i} result={result} />
                ))}
              </div>
            )}

            {currentResults.sources && currentResults.sources.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {currentResults.sources.map((source, i) => {
                    try {
                      return (
                        <a
                          key={i}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {new URL(source).hostname}
                        </a>
                      )
                    } catch {
                      return null
                    }
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t">
              <Button onClick={handleSaveResearch} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save to Event
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Research - Accordion */}
      {savedResearch.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Saved Research</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {savedResearch.map((research) => (
              <AccordionItem
                key={research.id}
                value={research.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex-1">
                      <p className="font-medium">{research.query}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {research.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(research.created_at), 'MMM d, yyyy')}
                        </span>
                        {research.results.results && (
                          <span className="text-xs text-muted-foreground">
                            ({research.results.results.length} results)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {research.results.summary && (
                      <p className="text-sm text-muted-foreground">{research.results.summary}</p>
                    )}
                    {research.results.results && research.results.results.length > 0 && (
                      <div className="grid gap-3">
                        {research.results.results.map((result, i) => (
                          <ResultCard key={i} result={result} />
                        ))}
                      </div>
                    )}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResearch(research.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {!currentResults && savedResearch.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p>Use the AI assistant to research hotels, venues, vendors, and more.</p>
            <p className="text-sm mt-1">Click "Save to Event" to keep results for future reference.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
