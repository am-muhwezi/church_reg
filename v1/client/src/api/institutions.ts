import { useEffect, useState } from 'react'
import { get } from './client'
import type { AttendanceDetail, Institution, InstitutionTally } from './types'

let cache: Promise<Institution[]> | null = null

/** Full list, fetched once per page load. */
export function getInstitutions(): Promise<Institution[]> {
  if (!cache) {
    cache = get<Institution[]>('/institutions').catch((e) => {
      cache = null // allow retry on next mount
      throw e
    })
  }
  return cache
}

export function useInstitutions(): Institution[] {
  const [list, setList] = useState<Institution[]>([])
  useEffect(() => {
    let live = true
    getInstitutions().then((l) => live && setList(l)).catch(() => {})
    return () => { live = false }
  }, [])
  return list
}

export function getInstitutionTally(serviceDate?: string): Promise<InstitutionTally> {
  return get<InstitutionTally>('/admin/institution-tally', serviceDate ? { service_date: serviceDate } : undefined)
}

/** Rank suggestions: code/name prefix first, then word prefix, then substring. Every typed word must match. */
export function filterInstitutions(list: Institution[], query: string, limit = 8): Institution[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const scored: [number, Institution][] = []
  for (const inst of list) {
    const name = inst.name.toLowerCase()
    const code = inst.code.toLowerCase()
    if (!words.every((w) => name.includes(w))) continue
    const q = words.join(' ')
    const score = code === q ? 0 : code.startsWith(q) ? 1 : name.startsWith(q) ? 2 : name.split(/[\s(–-]+/).some((t) => t.startsWith(words[0])) ? 3 : 4
    scored.push([score, inst])
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name))
  return scored.slice(0, limit).map(([, i]) => i)
}

export const OTHERS = 'OTHERS'

/** Student check-ins grouped by the server-assigned institution_code. OTHERS always last. */
export function tallyByInstitution(details: AttendanceDetail[]): { code: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const d of details) {
    if (!d.student) continue
    const code = d.institution_code || OTHERS
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => Number(a.code === OTHERS) - Number(b.code === OTHERS) || b.count - a.count || a.code.localeCompare(b.code))
}
