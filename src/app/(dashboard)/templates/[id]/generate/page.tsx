'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  DocumentTemplate,
  TemplateVariable,
  Event,
  Client,
} from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Eye, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  renderTemplate,
  validateVariables,
  getDefaultValues,
} from '@/lib/templates/parser'

export default function GenerateDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [documentName, setDocumentName] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [events, setEvents] = useState<(Event & { client: Client | null })[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventId)

  useEffect(() => {
    const fetchData = async () => {
      // Fetch template
      const { data: templateData, error: templateError } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (templateError || !templateData) {
        toast.error('Template not found')
        router.push('/templates')
        return
      }

      setTemplate(templateData)
      const vars = (templateData.variables as TemplateVariable[]) || []
      setVariables(vars)
      setValues(getDefaultValues(vars))
      setDocumentName(`${templateData.name} - ${format(new Date(), 'MMM d, yyyy')}`)

      // Fetch events for linking
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, client:clients(*)')
        .order('start_date', { ascending: false })

      if (eventsData) {
        setEvents(eventsData as unknown as (Event & { client: Client | null })[])
      }

      // If event is pre-selected, fetch its data to pre-fill variables
      if (eventId) {
        const castEvents = eventsData as unknown as (Event & { client: Client | null })[]
        const selectedEvent = castEvents?.find((e) => e.id === eventId)
        if (selectedEvent) {
          prefillFromEvent(selectedEvent, vars)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [id, eventId, router, supabase])

  const prefillFromEvent = (
    event: Event & { client: Client | null },
    vars: TemplateVariable[]
  ) => {
    const prefilled: Record<string, string> = {}
    const varNames = vars.map((v) => v.name.toLowerCase())

    // Map common event fields to variables
    if (varNames.includes('event_name')) {
      prefilled['event_name'] = event.name
    }
    if (varNames.includes('client_name') && event.client) {
      prefilled['client_name'] = event.client.name
    }
    if (varNames.includes('event_location')) {
      const location = [
        event.location_name,
        event.location_city,
        event.location_state,
      ]
        .filter(Boolean)
        .join(', ')
      prefilled['event_location'] = location
    }
    if (varNames.includes('event_dates')) {
      if (event.event_start_date && event.event_end_date) {
        prefilled['event_dates'] = `${format(
          new Date(event.event_start_date),
          'MMM d'
        )} - ${format(new Date(event.event_end_date), 'MMM d, yyyy')}`
      } else if (event.start_date) {
        prefilled['event_dates'] = format(
          new Date(event.start_date),
          'MMM d, yyyy'
        )
      }
    }

    setValues((prev) => ({ ...prev, ...prefilled }))
  }

  const handleEventChange = async (eventId: string) => {
    setSelectedEventId(eventId)
    const selectedEvent = events.find((e) => e.id === eventId)
    if (selectedEvent) {
      prefillFromEvent(selectedEvent, variables)
    }
  }

  const handleValueChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!template) return

    const validation = validateVariables(variables, values)
    if (!validation.valid) {
      toast.error(`Missing required fields: ${validation.missing.join(', ')}`)
      return
    }

    if (!documentName.trim()) {
      toast.error('Please enter a document name')
      return
    }

    setSaving(true)

    const renderedContent = renderTemplate(template.content, values)
    const selectedEvent = events.find((e) => e.id === selectedEventId)

    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        template_id: template.id,
        event_id: selectedEventId || null,
        client_id: selectedEvent?.client_id || null,
        name: documentName,
        type: template.type,
        content: renderedContent,
        variable_values: values,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to save document')
      console.error(error)
    } else {
      toast.success('Document saved')
      // Could redirect to a document view page if we had one
      router.push('/templates')
    }

    setSaving(false)
  }

  const handleDownload = () => {
    if (!template) return

    const validation = validateVariables(variables, values)
    if (!validation.valid) {
      toast.error(`Missing required fields: ${validation.missing.join(', ')}`)
      return
    }

    const renderedContent = renderTemplate(template.content, values)
    const blob = new Blob([renderedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentName || 'document'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Document downloaded')
  }

  const renderedContent = template
    ? renderTemplate(template.content, values)
    : ''

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading template...
        </div>
      </div>
    )
  }

  if (!template) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/templates/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Generate Document</h1>
          <p className="text-muted-foreground">
            Fill in the variables to generate from &quot;{template.name}&quot;
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Document'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variables Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="docName">Document Name</Label>
                <Input
                  id="docName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event">Link to Event (optional)</Label>
                <Select
                  value={selectedEventId || 'none'}
                  onValueChange={(v) =>
                    handleEventChange(v === 'none' ? '' : v)
                  }
                >
                  <SelectTrigger id="event">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No event</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                        {event.client && ` - ${event.client.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fill in Variables</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete the fields below to generate your document
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This template has no variables to fill in
                </p>
              ) : (
                variables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={variable.name}>
                      {variable.label || variable.name}
                      {variable.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {variable.type === 'textarea' ? (
                      <Textarea
                        id={variable.name}
                        value={values[variable.name] || ''}
                        onChange={(e) =>
                          handleValueChange(variable.name, e.target.value)
                        }
                        placeholder={`Enter ${variable.label?.toLowerCase() || variable.name}`}
                        rows={4}
                      />
                    ) : variable.type === 'date' ? (
                      <Input
                        id={variable.name}
                        type="date"
                        value={values[variable.name] || ''}
                        onChange={(e) =>
                          handleValueChange(variable.name, e.target.value)
                        }
                      />
                    ) : variable.type === 'number' ? (
                      <Input
                        id={variable.name}
                        type="number"
                        value={values[variable.name] || ''}
                        onChange={(e) =>
                          handleValueChange(variable.name, e.target.value)
                        }
                        placeholder={`Enter ${variable.label?.toLowerCase() || variable.name}`}
                      />
                    ) : variable.type === 'select' && variable.options ? (
                      <Select
                        value={values[variable.name] || ''}
                        onValueChange={(v) =>
                          handleValueChange(variable.name, v)
                        }
                      >
                        <SelectTrigger id={variable.name}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={variable.name}
                        value={values[variable.name] || ''}
                        onChange={(e) =>
                          handleValueChange(variable.name, e.target.value)
                        }
                        placeholder={`Enter ${variable.label?.toLowerCase() || variable.name}`}
                      />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <Card className="lg:sticky lg:top-6 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {renderedContent}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
