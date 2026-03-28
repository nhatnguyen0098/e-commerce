import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const id: ReturnType<typeof setTimeout> = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return (): void => {
      clearTimeout(id)
    }
  }, [value, delayMs])
  return debounced
}
