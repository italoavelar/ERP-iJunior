import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
  /** Substitui os dados em memória — usado após uma mutação que já devolveu o registro. */
  set: (updater: (current: T) => T) => void
}

/** Carrega uma vez ao montar e expõe recarga manual. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    run()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [run, nonce])

  const set = useCallback((updater: (current: T) => T) => {
    setData((d) => (d === null ? d : updater(d)))
  }, [])

  return { data, loading, error, reload: () => setNonce((n) => n + 1), set }
}
