import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ecommerce_compare_slugs_v1'

export const MAX_COMPARE_PRODUCTS = 4

function readSlugsFromStorage(): string[] {
  try {
    const raw: string | null = localStorage.getItem(STORAGE_KEY)
    if (raw === null || raw === '') {
      return []
    }
    const parsed: unknown = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    const out: string[] = []
    const seen = new Set<string>()
    for (const item of parsed) {
      if (typeof item !== 'string') {
        continue
      }
      const t: string = item.trim()
      if (t.length === 0 || seen.has(t)) {
        continue
      }
      seen.add(t)
      out.push(t)
      if (out.length >= MAX_COMPARE_PRODUCTS) {
        break
      }
    }
    return out
  } catch {
    return []
  }
}

export function useCompareSlugs(): {
  readonly compareSlugs: readonly string[]
  readonly compareCount: number
  readonly canAddMoreCompare: boolean
  readonly isCompareSlugSelected: (slug: string) => boolean
  readonly toggleCompareSlug: (slug: string) => void
  readonly removeCompareSlug: (slug: string) => void
  readonly clearCompareSlugs: () => void
} {
  const [slugs, setSlugs] = useState<string[]>(() => readSlugsFromStorage())
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  }, [slugs])
  const compareCount: number = slugs.length
  const canAddMoreCompare: boolean = slugs.length < MAX_COMPARE_PRODUCTS
  const slugSet: ReadonlySet<string> = useMemo(() => new Set(slugs), [slugs])
  const isCompareSlugSelected = useCallback(
    (slug: string): boolean => slugSet.has(slug.trim()),
    [slugSet],
  )
  const toggleCompareSlug = useCallback((slug: string): void => {
    const t: string = slug.trim()
    if (t.length === 0) {
      return
    }
    setSlugs((prev: string[]) => {
      const without: string[] = prev.filter((s: string) => s !== t)
      if (without.length < prev.length) {
        return without
      }
      if (prev.length >= MAX_COMPARE_PRODUCTS) {
        return prev
      }
      return [...prev, t]
    })
  }, [])
  const removeCompareSlug = useCallback((slug: string): void => {
    const t: string = slug.trim()
    if (t.length === 0) {
      return
    }
    setSlugs((prev: string[]) => prev.filter((s: string) => s !== t))
  }, [])
  const clearCompareSlugs = useCallback((): void => {
    setSlugs([])
  }, [])
  return {
    compareSlugs: slugs,
    compareCount,
    canAddMoreCompare,
    isCompareSlugSelected,
    toggleCompareSlug,
    removeCompareSlug,
    clearCompareSlugs,
  }
}
