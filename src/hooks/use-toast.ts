'use client'
import { useState, useCallback, useEffect } from 'react'

export interface Toast {
  id: string
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let memoryToasts: Toast[] = []

function updateToasts(toasts: Toast[]) {
  memoryToasts = toasts
  toastListeners.forEach((listener) => listener(toasts))
}

export function toast(message: string, variant: Toast['variant'] = 'info') {
  const id = Math.random().toString(36).slice(2, 9)
  const newToast: Toast = { id, message, variant }
  updateToasts([...memoryToasts, newToast])

  setTimeout(() => {
    updateToasts(memoryToasts.filter((t) => t.id !== id))
  }, 4000)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts)

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    updateToasts(memoryToasts.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
