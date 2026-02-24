'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCallback, useTransition } from 'react'

export function EventFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`/events?${params.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )

  return (
    <div className="flex flex-wrap gap-4">
      <Input
        placeholder="Search events..."
        defaultValue={searchParams.get('search') || ''}
        className="max-w-xs"
        onChange={(e) => {
          const value = e.target.value
          // Debounce search input
          const timeout = setTimeout(() => updateParams('search', value), 300)
          return () => clearTimeout(timeout)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateParams('search', (e.target as HTMLInputElement).value)
          }
        }}
      />
      <Select
        defaultValue={searchParams.get('status') || 'all'}
        onValueChange={(value) => updateParams('status', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="planning">Planning</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="on_hold">On Hold</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('type') || 'all'}
        onValueChange={(value) => updateParams('type', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="sko">SKO</SelectItem>
          <SelectItem value="summit">Summit</SelectItem>
          <SelectItem value="incentive">Incentive</SelectItem>
          <SelectItem value="vip_dinner">VIP Dinner</SelectItem>
          <SelectItem value="conference">Conference</SelectItem>
          <SelectItem value="workshop">Workshop</SelectItem>
          <SelectItem value="retreat">Retreat</SelectItem>
          <SelectItem value="product_launch">Product Launch</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
