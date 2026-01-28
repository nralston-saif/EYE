'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [supabase])

  const handlePasswordReset = async () => {
    if (!user?.email) return

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    if (error) {
      toast.error('Failed to send reset email')
      return
    }

    toast.success('Password reset email sent')
  }

  if (loading) {
    return (
      <div>
        <Header title="Settings" description="Manage your account settings" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <Header title="Settings" description="Manage your account settings" />

      <div className="grid gap-6 max-w-2xl">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <Button variant="outline" onClick={handlePasswordReset}>
              Reset Password
            </Button>
          </CardContent>
        </Card>

        {/* Microsoft 365 Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Microsoft 365 Calendar
            </CardTitle>
            <CardDescription>
              Connect to sync meetings with Outlook Calendar and Teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">To enable Microsoft 365 integration:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Go to Azure Portal and create an App Registration</li>
                <li>Add redirect URI: <code className="bg-muted px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/auth/microsoft/callback</code></li>
                <li>Grant API permissions: <code className="bg-muted px-1 rounded">Calendars.ReadWrite</code>, <code className="bg-muted px-1 rounded">OnlineMeetings.ReadWrite</code></li>
                <li>Create a client secret</li>
                <li>Add the credentials below</li>
              </ol>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                <Input id="client_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input id="client_secret" type="password" placeholder="Your client secret" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant_id">Tenant ID</Label>
                <Input id="tenant_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" disabled />
              </div>
              <Button disabled>
                Connect Microsoft 365
              </Button>
              <p className="text-xs text-muted-foreground">
                Microsoft 365 integration will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>Manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your data as JSON
                </p>
              </div>
              <Button variant="outline" disabled>
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
