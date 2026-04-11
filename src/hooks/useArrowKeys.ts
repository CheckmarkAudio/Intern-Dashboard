import { useCallback } from 'react'

export function useArrowKeys(
  itemRefs: React.RefObject<(HTMLElement | null)[]>,
  options: { orientation?: 'horizontal' | 'vertical' | 'both'; loop?: boolean } = {}
) {
  const { orientation = 'horizontal', loop = true } = options

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = itemRefs.current
    if (!items) return

    const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
    const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
    const allKeys = orientation === 'both'
      ? ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      : [prev, next]

    if (!allKeys.includes(e.key)) return
    e.preventDefault()

    const currentIndex = items.findIndex(el => el === document.activeElement)
    if (currentIndex === -1) return

    const isPrev = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    let nextIndex = isPrev ? currentIndex - 1 : currentIndex + 1

    if (loop) {
      nextIndex = (nextIndex + items.length) % items.length
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex))
    }

    items[nextIndex]?.focus()
  }, [itemRefs, orientation, loop])

  return onKeyDown
}
