'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import wsService from '../../services/websocketService'

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: Date
  isOwn: boolean
}

interface ChatInterfaceProps {
  rideId: string
  driverName?: string
  userId: string
  userName: string
}

export default function ChatInterface({ rideId, driverName = 'Driver', userId, userName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      senderId: 'system',
      senderName: 'System',
      text: `Chat with ${driverName} for ride #${rideId.slice(-6)}`,
      timestamp: new Date(),
      isOwn: false,
    },
  ])
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const unsub = wsService.on('chat:message', (data) => {
      const msg = data as { senderId: string; senderName: string; text: string; timestamp: string }
      if (msg.senderId === userId) return

      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        isOwn: false,
      }
      setMessages((prev) => [...prev, newMessage])
      if (!isOpen) setUnreadCount((c) => c + 1)
    })

    return () => unsub()
  }, [userId, isOpen])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      inputRef.current?.focus()
    }
  }, [isOpen])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: userName,
      text,
      timestamp: new Date(),
      isOwn: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')

    wsService.send('chat:message', {
      rideId,
      senderId: userId,
      senderName: userName,
      text,
      timestamp: new Date().toISOString(),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div data-testid="chat-interface" className="fixed bottom-6 right-6 z-50">
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Open chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
              {driverName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">{driverName}</p>
              <p className="text-xs text-blue-200">Your driver</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72 min-h-48">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    msg.isOwn
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : msg.senderId === 'system'
                      ? 'bg-gray-100 text-gray-500 text-xs text-center mx-auto'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.senderId !== 'system' && (
                    <p className={`text-xs mt-0.5 ${msg.isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 py-1 flex gap-2 overflow-x-auto">
            {["I'm here", "On my way", "Almost there", "Please wait"].map((reply) => (
              <button
                key={reply}
                onClick={() => setInput(reply)}
                className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              data-testid="chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-9 h-9 bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
