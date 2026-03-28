import { useCallback, useEffect, useMemo, useState } from 'react'

export type CartLine = {
  readonly productId: string
  readonly name: string
  readonly priceVnd: number
  readonly quantity: number
  readonly imageUrl: string
}

const STORAGE_KEY = 'ecommerce_cart_v1'

function readCartFromStorage(): CartLine[] {
  try {
    const raw: string | null = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isCartLine)
  } catch {
    return []
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const row = value as Record<string, unknown>
  return (
    typeof row.productId === 'string' &&
    typeof row.name === 'string' &&
    typeof row.priceVnd === 'number' &&
    typeof row.quantity === 'number' &&
    typeof row.imageUrl === 'string'
  )
}

export function useLocalCart(): {
  readonly lines: readonly CartLine[]
  readonly totalItemCount: number
  readonly subtotalVnd: number
  addProduct: (input: {
    readonly productId: string
    readonly name: string
    readonly priceVnd: number
    readonly imageUrl: string
  }) => void
  setQuantity: (productId: string, quantity: number) => void
  removeLine: (productId: string) => void
  clearCart: () => void
} {
  const [lines, setLines] = useState<CartLine[]>(() => readCartFromStorage())
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])
  const addProduct = useCallback(
    (input: {
      readonly productId: string
      readonly name: string
      readonly priceVnd: number
      readonly imageUrl: string
    }): void => {
      setLines((prev) => {
        const existing: CartLine | undefined = prev.find(
          (line) => line.productId === input.productId,
        )
        if (existing) {
          return prev.map((line) =>
            line.productId === input.productId
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        }
        return [
          ...prev,
          {
            productId: input.productId,
            name: input.name,
            priceVnd: input.priceVnd,
            quantity: 1,
            imageUrl: input.imageUrl,
          },
        ]
      })
    },
    [],
  )
  const setQuantity = useCallback((productId: string, quantity: number): void => {
    const q: number = Math.max(0, Math.floor(quantity))
    setLines((prev) => {
      if (q === 0) {
        return prev.filter((line) => line.productId !== productId)
      }
      return prev.map((line) =>
        line.productId === productId ? { ...line, quantity: q } : line,
      )
    })
  }, [])
  const removeLine = useCallback((productId: string): void => {
    setLines((prev) => prev.filter((line) => line.productId !== productId))
  }, [])
  const clearCart = useCallback((): void => {
    setLines([])
  }, [])
  const totalItemCount: number = useMemo(
    () => lines.reduce((s, line) => s + line.quantity, 0),
    [lines],
  )
  const subtotalVnd: number = useMemo(
    () =>
      lines.reduce((s, line) => s + line.priceVnd * line.quantity, 0),
    [lines],
  )
  return {
    lines,
    totalItemCount,
    subtotalVnd,
    addProduct,
    setQuantity,
    removeLine,
    clearCart,
  }
}
