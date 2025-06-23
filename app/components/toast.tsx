import { useEffect, useState } from 'react'

interface ToastMessage {
  id: string
  type: 'success' | 'error'
  message: string
  duration?: number
}

interface ToastStore {
  messages: ToastMessage[]
  addMessage: (message: Omit<ToastMessage, 'id'>) => void
  removeMessage: (id: string) => void
}

let toastStore: ToastStore = {
  messages: [],
  addMessage: () => {},
  removeMessage: () => {},
}

const listeners = new Set<() => void>()

export const toast = {
  success: (message: string, duration = 5000) => {
    toastStore.addMessage({ type: 'success', message, duration })
  },
  error: (message: string, duration = 5000) => {
    toastStore.addMessage({ type: 'error', message, duration })
  },
}

export function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = () => setMessages([...toastStore.messages])
    listeners.add(listener)

    toastStore.addMessage = (message) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newMessage = { ...message, id }
      toastStore.messages.push(newMessage)
      listeners.forEach((l) => l())

      if (message.duration) {
        setTimeout(() => {
          toastStore.removeMessage(id)
        }, message.duration)
      }
    }

    toastStore.removeMessage = (id) => {
      toastStore.messages = toastStore.messages.filter((m) => m.id !== id)
      listeners.forEach((l) => l())
    }

    return () => {
      listeners.delete(listener)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-sm w-full p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
            message.type === 'success'
              ? 'bg-green-800 border border-green-600 text-green-100'
              : 'bg-red-800 border border-red-600 text-red-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">{message.message}</span>
            </div>
            <button
              onClick={() => toastStore.removeMessage(message.id)}
              className="ml-2 text-zinc-400 hover:text-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
