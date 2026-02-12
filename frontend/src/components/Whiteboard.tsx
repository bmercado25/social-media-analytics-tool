import React, { useState, useEffect, useCallback, useRef } from 'react';
import Draggable from 'react-draggable';
import { apiClient } from '../config/api';

interface WhiteboardIdea {
  id: string;
  content: string;
  x_pos: number;
  y_pos: number;
  color: string;
  width: number;
  height: number;
}

const COLORS = [
  '#1f6feb', // Blue
  '#238636', // Green
  '#da3633', // Red
  '#8957e5', // Purple
  '#d29922', // Yellow
  '#30363d', // Grey
];

const Whiteboard: React.FC = () => {
  const [ideas, setIdeas] = useState<WhiteboardIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const fetchIdeas = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/whiteboard');
      if (response.data.success) {
        setIdeas(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch whiteboard ideas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
    // Cleanup timers on unmount
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [fetchIdeas]);

  const addIdea = async () => {
    try {
      const response = await apiClient.post('/api/whiteboard', {
        content: '',
        x_pos: 50 + Math.random() * 100,
        y_pos: 50 + Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
      if (response.data.success) {
        setIdeas([...ideas, response.data.data]);
      }
    } catch (err) {
      console.error('Failed to add idea:', err);
    }
  };

  const updateIdeaOptimistic = (id: string, updates: Partial<WhiteboardIdea>, persist: boolean = true) => {
    // 1. Update local state immediately
    setIdeas(prev => prev.map(idea => (idea.id === id ? { ...idea, ...updates } : idea)));

    if (!persist) return;

    // 2. Clear existing timer for this idea and field
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    // 3. Set a new timer to persist the change
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await apiClient.patch(`/api/whiteboard/${id}`, updates);
      } catch (err) {
        console.error('Failed to persist idea update:', err);
        // Optional: Revert state on failure (simplified here)
      }
    }, 500); // 500ms debounce
  };

  const deleteIdea = async (id: string) => {
    try {
      // Optimistic delete
      setIdeas(ideas.filter((idea) => idea.id !== id));
      await apiClient.delete(`/api/whiteboard/${id}`);
    } catch (err) {
      console.error('Failed to delete idea:', err);
      fetchIdeas(); // Revert on failure
    }
  };

  const handleDrag = (id: string, e: any, data: any) => {
    // We update local state only during drag to make it feel smooth, 
    // but we don't persist until stop to avoid flooding the API
    updateIdeaOptimistic(id, { x_pos: data.x, y_pos: data.y }, false);
  };

  const handleStop = (id: string, e: any, data: any) => {
    // Persist position on stop
    updateIdeaOptimistic(id, { x_pos: data.x, y_pos: data.y }, true);
  };

  if (loading) {
    return <div style={{ color: '#8b949e', padding: '2rem' }}>Loading whiteboard...</div>;
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '600px', 
        backgroundColor: '#0d1117', 
        border: '1px solid #30363d', 
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          zIndex: 10 
        }}
      >
        <button
          onClick={addIdea}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#0d1117',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '2rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          +
        </button>
      </div>

      {ideas.map((idea) => (
        <Draggable
          key={idea.id}
          position={{ x: idea.x_pos, y: idea.y_pos }}
          onDrag={(e, data) => handleDrag(idea.id, e, data)}
          onStop={(e, data) => handleStop(idea.id, e, data)}
          bounds="parent"
          handle=".drag-handle"
        >
          <div
            style={{
              position: 'absolute',
              width: idea.width,
              height: idea.height,
              minWidth: '150px',
              minHeight: '100px',
              backgroundColor: '#161b22',
              border: `2px solid ${idea.color}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 1,
              resize: 'both',
              overflow: 'hidden'
            }}
            onMouseUp={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (rect.width !== idea.width || rect.height !== idea.height) {
                // Update locally only
                updateIdeaOptimistic(idea.id, { width: rect.width, height: rect.height }, false);
              }
            }}
          >
            <div 
              className="drag-handle"
              style={{ 
                height: '24px', 
                backgroundColor: idea.color, 
                cursor: 'grab', 
                borderTopLeftRadius: '5px', 
                borderTopRightRadius: '5px',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '0 4px'
              }}
            >
              <button
                onClick={() => deleteIdea(idea.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                  padding: '0 4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              >
                ×
              </button>
            </div>
            <textarea
              value={idea.content}
              onChange={(e) => updateIdeaOptimistic(idea.id, { content: e.target.value })}
              placeholder="Type an idea..."
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#c9d1d9',
                resize: 'none',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </Draggable>
      ))}

      {ideas.length === 0 && (
        <div 
          style={{ 
            display: 'flex', 
            height: '100%', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#484f58',
            fontSize: '1.1rem',
            pointerEvents: 'none'
          }}
        >
          The whiteboard is empty. Add your first idea!
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
