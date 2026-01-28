'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Mail, Phone, Star, Trash2 } from 'lucide-react'
import type { Contact } from '@/types/database'

interface ClientContactsProps {
  clientId: string
}

export function ClientContacts({ clientId }: ClientContactsProps) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('last_name', { ascending: true })
    if (data) setContacts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [clientId])

  const handleCreateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from('contacts').insert({
      client_id: clientId,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      role: formData.get('role') as string || null,
      is_primary: formData.get('is_primary') === 'on',
    })

    if (error) {
      toast.error('Failed to add contact')
      return
    }

    toast.success('Contact added')
    setDialogOpen(false)
    fetchContacts()
  }

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete contact')
      return
    }
    toast.success('Contact deleted')
    fetchContacts()
  }

  const handleSetPrimary = async (id: string) => {
    // First unset all primary
    await supabase
      .from('contacts')
      .update({ is_primary: false })
      .eq('client_id', clientId)

    // Then set the selected as primary
    const { error } = await supabase
      .from('contacts')
      .update({ is_primary: true })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update contact')
      return
    }
    fetchContacts()
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contacts ({contacts.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" name="first_name" required placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" name="last_name" required placeholder="Smith" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="(555) 555-5555" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input id="role" name="role" placeholder="Event Manager" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is_primary" name="is_primary" />
                <Label htmlFor="is_primary" className="text-sm font-normal">
                  Primary contact
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Contact</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No contacts yet. Add contacts to track your client relationships.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    )}
                    <div className="flex flex-col gap-1 mt-2">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                        >
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                        >
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!contact.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetPrimary(contact.id)}
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
