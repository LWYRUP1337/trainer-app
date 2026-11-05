import { useState } from 'react'
import { errorMessage } from './errors'

export function useAction<A extends unknown[]>(
  action: (...args: A) => Promise<void>,
  handleError?: (error: unknown) => boolean,
) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  const run = async (...args: A) => {
    setPending(true)
    setError(undefined)
    try {
      await action(...args)
    } catch (e) {
      if (!handleError?.(e)) setError(errorMessage(e))
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error, clearError: () => setError(undefined) }
}
