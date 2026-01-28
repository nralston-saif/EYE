'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function NewContractorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')

  const handleAddSpecialty = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const specialty = specialtyInput.trim()
      if (specialty && !specialties.includes(specialty)) {
        setSpecialties([...specialties, specialty])
        setSpecialtyInput('')
      }
    }
  }

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      role: formData.get('role') as string || null,
      city: formData.get('city') as string || null,
      state: formData.get('state') as string || null,
      hourly_rate: parseFloat(formData.get('hourly_rate') as string) || null,
      day_rate: parseFloat(formData.get('day_rate') as string) || null,
      w9_on_file: formData.get('w9_on_file') === 'on',
      insurance_on_file: formData.get('insurance_on_file') === 'on',
      nda_signed: formData.get('nda_signed') === 'on',
      notes: formData.get('notes') as string || null,
      specialties: specialties.length > 0 ? specialties : null,
    }

    const { data: contractor, error } = await supabase
      .from('contractors')
      .insert(data)
      .select()
      .single()

    if (error) {
      toast.error('Failed to add contractor')
      setLoading(false)
      return
    }

    toast.success('Contractor added')
    router.push(`/contractors/${contractor.id}`)
  }

  return (
    <div>
      <Header title="Add Contractor" description="Add a new contractor to your directory" />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="role">Role/Title</Label>
                <Input id="role" name="role" placeholder="Event Producer" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="(555) 555-5555" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="Los Angeles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" placeholder="CA" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  placeholder="Type and press Enter to add"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyDown={handleAddSpecialty}
                />
                {specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(specialty)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rates & Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input id="hourly_rate" name="hourly_rate" type="number" step="0.01" placeholder="75.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day_rate">Day Rate ($)</Label>
                  <Input id="day_rate" name="day_rate" type="number" step="0.01" placeholder="600.00" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Documentation Status</Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="w9_on_file" name="w9_on_file" />
                  <Label htmlFor="w9_on_file" className="font-normal">W-9 on file</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="insurance_on_file" name="insurance_on_file" />
                  <Label htmlFor="insurance_on_file" className="font-normal">Insurance on file</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="nda_signed" name="nda_signed" />
                  <Label htmlFor="nda_signed" className="font-normal">NDA signed</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Notes about this contractor..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Contractor'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
