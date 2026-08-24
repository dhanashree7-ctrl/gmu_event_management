import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config/api';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function EventChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi there! I am the GMU Event Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chat_assistant.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting right now.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'An error occurred while reaching the server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={styles.container} className="chatbot-container">
      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            <div style={styles.headerInfo}>
              <span style={styles.headerAvatar}></span>
              <span style={styles.headerTitle}>GMU Assistant</span>
            </div>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div style={styles.messagesContainer}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={s(styles.messageWrapper, msg.role === 'user' ? styles.wrapperUser : styles.wrapperAi)}
              >
                <div style={s(styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi)}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={s(styles.messageWrapper, styles.wrapperAi)}>
                <div style={s(styles.bubble, styles.bubbleAi, styles.typingBubble)}>
                  <span className="dot" style={styles.dot}>.</span>
                  <span className="dot" style={styles.dot}>.</span>
                  <span className="dot" style={styles.dot}>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={styles.inputArea}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events..."
              style={styles.input}
            />
            <button 
              type="submit" 
              style={s(styles.sendBtn, !input.trim() && styles.sendBtnDisabled)} 
              disabled={!input.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        style={styles.fab} 
        onClick={() => setIsOpen(!isOpen)}
        title="Ask Assistant"
        className="chatbot-fab-pulse"
      >
        {isOpen ? (
          <span style={{ fontSize: '24px' }}></span>
        ) : (
          <>
            <span style={{ fontSize: '28px', marginRight: '8px' }}></span>
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Ask AI</span>
          </>
        )}
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontFamily: theme.fonts.sansSerif,
  },
  fab: {
    height: '64px',
    padding: '0 24px',
    borderRadius: '32px',
    background: theme.colors.maroon,
    color: theme.colors.gold,
    border: `2px solid ${theme.colors.gold}`,
    boxShadow: '0 6px 20px rgba(121, 23, 22, 0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  chatWindow: {
    width: '350px',
    height: '500px',
    maxHeight: '80vh',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid rgba(0,0,0,0.05)`,
  },
  header: {
    background: theme.colors.maroon,
    color: '#fff',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerAvatar: {
    fontSize: '24px',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    background: '#f9f9fa',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperAi: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '18px',
    fontSize: '0.95rem',
    lineHeight: 1.4,
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  bubbleUser: {
    background: theme.colors.maroon,
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  bubbleAi: {
    background: '#e9ecef',
    color: '#333',
    borderBottomLeftRadius: '4px',
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '40px',
    padding: '0 16px',
  },
  dot: {
    fontSize: '18px',
    animation: 'blink 1.4s infinite both',
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    background: '#fff',
    borderTop: '1px solid #eee',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '24px',
    border: '1px solid #ddd',
    outline: 'none',
    fontSize: '0.95rem',
    background: '#f9f9fa',
  },
  sendBtn: {
    background: theme.colors.maroon,
    color: '#fff',
    border: 'none',
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(121,23,22,0.3)',
  },
  sendBtnDisabled: {
    background: '#e0e0e0',
    color: '#a0a0a0',
    cursor: 'not-allowed',
    boxShadow: 'none',
  }
};
