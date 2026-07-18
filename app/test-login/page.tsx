'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestLoginPage() {
  const router = useRouter()

  useEffect(() => {
    const createTestSession = async () => {
      try {
        // Вызываем API эндпоинт для создания сессии
        const response = await fetch('/api/auth/test-login')
        if (response.ok) {
          // Редирект на trainer
          router.push('/trainer')
        }
      } catch (error) {
        console.error('Test login failed:', error)
        router.push('/trainer')
      }
    }

    createTestSession()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F1419]">
      <div className="text-white text-center">
        <h1 className="text-3xl font-bold mb-4">🔐 Вход для тестирования</h1>
        <p>Добро пожаловать, тестовый пользователь!</p>
        <p className="text-sm text-gray-400 mt-4">Редирект на /trainer...</p>
      </div>
    </div>
  )
}
