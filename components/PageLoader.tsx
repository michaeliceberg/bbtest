// components/PageLoader.tsx
'use client'
import React from 'react'

import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'

export const PageLoader = ({ isLoading }: { isLoading: boolean }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // На сервере и во время гидрации ничего не рендерим
  if (!isMounted || !isLoading) return null
  
  return (
    <div className="page-loader">
      <Loader className="h-6 w-6 text-muted-foreground animate-spin" />
    </div>
  )
}