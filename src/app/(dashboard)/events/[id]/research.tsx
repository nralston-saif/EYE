'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Loader2, ExternalLink, MapPin, Phone, DollarSign, Users, Trash2, Sparkles } from 'lucide-react'
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
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([])
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
          eventId,
          category,
          eventContext: contextStr,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Research failed')
      }

      setCurrentResults(data.data)
      toast.success('Research complete')
      fetchSavedResearch()
    } catch (error) {
      console.error('Research error:', error)
      toast.error('Failed to perform research')
    } finally {
      setLoading(false)
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
    fetchSavedResearch()
  }

  const ResultCard = ({ result }: { result: ResearchResult }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
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
      </CardContent>
    </Card>
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
                  {currentResults.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {new URL(source).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Research */}
      {savedResearch.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previous Research</h3>
          {savedResearch.map((research) => (
            <Card key={research.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{research.query}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{research.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(research.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteResearch(research.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {research.results.summary && (
                  <p className="text-sm text-muted-foreground mb-3">{research.results.summary}</p>
                )}
                {research.results.results && research.results.results.length > 0 && (
                  <div className="grid gap-3">
                    {research.results.results.slice(0, 3).map((result, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium text-sm">{result.name}</p>
                          {result.address && (
                            <p className="text-xs text-muted-foreground">{result.address}</p>
                          )}
                        </div>
                        {result.website && (
                          <a href={result.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                    ))}
                    {research.results.results.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{research.results.results.length - 3} more results
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!currentResults && savedResearch.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p>Use the AI assistant to research hotels, venues, vendors, and more.</p>
            <p className="text-sm mt-1">Results are saved to this event for future reference.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
