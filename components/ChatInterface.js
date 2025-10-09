'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

function generateTitle(message) {
  const words = message.split(' ').slice(0, 6).join(' ')
  return words.length > 30 ? words.substring(0, 30) + '...' : words || 'New Chat'
}

function formatTime(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

function markdownToHtml(text) {
  if (!text) return ''
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br>')
}

const STORAGE_KEY = 'gm-ai-sessions'

export default function ChatInterface() {
  // Sessions
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Input
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const chatWrapperRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Rename modal
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTargetId, setRenameTargetId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // revive dates
        parsed.forEach(s => {
          s.createdAt = new Date(s.createdAt)
          s.updatedAt = new Date(s.updatedAt)
        })
        setSessions(parsed)
        if (parsed.length) setCurrentSessionId(parsed[0].id)
        else createNewSessionInternal()
      } else {
        createNewSessionInternal()
      }
    } catch {
      createNewSessionInternal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist sessions
  useEffect(() => {
    try {
      const serializable = sessions.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt).toISOString(),
        updatedAt: new Date(s.updatedAt).toISOString(),
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      // ignore
    }
  }, [sessions])

  const currentSession = useMemo(
    () => sessions.find(s => s.id === currentSessionId) || null,
    [sessions, currentSessionId]
  )

  function createNewSessionInternal() {
    const id = Date.now().toString()
    const newSession = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(id)
  }

  function createNewSession() {
    createNewSessionInternal()
    setSidebarOpen(false)
  }

  function switchToSession(id) {
    if (id === currentSessionId) return
    setCurrentSessionId(id)
    setSidebarOpen(false)
  }

  function deleteSession(id) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (id === currentSessionId) {
        setCurrentSessionId(next.length ? next[0].id : null)
      }
      if (!next.length) {
        // recreate one
        setTimeout(() => createNewSessionInternal(), 0)
      }
      return next
    })
  }

  function renameSession(id, title) {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title, updatedAt: new Date() } : s))
    )
  }

  function addMessageToCurrent(role, content) {
    setSessions(prev =>
      prev.map(s =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [
                ...s.messages,
                { role, content, timestamp: new Date().toISOString() },
              ],
              updatedAt: new Date(),
            }
          : s
      )
    )
  }

  async function sendMessage() {
    const text = message.trim()
    if (!text || isTyping || !currentSession) return

    // Welcome screen to chat: set title automatically
    if (currentSession.messages.length === 0) {
      const title = generateTitle(text)
      renameSession(currentSession.id, title)
    }

    // Add user message
    addMessageToCurrent('user', text)
    setMessage('')
    autoResize()

    // Typing indicator
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const reply = data?.success ? data.response : data?.error || 'No response.'
      addMessageToCurrent('assistant', reply)
    } catch (e) {
      addMessageToCurrent('assistant', `Sorry, something went wrong: ${e.message}`)
    } finally {
      setIsTyping(false)
      setTimeout(() => scrollToBottom(), 50)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function autoResize() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 120 // px (8rem)
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }

  useEffect(() => {
    autoResize()
  }, [message])

  function scrollToBottom() {
    const wrap = chatWrapperRef.current
    if (!wrap) return
    wrap.scrollTo({ top: wrap.scrollHeight, behavior: 'smooth' })
  }

  // Rename modal controls
  function openRenameModal(sessionId) {
    const s = sessions.find(x => x.id === (sessionId || currentSessionId))
    if (!s) return
    setRenameTargetId(s.id)
    setRenameValue(s.title)
    setRenameOpen(true)
  }

  function confirmRename() {
    if (renameTargetId && renameValue.trim()) {
      renameSession(renameTargetId, renameValue.trim())
    }
    setRenameOpen(false)
    setRenameTargetId(null)
    setRenameValue('')
  }

  // Derived UI booleans
  const showWelcome = currentSession && currentSession.messages.length === 0

  // Sorted sessions by updatedAt desc
  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      ),
    [sessions]
  )

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div
        id="sidebar"
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span className="logo-text">GM's AI</span>
          </div>

          <button
            id="sidebar-close-btn"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <button
            id="new-chat-btn"
            className="new-chat-btn"
            onClick={createNewSession}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New chat
          </button>
        </div>

        <div className="chat-history">
          <div className="history-section">
            <h3>Recent</h3>
            <div id="chat-list" className="chat-list">
              {sorted.map(s => {
                const active = s.id === currentSessionId
                return (
                  <div
                    key={s.id}
                    className={`chat-item ${active ? 'active' : ''}`}
                    onClick={() => switchToSession(s.id)}
                  >
                    <div className="chat-item-content">
                      <div className="chat-item-title">{s.title}</div>
                      <div className="chat-item-time">
                        {formatTime(s.updatedAt)}
                      </div>
                    </div>
                    <div className="chat-item-actions">
                      <button
                        className="chat-action-btn rename"
                        title="Rename"
                        onClick={e => {
                          e.stopPropagation()
                          openRenameModal(s.id)
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        className="chat-action-btn delete"
                        title="Delete"
                        onClick={e => {
                          e.stopPropagation()
                          deleteSession(s.id)
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">GM</div>
            <div className="user-info">
              <span className="user-name">Guest</span>
              <div className="user-status">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay and toggle */}
      <div
        id="mobile-overlay"
        className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <button
        id="mobile-menu-toggle"
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {/* Main content */}
      <div className="main-content">
        <div className="chat-header">
          <div className="header-content">
            <div className="chat-title">
              <h1 id="current-chat-title">
                {currentSession ? currentSession.title : 'New Chat'}
              </h1>
              <div className="model-info">LongCat-Flash-Chat</div>
            </div>

            <div className="header-actions">
              <button
                id="rename-chat-btn"
                className="header-btn"
                onClick={() => openRenameModal()}
                title="Rename chat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
              <button
                id="delete-chat-btn"
                className="header-btn"
                onClick={() =>
                  currentSession && deleteSession(currentSession.id)
                }
                title="Delete chat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div id="chat-wrapper" className="chat-wrapper" ref={chatWrapperRef}>
          <div id="chat-container" className="chat-container" ref={chatContainerRef}>
            {/* Welcome Screen */}
            {showWelcome && (
              <div id="welcome-screen" className="welcome-screen">
                <div className="welcome-content">
                  <div className="welcome-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h2>Welcome to GM's AI</h2>
                  <p>I'm your AI assistant, created by GM. How can I help you today?</p>

                  <div className="suggestion-cards">
                    {[
                      { icon: '💡', text: 'Explain a complex topic simply', prompt: 'Explain quantum computing in simple terms.' },
                      { icon: '🧪', text: 'Help me debug code', prompt: 'I have a bug in my React app where...' },
                      { icon: '✍️', text: 'Draft a message', prompt: 'Write a professional email to...' },
                      { icon: '📚', text: 'Learn something new', prompt: 'Teach me about time complexity with examples.' },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="suggestion-card"
                        onClick={() => setMessage(c.prompt)}
                      >
                        <div className="card-icon">{c.icon}</div>
                        <h4>{c.text}</h4>
                        <p>{c.prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {currentSession &&
              currentSession.messages.map((m, idx) => (
                <div key={idx} className={`message ${m.role}`}>
                  <div className="message-avatar">
                    {m.role === 'user' ? (
                      'GM'
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <div
                        className="message-text"
                        dangerouslySetInnerHTML={{
                          __html:
                            m.role === 'assistant'
                              ? markdownToHtml(m.content)
                              : m.content,
                        }}
                      />
                      <div className="message-time">
                        {formatTime(m.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="typing-message">
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-container">
            <form
              id="message-form"
              className="message-form"
              onSubmit={e => {
                e.preventDefault()
                sendMessage()
              }}
              onClick={() => {
                if (window.innerWidth <= 768) setSidebarOpen(false)
              }}
            >
              <div className="input-wrapper">
                <textarea
                  id="message-input"
                  ref={inputRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message GM's AI..."
                  rows={1}
                />
                <button
                  id="send-btn"
                  type="submit"
                  className="send-btn"
                  disabled={!message.trim() || isTyping}
                  title="Send message"
                >
                  <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </form>
            <div className="input-footer">
              <div className="disclaimer">GM's AI may produce inaccurate information.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <div className={`modal ${renameOpen ? 'active' : ''}`} id="rename-modal" onClick={e => {
        if (e.target === e.currentTarget) setRenameOpen(false)
      }}>
        <div className="modal-content">
          <h3>Rename chat</h3>
          <input
            id="rename-input"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            placeholder="Enter a new title"
          />
          <div className="modal-actions">
            <button id="cancel-rename" className="btn-secondary" onClick={() => setRenameOpen(false)}>
              Cancel
            </button>
            <button id="confirm-rename" className="btn-primary" onClick={confirmRename}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}