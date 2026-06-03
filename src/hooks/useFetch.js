import { useCallback, useState } from 'react'

export function useFetch() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async (promise) => {
    setLoading(true)
    setError(null)
    try {
      const response = await promise
      setData(response.data)
      return response.data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, run }
}
