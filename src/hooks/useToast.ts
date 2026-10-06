import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastState {
  title: string
  body: string
  tone: string
}

export function useToast(timeoutMs = 3000) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback(
    (title: string, body: string, tone = 'var(--primary)') => {
      clearTimeout(timer.current)
      setToast({ title, body, tone })
      timer.current = setTimeout(() => setToast(null), timeoutMs)
    },
    [timeoutMs],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  return { toast, show }
}
