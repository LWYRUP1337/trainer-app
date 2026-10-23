import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from './errors'

interface QueryState<T> {
  data?: T
  error?: string
  loading: boolean
}

export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<QueryState<T>>({ loading: true })
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ data: prev.data, loading: true }))
    fetcherRef.current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ loading: false, error: errorMessage(error) })
      })
    return () => {
      cancelled = true
    }

  }, [...deps, nonce])

  const refetch = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, refetch }
}
