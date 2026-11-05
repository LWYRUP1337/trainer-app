import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { errorMessage } from './errors'

interface QueryResult<T> {
  key?: string
  data?: T
  error?: string
}

export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]) {
  const [result, setResult] = useState<QueryResult<T>>({})
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  const requestKey = `${JSON.stringify(deps)}#${nonce}`

  useLayoutEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    fetcherRef.current()
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data })
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key: requestKey, error: errorMessage(error) })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const loading = result.key !== requestKey
  const refetch = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback((data: T) => setResult((prev) => ({ key: prev.key, data })), [])

  return { data: result.data, error: loading ? undefined : result.error, loading, refetch, setData }
}
