"use client"

import { useState, useEffect } from "react"
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { log } from '@/lib/utils/Logger'

interface UseSuiNSResult {
  name: string
  loading: boolean
  error: string | null
}

export const useSuiNS = (address?: string): UseSuiNSResult => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setName('')
      setLoading(false)
      setError(null)
      return
    }

    const resolveAddress = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const client = new SuiClient({
          url: getFullnodeUrl('mainnet'), // SuiNS is on mainnet
        })
        
        const { data } = await client.resolveNameServiceNames({
          address
        })
        
        setName(data?.[0] || '')
      } catch (err) {
        log.error('Failed to resolve SuiNS name', { error: err }, 'useSuiNS')
        setError('Failed to resolve SuiNS name')
        setName('')
      } finally {
        setLoading(false)
      }
    }

    resolveAddress()
  }, [address])

  return {
    name,
    loading,
    error
  }
}