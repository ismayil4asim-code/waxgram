'use client'

import { useEffect, useState } from 'react'
import { MaintenancePage } from '@/components/MaintenancePage'

export default function Maintenance() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    setMessage(urlParams.get('message') || '')
  }, [])

  return <MaintenancePage message={message} />
}
