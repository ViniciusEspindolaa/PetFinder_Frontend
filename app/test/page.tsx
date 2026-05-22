'use client'

export default function TestPage() {
  const [data, setData] = React.useState<any>(null)
  const [error, setError] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function test() {
      try {
        console.log('Fetching from http://localhost:3001/api/publicacoes')
        const res = await fetch('http://localhost:3001/api/publicacoes')
        console.log('Response status:', res.status)
        const json = await res.json()
        console.log('Data:', json)
        setData(json)
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    test()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  
  return (
    <div>
      <h1>API Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

import React from 'react'
