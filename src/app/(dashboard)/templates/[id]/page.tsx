'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DocumentTemplate, TemplateVariable, DocumentType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Plus, Trash2, Variable, FileOutput } from 'lucide-react'
import { toast } from 'sonner'
import {
  extractVariables,
  formatVariableLabel,
  mergeVariableDefinitions,
} from '@/lib/templates/parser'

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'rfp', label: 'Request for Proposal (RFP)' },
  { value: 'sow', label: 'Statement of Work (SOW)' },
  { value: 'msa', label: 'Master Service Agreement (MSA)' },
  { value: 'contract', label: 'Contract' },
]

const variableTypes: { value: TemplateVariable['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
]

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [type, setType] = useState<DocumentType>('rfp')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        toast.error('Template not found')
        router.push('/templates')
        return
      }

      setName(data.name)
      setType(data.type)
      setDescription(data.description || '')
      setContent(data.content)
      setVariables((data.variables as TemplateVariable[]) || [])
      setLoading(false)
    }

    fetchTemplate()
  }, [id, router, supabase])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    const extracted = extractVariables(newContent)
    const merged = mergeVariableDefinitions(variables, extracted)
    setVariables(merged)
  }

  const handleAddVariable = () => {
    setVariables([
      ...variables,
      {
        name: '',
        label: '',
        type: 'text',
        required: true,
      },
    ])
  }

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const handleVariableChange = (
    index: number,
    field: keyof TemplateVariable,
    value: unknown
  ) => {
    const updated = [...variables]
    updated[index] = { ...updated[index], [field]: value }

    if (field === 'name' && !updated[index].label) {
      updated[index].label = formatVariableLabel(value as string)
    }

    setVariables(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name')
      return
    }

    const invalidVars = variables.filter(
      (v) => v.name && !/^\w+$/.test(v.name)
    )
    if (invalidVars.length > 0) {
      toast.error(
        'Variable names can only contain letters, numbers, and underscores'
      )
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('document_templates')
      .update({
        name,
        type,
        description: description || null,
        content,
        variables: variables.filter((v) => v.name),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      toast.error('Failed to save template')
      console.error(error)
    } else {
      toast.success('Template saved')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading template...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Template</h1>
          <p className="text-muted-foreground">{name}</p>
        </div>
        <Link href={`/templates/${id}/generate`}>
          <Button variant="outline">
            <FileOutput className="h-4 w-4 mr-2" />
            Generate Document
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Standard Venue RFP"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of when to use this template"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use {'{{variable_name}}'} syntax for fill-in-the-blank fields
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your template content..."
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Variables Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Variable className="h-5 w-5" />
                  Variables
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddVariable}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Define the input fields for each variable
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Variables will appear here as you add {'{{placeholders}}'} to
                  your content
                </p>
              ) : (
                variables.map((variable, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg space-y-3 relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveVariable(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <div className="space-y-2 pr-8">
                      <Label className="text-xs">Variable Name</Label>
                      <Input
                        value={variable.name}
                        onChange={(e) =>
                          handleVariableChange(index, 'name', e.target.value)
                        }
                        placeholder="variable_name"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Display Label</Label>
                      <Input
                        value={variable.label}
                        onChange={(e) =>
                          handleVariableChange(index, 'label', e.target.value)
                        }
                        placeholder="Variable Label"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={variable.type}
                          onValueChange={(v) =>
                            handleVariableChange(index, 'type', v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {variableTypes.map((vt) => (
                              <SelectItem key={vt.value} value={vt.value}>
                                {vt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Default Value</Label>
                        <Input
                          value={variable.defaultValue || ''}
                          onChange={(e) =>
                            handleVariableChange(
                              index,
                              'defaultValue',
                              e.target.value
                            )
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={variable.required}
                        onCheckedChange={(checked) =>
                          handleVariableChange(index, 'required', checked)
                        }
                      />
                      <Label htmlFor={`required-${index}`} className="text-xs">
                        Required field
                      </Label>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
