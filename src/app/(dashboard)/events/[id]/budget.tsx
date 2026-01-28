'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import type { BudgetItem, BudgetCategory } from '@/types/database'

interface EventBudgetProps {
  eventId: string
}

export function EventBudget({ eventId }: EventBudgetProps) {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchItems = async () => {
    const { data } = await supabase
      .from('budget_items')
      .select('*, budget_categories(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    if (data) setItems(data as any[])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('budget_categories').select('*').order('sort_order')
    if (data) setCategories(data)
  }

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [eventId])

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from('budget_items').insert({
      event_id: eventId,
      description: formData.get('description') as string,
      category_id: formData.get('category_id') as string || null,
      estimated_amount: parseFloat(formData.get('estimated_amount') as string) || 0,
      vendor_name: formData.get('vendor_name') as string || null,
    })

    if (error) {
      toast.error('Failed to add budget item')
      return
    }

    toast.success('Budget item added')
    setDialogOpen(false)
    fetchItems()
  }

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete item')
      return
    }
    fetchItems()
  }

  const handleUpdateAmount = async (id: string, field: string, value: string) => {
    const numValue = parseFloat(value) || null
    const { error } = await supabase
      .from('budget_items')
      .update({ [field]: numValue })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update')
      return
    }
    fetchItems()
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const totals = items.reduce(
    (acc, item) => ({
      estimated: acc.estimated + (item.estimated_amount || 0),
      quoted: acc.quoted + (item.quoted_amount || 0),
      approved: acc.approved + (item.approved_amount || 0),
      actual: acc.actual + (item.actual_amount || 0),
    }),
    { estimated: 0, quoted: 0, approved: 0, actual: 0 }
  )

  const variance = totals.estimated - totals.actual
  const variancePercent = totals.estimated > 0 ? ((variance / totals.estimated) * 100).toFixed(1) : 0

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading budget...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Estimated</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.estimated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Quoted</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.quoted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.approved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Actual</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.actual)}</p>
            {totals.actual > 0 && (
              <p className={`text-sm ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variance >= 0 ? 'Under' : 'Over'} by {formatCurrency(Math.abs(variance))} ({variancePercent}%)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Line Items</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input id="description" name="description" required placeholder="Venue rental" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_amount">Estimated Amount</Label>
                <Input
                  id="estimated_amount"
                  name="estimated_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_name">Vendor</Label>
                <Input id="vendor_name" name="vendor_name" placeholder="Vendor name" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No budget items yet. Add items to track your event budget.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Estimated</TableHead>
                  <TableHead className="text-right">Quoted</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.budget_categories?.name || '-'}</TableCell>
                    <TableCell>{item.vendor_name || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.estimated_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 text-right"
                        defaultValue={item.quoted_amount || ''}
                        onBlur={(e) => handleUpdateAmount(item.id, 'quoted_amount', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 text-right"
                        defaultValue={item.approved_amount || ''}
                        onBlur={(e) => handleUpdateAmount(item.id, 'approved_amount', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 text-right"
                        defaultValue={item.actual_amount || ''}
                        onBlur={(e) => handleUpdateAmount(item.id, 'actual_amount', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
