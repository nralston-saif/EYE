import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const EVENT_TYPE_MAP: Record<string, string> = {
  sko: 'SKO',
  vip_dinner: 'VIP Dinner',
  'av/production': 'AV/Production',
  av_production: 'AV/Production',
}

export function formatEventType(type: string | null): string {
  if (!type) return ''
  const lower = type.toLowerCase()
  if (EVENT_TYPE_MAP[lower]) return EVENT_TYPE_MAP[lower]
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function formatStatus(status: string | null): string {
  if (!status) return ''
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
