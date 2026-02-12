import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiClient } from '../config/api';

interface ChatbotProps {
  videos: any[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  history: ChatMessage[];
  updated_at: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ videos }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideoSelector, setShowVideoSelector] = useState(true);
  const [sortBy, setSortBy] = useState<'none' | 'views-desc' | 'views-asc' | 'engagement-desc' | 'engagement-asc'>('views-desc');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await apiClient.get('/api/chat/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const saveSession = async (updatedMessages: ChatMessage[]) => {
    if (updatedMessages.length === 0) return;
    
    setIsSaving(true);
    try {
      // Use the first user message as the title
      const firstUserMsg = updatedMessages.find(m => m.role === 'user');
      const title = firstUserMsg 
        ? (firstUserMsg.content.length > 40 ? firstUserMsg.content.substring(0, 40) + '...' : firstUserMsg.content)
        : 'New Conversation';

      const response = await apiClient.post('/api/chat/sessions', {
        id: currentSessionId,
        title,
        history: updatedMessages
      });

      if (response.data.success) {
        const savedSession = response.data.data;
        if (!currentSessionId) {
          setCurrentSessionId(savedSession.id);
        }
        // Refresh sessions list
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.history);
    setError(null);
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setInput('');
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await apiClient.delete(`/api/chat/sessions/${id}`);
      if (response.data.success) {
        if (currentSessionId === id) {
          startNewChat();
        }
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sort videos
  const sortedVideos = React.useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
      if (sortBy === 'none') return 0;
      if (sortBy === 'views-desc' || sortBy === 'views-asc') {
        const viewsA = a.view_count || 0;
        const viewsB = b.view_count || 0;
        return sortBy === 'views-desc' ? viewsB - viewsA : viewsA - viewsB;
      }
      if (sortBy === 'engagement-desc' || sortBy === 'engagement-asc') {
        const engagementA = a.engagement_rate || 0;
        const engagementB = b.engagement_rate || 0;
        return sortBy === 'engagement-desc' ? engagementB - engagementA : engagementA - engagementB;
      }
      return 0;
    });
    return sorted;
  }, [videos, sortBy]);

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideoIds);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideoIds(newSelection);
  };

  const selectAllVideos = () => {
    setSelectedVideoIds(new Set(videos.map((v) => v.video_id)));
  };

  const deselectAllVideos = () => {
    setSelectedVideoIds(new Set());
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/chat', {
        message: trimmed,
        videoIds: Array.from(selectedVideoIds),
        history: messages, // send prior conversation as history
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.data.message,
        };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        // Auto-save the session
        saveSession(finalMessages);
      } else {
        setError(response.data.error?.message || 'Something went wrong');
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to send message';
      setError(errMsg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', backgroundColor: '#0d1117' }}>
      {/* Session Sidebar */}
      <div 
        style={{ 
          width: '280px', 
          borderRight: '1px solid #30363d', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#161b22'
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #30363d' }}>
          <button
            onClick={startNewChat}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#21262d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> New Chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
            Previous Chats
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: '1rem', color: '#484f58', fontSize: '0.85rem', textAlign: 'center' }}>
              No history yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  backgroundColor: currentSessionId === session.id ? '#1f6feb22' : 'transparent',
                  border: `1px solid ${currentSessionId === session.id ? '#1f6feb44' : 'transparent'}`,
                  transition: 'all 0.15s',
                  position: 'relative',
                  group: 'true'
                } as any}
                onMouseEnter={(e) => {
                  if (currentSessionId !== session.id) {
                    e.currentTarget.style.backgroundColor = '#21262d';
                  }
                  const delBtn = e.currentTarget.querySelector('.delete-session-btn') as HTMLElement;
                  if (delBtn) delBtn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (currentSessionId !== session.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                  const delBtn = e.currentTarget.querySelector('.delete-session-btn') as HTMLElement;
                  if (delBtn) delBtn.style.opacity = '0';
                }}
              >
                <div style={{ 
                  color: currentSessionId === session.id ? '#58a6ff' : '#c9d1d9', 
                  fontSize: '0.875rem', 
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingRight: '1.5rem'
                }}>
                  {session.title}
                </div>
                <div style={{ color: '#8b949e', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                  {new Date(session.updated_at).toLocaleDateString()}
                </div>
                <button
                  className="delete-session-btn"
                  onClick={(e) => deleteSession(e, session.id)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b949e',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    opacity: 0,
                    transition: 'all 0.2s',
                    padding: '0.25rem',
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff7b72'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ 
        flex: 1,
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#c9d1d9', margin: 0 }}>
            Marketing Chatbot
            {isSaving && <span style={{ fontSize: '0.8rem', color: '#8b949e', marginLeft: '1rem', fontWeight: 400 }}>Saving...</span>}
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowVideoSelector(!showVideoSelector)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showVideoSelector ? '#1f6feb' : '#21262d',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              {showVideoSelector ? 'Hide' : 'Show'} Context ({selectedVideoIds.size})
            </button>
            <button
              onClick={startNewChat}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#21262d',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              New Chat
            </button>
          </div>
        </div>

      {/* Video Context Selector (collapsible) */}
      {showVideoSelector && (
        <div
          style={{
            marginBottom: '1.5rem',
            border: '1px solid #30363d',
            borderRadius: '8px',
            backgroundColor: '#161b22',
            padding: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <label style={{ fontWeight: 600, color: '#c9d1d9', fontSize: '0.9rem' }}>
              Select Videos for Context ({selectedVideoIds.size} selected)
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <option value="views-desc">Highest Views ↓</option>
                <option value="views-asc">Lowest Views ↑</option>
                <option value="engagement-desc">Highest Engagement ↓</option>
                <option value="engagement-asc">Lowest Engagement ↑</option>
                <option value="none">No Sort</option>
              </select>
              <button
                onClick={selectAllVideos}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#A22D2D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Select All
              </button>
              <button
                onClick={deselectAllVideos}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#2A2E3C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Deselect All
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              backgroundColor: '#0d1117',
              borderRadius: '6px',
              padding: '0.5rem',
              border: '1px solid #30363d'
            }}
          >
            {sortedVideos.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#8b949e', fontSize: '0.875rem' }}>
                No videos available
              </div>
            ) : (
              sortedVideos.map((video) => (
                <label
                  key={video.video_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    marginBottom: '0.25rem',
                    transition: 'background-color 0.15s',
                    backgroundColor: selectedVideoIds.has(video.video_id) ? '#1f6feb22' : 'transparent',
                    border: `1px solid ${selectedVideoIds.has(video.video_id) ? '#1f6feb44' : 'transparent'}`
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedVideoIds.has(video.video_id)) {
                      e.currentTarget.style.backgroundColor = '#21262d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedVideoIds.has(video.video_id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedVideoIds.has(video.video_id)}
                    onChange={() => toggleVideoSelection(video.video_id)}
                    style={{ marginRight: '0.75rem', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#c9d1d9', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.title || video.video_id}
                    </div>
                    <div style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                      {video.view_count?.toLocaleString() || 0} views •{' '}
                      {video.engagement_rate ? (video.engagement_rate * 100).toFixed(2) + '%' : 'N/A'} eng.
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #30363d',
          borderRadius: '8px',
          backgroundColor: '#0d1117',
          padding: '1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
          paddingTop: '20rem',
          paddingBottom: '20rem',
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.1 }}>💬</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c9d1d9' }}>
              Marketing Strategy AI
            </div>
            <div style={{ fontSize: '0.9rem', maxWidth: '450px', lineHeight: '1.6' }}>
              Select videos above to give me context on what works for your audience. 
              Then ask me to generate hooks, scripts, or strategy based on those patterns.
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '0.875rem 1.25rem',
                borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                backgroundColor: msg.role === 'user' ? '#057642' : '#21262d',
                color: '#ffffff',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                border: msg.role === 'user' ? '1px solid #069153' : '1px solid #30363d',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AI Strategist
                </div>
              )}
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <p style={{ margin: '0 0 0.5rem 0' }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }} {...props} />,
                  ol: ({node, ...props}) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                  code: ({node, ...props}) => (
                    <code 
                      style={{ 
                        backgroundColor: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)', 
                        padding: '0.2rem 0.4rem', 
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        fontFamily: 'monospace'
                      }} 
                      {...props} 
                    />
                  ),
                  strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: '#fff' }} {...props} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '0.875rem 1.25rem',
                borderRadius: '16px 16px 16px 2px',
                backgroundColor: '#21262d',
                color: '#8b949e',
                fontSize: '0.9375rem',
                border: '1px solid #30363d'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Strategist
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Thinking</span>
                <span style={{ animation: 'pulse 1.5s infinite' }}>...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#3d1b1b',
            color: '#ff7b72',
            borderRadius: '6px',
            marginBottom: '0.75rem',
            fontSize: '0.875rem',
            border: '1px solid #6e2121',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', backgroundColor: '#161b22', padding: '0.75rem', borderRadius: '10px', border: '1px solid #30363d' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedVideoIds.size === 0
              ? 'Select videos above for context, then type your message...'
              : 'Type your message... (Shift+Enter for new line)'
          }
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #30363d',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            minHeight: '44px',
            maxHeight: '200px',
            overflow: 'auto',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1f6feb'}
          onBlur={(e) => e.target.style.borderColor = '#30363d'}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading || !input.trim() ? '#21262d' : '#1f6feb',
            color: loading || !input.trim() ? '#484f58' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.9375rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            minHeight: '44px',
            transition: 'all 0.2s',
            boxShadow: loading || !input.trim() ? 'none' : '0 2px 6px rgba(31, 111, 235, 0.3)'
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      {/* Info */}
      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#1c2128', borderRadius: '6px', border: '1px solid #30363d' }}>
        <div style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: '1.6' }}>
          <strong style={{ color: '#c9d1d9' }}>Powered by GPT-3.5 Turbo</strong>
          {' · '}
          Using {selectedVideoIds.size > 0 ? <strong style={{ color: '#58a6ff' }}>{selectedVideoIds.size} video(s)</strong> : 'no videos'} as pattern context.
          {' · '}
          Shift+Enter for new lines.
        </div>
      </div>
    </div>
  </div>
  );
};

export { Chatbot };
