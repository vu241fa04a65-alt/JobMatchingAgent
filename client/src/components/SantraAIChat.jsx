import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, User, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SantraAIChat() {
  const { user, isStudent, isTP, isHOD } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I'm SantraAI, your JobMatch AI placement intelligence assistant.\n\nKey points:\n• Ask me about your match scores and Agent 50 insights.\n• Explore skill gap remediation and interview schedules.\n• Get real-time answers grounded strictly in JobMatch AI.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Dynamic role-aware prompt suggestions
  const studentSuggestions = [
    "What is my top matched opportunity and why?",
    "What skills am I missing for Google SWE?",
    "When is my next scheduled interview?",
    "How can I improve my placement readiness?"
  ];

  const tpSuggestions = [
    "Who are the top candidates for Google SWE?",
    "Which students are currently unmatched?",
    "What are the most common institutional skill gaps?",
    "What is our current average compensation package?"
  ];

  const hodSuggestions = [
    "How is the CSE department performing?",
    "What are the major skill gaps in our department?",
    "What are our highest and average packages?",
    "Which companies have active campus drives?"
  ];

  const suggestions = isStudent ? studentSuggestions : isHOD ? hodSuggestions : isTP ? tpSuggestions : studentSuggestions;

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isThinking) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);

    try {
      const token = localStorage.getItem('jobmatch_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/santra-ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6)
        })
      });

      const data = await res.json();
      let botReply = data.reply || "I don't have that information in JobMatch AI.";

      // Ensure direct bulleted output without summary prefix tags
      botReply = botReply
        .replace(/^(\s*#*\s*TL[;:]?DR\s*:?\s*)+/gi, '')
        .replace(/(\n\s*#*\s*TL[;:]?DR\s*:?\s*)/gi, '\n')
        .replace(/^(\s*SantraAI\s*:\s*)/gi, '')
        .trim();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('SantraAI client error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "SantraAI couldn't process that request right now.\n\nPlease try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "Conversation reset. How can I assist with your JobMatch AI placement intelligence?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to format inline markdown bold (**bold**) and inline code (`code`)
  const formatInlineText = (str) => {
    if (!str) return '';
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0F172A', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{ backgroundColor: '#F1F5F9', color: '#4F46E5', padding: '1px 5px', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace' }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Helper to render formatted text with steps, bullets and bolding
  const renderMessageContent = (text) => {
    // Strip any possible prefix headers in case they slipped through
    const cleaned = text
      .replace(/^(\s*#*\s*TL[;:]?DR\s*:?\s*)+/gi, '')
      .replace(/(\n\s*#*\s*TL[;:]?DR\s*:?\s*)/gi, '\n')
      .replace(/^(\s*SantraAI\s*:\s*)/gi, '')
      .trim();

    const lines = cleaned.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Step Header rendering (e.g. "Step 1: ...", "**Step 1:** ...")
      const stepMatch = trimmed.match(/^(\*{0,2})(Step \d+[:\s][^\*]*)\1(.*)/i);
      if (stepMatch) {
        const fullStep = (stepMatch[2] + (stepMatch[3] || '')).replace(/\*\*/g, '').trim();
        const stepNum = fullStep.match(/\d+/)?.[0] || '•';
        const stepTitle = fullStep.replace(/^Step \d+[:\s]*/i, '');
        return (
          <div 
            key={idx} 
            style={{ 
              fontWeight: 700, 
              color: '#1E1B4B', 
              marginTop: '12px', 
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem'
            }}
          >
            <span style={{ 
              backgroundColor: '#EEF2FF', 
              color: '#4F46E5', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '2px 8px', 
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Step {stepNum}
            </span>
            <span>{stepTitle}</span>
          </div>
        );
      }

      if (trimmed.startsWith('Key points:') || trimmed.startsWith('**Key points:**')) {
        return (
          <div key={idx} style={{ fontWeight: 700, color: '#334155', marginTop: '8px', marginBottom: '4px' }}>
            Key points:
          </div>
        );
      }

      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const bulletText = trimmed.replace(/^[•\-*]\s*/, '');
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', paddingLeft: '4px', lineHeight: 1.55 }}>
            <span style={{ color: '#6366F1', fontWeight: 800, marginTop: '2px', fontSize: '0.85rem' }}>•</span>
            <span style={{ flex: 1, fontSize: '0.84375rem', color: '#334155' }}>{formatInlineText(bulletText)}</span>
          </div>
        );
      }

      return (
        <div key={idx} style={{ minHeight: trimmed ? 'auto' : '6px', fontSize: '0.84375rem', color: '#1E293B', lineHeight: 1.6 }}>
          {formatInlineText(line)}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            height: '48px',
            padding: '0 20px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            zIndex: 9999,
            fontWeight: 700,
            fontSize: '0.875rem',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(79, 70, 229, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.45)';
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={14} />
          </div>
          <span>SantraAI</span>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 8px #10B981'
          }} />
        </button>
      )}

      {/* Floating Chatbot Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
          height: '580px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.22), 0 0 1px 1px rgba(15, 23, 42, 0.08)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'chatSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0B132B 0%, #1C2541 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  SantraAI
                  <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(79, 70, 229, 0.4)', color: '#C7D2FE', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Agent 50
                  </span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  Grounded Website Assistant
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Conversation Messages Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F8FAFC'
          }}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div style={{
                    maxWidth: '88%',
                    padding: '12px 14px',
                    borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    backgroundColor: isBot ? '#FFFFFF' : '#4F46E5',
                    color: isBot ? '#1E293B' : '#FFFFFF',
                    fontSize: '0.8125rem',
                    lineHeight: 1.45,
                    boxShadow: isBot ? '0 2px 6px rgba(0,0,0,0.04)' : '0 2px 8px rgba(79, 70, 229, 0.3)',
                    border: isBot ? '1px solid #E2E8F0' : 'none',
                    wordBreak: 'break-word'
                  }}>
                    {isBot ? renderMessageContent(msg.text) : msg.text}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '3px', padding: '0 4px' }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Thinking / Loading Animation State */}
            {isThinking && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#4F46E5' }}>
                    SantraAI is thinking...
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818CF8', animation: 'bounce 1.2s infinite ease-in-out', animationDelay: '0ms' }} />
                    <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366F1', animation: 'bounce 1.2s infinite ease-in-out', animationDelay: '200ms' }} />
                    <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4F46E5', animation: 'bounce 1.2s infinite ease-in-out', animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills (Scrollable) */}
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug)}
                disabled={isThinking}
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#4F46E5',
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #E0E7FF',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E0E7FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FF';
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              placeholder="Ask SantraAI about matches, drives, skills..."
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '999px',
                backgroundColor: '#F1F5F9',
                border: '1px solid transparent',
                fontSize: '0.8125rem',
                outline: 'none',
                color: '#0F172A',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isThinking}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: inputMessage.trim() && !isThinking ? '#4F46E5' : '#E2E8F0',
                color: inputMessage.trim() && !isThinking ? 'white' : '#94A3B8',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputMessage.trim() && !isThinking ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Embedded Styles for smooth animations */}
      <style>{`
        @keyframes chatSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </>
  );
}
