class ChatApp {
  constructor() {
    this.apiURL = '/api/chat';
    
    this.chatSessions = new Map();
    this.currentSessionId = null;
    this.isTyping = false;
    
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadSessions();
    this.createNewSession();
    this.updateInputState();
  }

  bindElements() {
    // Main elements
    this.chatContainer = document.getElementById('chat-container');
    this.chatWrapper = document.getElementById('chat-wrapper');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message-input');
    this.sendBtn = document.getElementById('send-btn');
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.currentChatTitle = document.getElementById('current-chat-title');
    
    // Sidebar elements
    this.sidebar = document.getElementById('sidebar');
    this.chatList = document.getElementById('chat-list');
    this.newChatBtn = document.getElementById('new-chat-btn');
    this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    this.mobileOverlay = document.getElementById('mobile-overlay');
    this.sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    
    // Header actions
    this.renameChatBtn = document.getElementById('rename-chat-btn');
    this.deleteChatBtn = document.getElementById('delete-chat-btn');
    
    // Modal elements
    this.renameModal = document.getElementById('rename-modal');
    this.renameInput = document.getElementById('rename-input');
    this.cancelRename = document.getElementById('cancel-rename');
    this.confirmRename = document.getElementById('confirm-rename');
  }

  bindEvents() {
    // Message form
    this.messageForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.messageInput.addEventListener('input', () => this.handleInputChange());
    this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Sidebar
    this.newChatBtn.addEventListener('click', () => this.createNewSession());
    this.mobileMenuToggle.addEventListener('click', () => this.toggleSidebar());
    this.mobileOverlay.addEventListener('click', () => this.closeSidebar());
    this.sidebarCloseBtn.addEventListener('click', () => this.closeSidebar());
    
    // Header actions
    this.renameChatBtn.addEventListener('click', () => this.openRenameModal());
    this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentSession());
    
    // Modal
    this.cancelRename.addEventListener('click', () => this.closeRenameModal());
    this.confirmRename.addEventListener('click', () => this.confirmRenameSession());
    this.renameModal.addEventListener('click', (e) => {
      if (e.target === this.renameModal) this.closeRenameModal();
    });
    
    // Suggestion cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.suggestion-card');
      if (card) {
        const prompt = card.dataset.prompt;
        this.messageInput.value = prompt;
        this.sendMessage();
      }
    });
    
    // Auto-close sidebar when clicking on chat content (mobile)
    this.chatWrapper.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        this.closeSidebar();
      }
    });
    
    this.messageForm.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        this.closeSidebar();
      }
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeSidebar();
      }
    });
  }

  // Session Management
  createNewSession() {
    const sessionId = Date.now().toString();
    const session = {
      id: sessionId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.chatSessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    
    this.clearChat();
    this.showWelcomeScreen();
    this.updateChatList();
    this.updateChatTitle('New Chat');
    this.saveSessions();
    this.closeSidebar();
  }

  switchToSession(sessionId) {
    if (!this.chatSessions.has(sessionId)) return;
    
    this.currentSessionId = sessionId;
    const session = this.chatSessions.get(sessionId);
    
    this.clearChat();
    
    if (session.messages.length === 0) {
      this.showWelcomeScreen();
    } else {
      this.hideWelcomeScreen();
      session.messages.forEach(msg => {
        this.addMessageToUI(msg.role, msg.content, false);
      });
    }
    
    this.updateChatTitle(session.title);
    this.updateChatList();
    this.closeSidebar();
  }

  deleteSession(sessionId) {
    if (!this.chatSessions.has(sessionId)) return;
    
    this.chatSessions.delete(sessionId);
    
    if (this.currentSessionId === sessionId) {
      if (this.chatSessions.size === 0) {
        this.createNewSession();
      } else {
        const firstSession = this.chatSessions.keys().next().value;
        this.switchToSession(firstSession);
      }
    }
    
    this.updateChatList();
    this.saveSessions();
  }

  deleteCurrentSession() {
    if (this.currentSessionId && this.chatSessions.size > 1) {
      this.deleteSession(this.currentSessionId);
    } else {
      this.createNewSession();
    }
  }

  renameSession(sessionId, newTitle) {
    if (!this.chatSessions.has(sessionId)) return;
    
    const session = this.chatSessions.get(sessionId);
    session.title = newTitle;
    session.updatedAt = new Date();
    
    if (sessionId === this.currentSessionId) {
      this.updateChatTitle(newTitle);
    }
    
    this.updateChatList();
    this.saveSessions();
  }

  // UI Updates
  updateChatList() {
    this.chatList.innerHTML = '';
    
    const sessions = Array.from(this.chatSessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    sessions.forEach(session => {
      const chatItem = this.createChatItem(session);
      this.chatList.appendChild(chatItem);
    });
  }

  createChatItem(session) {
    const item = document.createElement('div');
    item.className = `chat-item ${session.id === this.currentSessionId ? 'active' : ''}`;
    item.dataset.sessionId = session.id;
    
    item.innerHTML = `
      <div class="chat-item-content">
        <div class="chat-item-title">${this.escapeHtml(session.title)}</div>
        <div class="chat-item-time">${this.formatTime(session.updatedAt)}</div>
      </div>
      <div class="chat-item-actions">
        <button class="chat-action-btn rename" title="Rename">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
        </button>
        <button class="chat-action-btn delete" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    `;
    
    // Event listeners
    const content = item.querySelector('.chat-item-content');
    const renameBtn = item.querySelector('.rename');
    const deleteBtn = item.querySelector('.delete');
    
    content.addEventListener('click', () => this.switchToSession(session.id));
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openRenameModal(session.id);
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteSession(session.id);
    });
    
    return item;
  }

  updateChatTitle(title) {
    this.currentChatTitle.textContent = title;
  }

  // Message Handling
  async handleSubmit(e) {
    e.preventDefault();
    await this.sendMessage();
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isTyping) return;
    
    const session = this.chatSessions.get(this.currentSessionId);
    if (!session) return;
    
    // Hide welcome screen on first message
    if (session.messages.length === 0) {
      this.hideWelcomeScreen();
      // Auto-generate title from first message
      const title = this.generateTitle(message);
      this.renameSession(this.currentSessionId, title);
    }
    
    // Add user message
    this.addMessageToSession(session, 'user', message);
    this.addMessageToUI('user', message);
    
    // Clear input and show typing
    this.messageInput.value = '';
    this.updateInputState();
    this.showTypingIndicator();
    
    try {
      const response = await this.getAIResponse(session.messages);
      this.hideTypingIndicator();
      
      // Add assistant message
      this.addMessageToSession(session, 'assistant', response);
      this.addMessageToUI('assistant', response);
      
    } catch (error) {
      this.hideTypingIndicator();
      const errorMsg = `Sorry, something went wrong: ${error.message}`;
      this.addMessageToSession(session, 'assistant', errorMsg);
      this.addMessageToUI('assistant', errorMsg);
    }
    
    this.messageInput.focus();
  }

  addMessageToSession(session, role, content) {
    session.messages.push({ role, content, timestamp: new Date() });
    session.updatedAt = new Date();
    this.saveSessions();
  }

  addMessageToUI(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (animate) messageDiv.style.opacity = '0';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (role === 'user') {
      avatar.textContent = 'GM';
    } else {
      avatar.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      `;
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    const text = document.createElement('div');
    text.className = 'message-text';
    
    if (role === 'assistant') {
      text.innerHTML = this.parseMarkdown(content);
    } else {
      text.textContent = content;
    }
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = this.formatTime(new Date());
    
    bubble.appendChild(text);
    bubble.appendChild(time);
    messageContent.appendChild(bubble);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    this.chatContainer.appendChild(messageDiv);
    
    if (animate) {
      requestAnimationFrame(() => {
        messageDiv.style.opacity = '1';
      });
    }
    
    this.scrollToBottom();
  }

  showTypingIndicator() {
    this.isTyping = true;
    this.updateInputState();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-message';
    typingDiv.innerHTML = `
      <div class="message-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    this.chatContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    this.updateInputState();
    
    const typingMessage = this.chatContainer.querySelector('.typing-message');
    if (typingMessage) {
      typingMessage.remove();
    }
  }

  // API Communication
  async getAIResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    
    const response = await fetch(this.apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: lastMessage.content
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success) {
      return data.response;
    } else {
      throw new Error(data.error || 'No response received.');
    }
  }

  // UI State Management
  handleInputChange() {
    this.autoResize();
    this.updateInputState();
  }

  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  autoResize() {
    this.messageInput.style.height = 'auto';
    const maxHeight = 120; // 8rem
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, maxHeight) + 'px';
  }

  updateInputState() {
    const hasText = this.messageInput.value.trim().length > 0;
    this.sendBtn.disabled = !hasText || this.isTyping;
  }

  clearChat() {
    this.chatContainer.innerHTML = '';
  }

  showWelcomeScreen() {
    this.welcomeScreen.style.display = 'flex';
    this.chatContainer.appendChild(this.welcomeScreen);
  }

  hideWelcomeScreen() {
    this.welcomeScreen.style.display = 'none';
  }

  scrollToBottom() {
    this.chatWrapper.scrollTo({
      top: this.chatWrapper.scrollHeight,
      behavior: 'smooth'
    });
  }

  // Sidebar Management
  toggleSidebar() {
    this.sidebar.classList.toggle('open');
    this.mobileOverlay.classList.toggle('active');
  }

  closeSidebar() {
    this.sidebar.classList.remove('open');
    this.mobileOverlay.classList.remove('active');
  }

  // Modal Management
  openRenameModal(sessionId = null) {
    const targetSessionId = sessionId || this.currentSessionId;
    const session = this.chatSessions.get(targetSessionId);
    if (!session) return;
    
    this.renameInput.value = session.title;
    this.renameInput.dataset.sessionId = targetSessionId;
    this.renameModal.classList.add('active');
    this.renameInput.focus();
    this.renameInput.select();
  }

  closeRenameModal() {
    this.renameModal.classList.remove('active');
    this.renameInput.value = '';
    delete this.renameInput.dataset.sessionId;
  }

  confirmRenameSession() {
    const sessionId = this.renameInput.dataset.sessionId;
    const newTitle = this.renameInput.value.trim();
    
    if (sessionId && newTitle) {
      this.renameSession(sessionId, newTitle);
    }
    
    this.closeRenameModal();
  }

  // Persistence
  saveSessions() {
    try {
      const sessionsData = Array.from(this.chatSessions.entries()).map(([id, session]) => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }));
      localStorage.setItem('gm-ai-sessions', JSON.stringify(sessionsData));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  loadSessions() {
    try {
      const saved = localStorage.getItem('gm-ai-sessions');
      if (saved) {
        const sessionsData = JSON.parse(saved);
        sessionsData.forEach(session => {
          session.createdAt = new Date(session.createdAt);
          session.updatedAt = new Date(session.updatedAt);
          this.chatSessions.set(session.id, session);
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  // Utility Functions
  generateTitle(message) {
    const words = message.split(' ').slice(0, 6).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  parseMarkdown(text) {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});