import { useEffect, useRef, useState, type RefObject } from 'react'

type UseDeferredMountOptions = {
  /** Also mount after idle so the first above-the-fold block is not stuck waiting. */
  eager?: boolean
  rootMargin?: string
}

/**
 * Delays mounting heavy UI until near the viewport (or after idle when eager).
 * Without IntersectionObserver (e.g. some test envs), mounts on the next frame.
 */
export function useDeferredMount({
  eager = false,
  rootMargin = '240px 0px',
}: UseDeferredMountOptions = {}): {
  ref: RefObject<HTMLDivElement | null>
  shouldMount: boolean
} {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    if (shouldMount) {
      return
    }

    const node = ref.current
    if (!node) {
      return
    }

    const mount = (): void => {
      setShouldMount(true)
    }

    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(mount)
      return () => {
        cancelAnimationFrame(frame)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          mount()
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(node)

    if (eager) {
      const idle = window.setTimeout(() => {
        mount()
        observer.disconnect()
      }, 0)

      return () => {
        observer.disconnect()
        window.clearTimeout(idle)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [eager, rootMargin, shouldMount])

  return { ref, shouldMount }
}
