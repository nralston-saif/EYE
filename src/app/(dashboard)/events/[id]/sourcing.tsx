'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SourcedVendor, VendorStatus } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Phone,
  MapPin,
  DollarSign,
  Users,
  Download,
  Import,
  MoreHorizontal,
  FileDown,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'

interface EventSourcingProps {
  eventId: string
}

interface ResearchResult {
  name: string
  type?: string
  address?: string
  website?: string
  phone?: string
  priceRange?: string
  capacity?: string
}

interface SavedResearch {
  id: string
  query: string
  category: string
  results: {
    results?: ResearchResult[]
  }
}

const STATUS_OPTIONS: { value: VendorStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'rfp_sent', label: 'RFP Sent' },
  { value: 'proposal_received', label: 'Proposal Received' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'selected', label: 'Selected' },
  { value: 'contracted', label: 'Contracted' },
  { value: 'declined', label: 'Declined' },
]

const STATUS_COLORS: Record<VendorStatus, string> = {
  identified: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  rfp_sent: 'bg-purple-100 text-purple-800',
  proposal_received: 'bg-yellow-100 text-yellow-800',
  negotiating: 'bg-orange-100 text-orange-800',
  selected: 'bg-green-100 text-green-800',
  contracted: 'bg-green-200 text-green-900',
  declined: 'bg-red-100 text-red-800',
}

const CATEGORIES = [
  'Hotel',
  'Venue',
  'Catering',
  'AV/Production',
  'Transportation',
  'Entertainment',
  'Decor',
  'Photography',
  'Other',
]

export function EventSourcing({ eventId }: EventSourcingProps) {
  const supabase = createClient()
  const [vendors, setVendors] = useState<SourcedVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<SourcedVendor | null>(null)
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([])
  const [selectedResearchId, setSelectedResearchId] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    website: '',
    phone: '',
    address: '',
    price_range: '',
    capacity: '',
    status: 'identified' as VendorStatus,
    priority: 0,
    notes: '',
    quoted_price: '',
    final_price: '',
    rfp_sent_date: '',
    proposal_due_date: '',
    proposal_received_date: '',
  })

  useEffect(() => {
    fetchVendors()
    fetchResearch()
  }, [eventId])

  const fetchVendors = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sourced_vendors')
      .select('*')
      .eq('event_id', eventId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load vendors')
    } else {
      setVendors(data || [])
    }
    setLoading(false)
  }

  const fetchResearch = async () => {
    const { data } = await supabase
      .from('research_results')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (data) {
      setSavedResearch(data as SavedResearch[])
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      website: '',
      phone: '',
      address: '',
      price_range: '',
      capacity: '',
      status: 'identified',
      priority: 0,
      notes: '',
      quoted_price: '',
      final_price: '',
      rfp_sent_date: '',
      proposal_due_date: '',
      proposal_received_date: '',
    })
    setEditingVendor(null)
  }

  const openEditDialog = (vendor: SourcedVendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      category: vendor.category || '',
      website: vendor.website || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      price_range: vendor.price_range || '',
      capacity: vendor.capacity || '',
      status: vendor.status,
      priority: vendor.priority || 0,
      notes: vendor.notes || '',
      quoted_price: vendor.quoted_price?.toString() || '',
      final_price: vendor.final_price?.toString() || '',
      rfp_sent_date: vendor.rfp_sent_date || '',
      proposal_due_date: vendor.proposal_due_date || '',
      proposal_received_date: vendor.proposal_received_date || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Vendor name is required')
      return
    }

    const vendorData = {
      event_id: eventId,
      name: formData.name,
      category: formData.category || null,
      website: formData.website || null,
      phone: formData.phone || null,
      address: formData.address || null,
      price_range: formData.price_range || null,
      capacity: formData.capacity || null,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes || null,
      quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : null,
      final_price: formData.final_price ? parseFloat(formData.final_price) : null,
      rfp_sent_date: formData.rfp_sent_date || null,
      proposal_due_date: formData.proposal_due_date || null,
      proposal_received_date: formData.proposal_received_date || null,
    }

    if (editingVendor) {
      const { error } = await supabase
        .from('sourced_vendors')
        .update({ ...vendorData, updated_at: new Date().toISOString() })
        .eq('id', editingVendor.id)

      if (error) {
        toast.error('Failed to update vendor')
      } else {
        toast.success('Vendor updated')
        fetchVendors()
      }
    } else {
      const { error } = await supabase.from('sourced_vendors').insert(vendorData)

      if (error) {
        toast.error('Failed to add vendor')
      } else {
        toast.success('Vendor added')
        fetchVendors()
      }
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor?')) return

    const { error } = await supabase.from('sourced_vendors').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete vendor')
    } else {
      toast.success('Vendor deleted')
      setVendors(vendors.filter((v) => v.id !== id))
    }
  }

  const handleStatusChange = async (id: string, status: VendorStatus) => {
    const { error } = await supabase
      .from('sourced_vendors')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setVendors(vendors.map((v) => (v.id === id ? { ...v, status } : v)))
    }
  }

  const handleImportFromResearch = async () => {
    if (!selectedResearchId) return

    const research = savedResearch.find((r) => r.id === selectedResearchId)
    if (!research?.results?.results) {
      toast.error('No results to import')
      return
    }

    const toImport = research.results.results
    let imported = 0

    for (const result of toImport) {
      // Check if already imported
      const exists = vendors.some(
        (v) => v.name.toLowerCase() === result.name.toLowerCase()
      )
      if (exists) continue

      const { error } = await supabase.from('sourced_vendors').insert({
        event_id: eventId,
        research_result_id: research.id,
        name: result.name,
        category: result.type || research.category || null,
        website: result.website || null,
        phone: result.phone || null,
        address: result.address || null,
        price_range: result.priceRange || null,
        capacity: result.capacity || null,
        status: 'identified',
      })

      if (!error) imported++
    }

    if (imported > 0) {
      toast.success(`Imported ${imported} vendor(s)`)
      fetchVendors()
    } else {
      toast.info('No new vendors to import')
    }

    setImportDialogOpen(false)
    setSelectedResearchId('')
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/sourcing/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sourcing-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF exported')
    } catch (error) {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Group vendors by status for summary
  const statusCounts = vendors.reduce(
    (acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1
      return acc
    },
    {} as Record<VendorStatus, number>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vendor Sourcing</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage vendors for this event
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedResearch.length > 0 && (
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Import className="h-4 w-4 mr-2" />
                  Import from Research
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import from Research</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Select Research</Label>
                    <Select
                      value={selectedResearchId}
                      onValueChange={setSelectedResearchId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose research to import from" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedResearch.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.query} ({r.results.results?.length || 0} results)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleImportFromResearch}
                    disabled={!selectedResearchId}
                    className="w-full"
                  >
                    Import Vendors
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={handleExportPDF} disabled={exporting || vendors.length === 0}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter vendor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData({ ...formData, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Input
                      value={formData.price_range}
                      onChange={(e) =>
                        setFormData({ ...formData, price_range: e.target.value })
                      }
                      placeholder="e.g., $$$"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      placeholder="e.g., 200 guests"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as VendorStatus })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quoted Price</Label>
                    <Input
                      type="number"
                      value={formData.quoted_price}
                      onChange={(e) =>
                        setFormData({ ...formData, quoted_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Price</Label>
                    <Input
                      type="number"
                      value={formData.final_price}
                      onChange={(e) =>
                        setFormData({ ...formData, final_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>RFP Sent Date</Label>
                    <Input
                      type="date"
                      value={formData.rfp_sent_date}
                      onChange={(e) =>
                        setFormData({ ...formData, rfp_sent_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proposal Due Date</Label>
                    <Input
                      type="date"
                      value={formData.proposal_due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, proposal_due_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proposal Received</Label>
                    <Input
                      type="date"
                      value={formData.proposal_received_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proposal_received_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingVendor ? 'Save Changes' : 'Add Vendor'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Summary */}
      {vendors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const count = statusCounts[s.value] || 0
            if (count === 0) return null
            return (
              <Badge key={s.value} className={STATUS_COLORS[s.value]}>
                {s.label}: {count}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Vendors Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading vendors...
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No vendors yet</h3>
            <p className="text-muted-foreground mb-4">
              Add vendors manually or import from your research results
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Pricing</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      {vendor.address && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {vendor.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.category && (
                      <Badge variant="outline">{vendor.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={vendor.status}
                      onValueChange={(v) =>
                        handleStatusChange(vendor.id, v as VendorStatus)
                      }
                    >
                      <SelectTrigger className="w-40 h-8">
                        <Badge className={STATUS_COLORS[vendor.status]}>
                          {STATUS_OPTIONS.find((s) => s.value === vendor.status)
                            ?.label || vendor.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <Badge className={STATUS_COLORS[s.value]}>
                              {s.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {vendor.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </span>
                      )}
                      {vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      {vendor.quoted_price && (
                        <div className="text-muted-foreground">
                          Quoted: {formatCurrency(vendor.quoted_price)}
                        </div>
                      )}
                      {vendor.final_price && (
                        <div className="font-medium">
                          Final: {formatCurrency(vendor.final_price)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(vendor)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(vendor.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
