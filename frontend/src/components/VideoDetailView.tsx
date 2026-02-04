import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';

interface VideoDetailViewProps {
  video: any; // Full video row from youtube_videos
  onClose: () => void;
}

export const VideoDetailView: React.FC<VideoDetailViewProps> = ({ video, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [embedding, setEmbedding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmbedding();
  }, [video.video_id]);

  const fetchEmbedding = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/youtube/embeddings/${video.video_id}`);
      if (response.data.data) {
        setEmbedding(response.data.data);
      }
    } catch (err: any) {
      // 404 is okay - means no embedding exists yet
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error?.message || err.message || 'Failed to fetch embedding');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
      if (value >= 1000) return (value / 1000).toFixed(2) + 'K';
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderField = (label: string, value: any, isLarge = false) => {
    const formattedValue = formatValue(value);
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#6c757d',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.25rem',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: isLarge ? '1rem' : '0.875rem',
            color: '#212529',
            wordBreak: 'break-word',
            whiteSpace: isLarge ? 'pre-wrap' : 'normal',
            lineHeight: isLarge ? '1.6' : '1.4',
            padding: isLarge ? '0.75rem' : '0',
            backgroundColor: isLarge ? '#f8f9fa' : 'transparent',
            borderRadius: isLarge ? '4px' : '0',
            border: isLarge ? '1px solid #dee2e6' : 'none',
          }}
        >
          {formattedValue}
        </div>
      </div>
    );
  };

  // Organize video columns by importance
  const videoSections = [
    {
      title: 'Core Information',
      fields: [
        { key: 'video_id', label: 'Video ID' },
        { key: 'title', label: 'Title' },
        { key: 'channel_name', label: 'Channel Name' },
        { key: 'published_at', label: 'Published At' },
      ],
    },
    {
      title: 'Engagement Metrics',
      fields: [
        { key: 'view_count', label: 'Views' },
        { key: 'like_count', label: 'Likes' },
        { key: 'comment_count', label: 'Comments' },
        { key: 'engagement_rate', label: 'Engagement Rate' },
        { key: 'days_since_published', label: 'Days Since Published' },
      ],
    },
    {
      title: 'Media',
      fields: [
        { key: 'thumbnail_url', label: 'Thumbnail URL' },
      ],
    },
  ];

  // Embedding sections organized by importance
  const embeddingSections = [
    {
      title: 'Content Strategy',
      fields: [
        { key: 'topic', label: 'Topic', isLarge: true },
        { key: 'format', label: 'Format' },
        { key: 'hook', label: 'Hook', isLarge: true },
        { key: 'style', label: 'Style' },
      ],
    },
    {
      title: 'Creative Elements',
      fields: [
        { key: 'gimmick', label: 'Gimmick', isLarge: true },
        { key: 'poc', label: 'POC (Proof of Concept)', isLarge: true },
        { key: 'end_cta', label: 'End CTA', isLarge: true },
      ],
    },
    {
      title: 'Full Content',
      fields: [
        { key: 'script', label: 'Script', isLarge: true },
        { key: 'embedding_text', label: 'Embedding Text', isLarge: true },
      ],
    },
  ];

  // Get all other video fields not in sections
  const videoSectionKeys = new Set(
    videoSections.flatMap((section) => section.fields.map((f) => f.key))
  );
  const otherVideoFields = Object.keys(video)
    .filter((key) => !videoSectionKeys.has(key))
    .map((key) => ({ key, label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }));

  // Get all other embedding fields not in sections
  const embeddingSectionKeys = new Set(
    embeddingSections.flatMap((section) => section.fields.map((f) => f.key))
  );
  const otherEmbeddingFields = embedding
    ? Object.keys(embedding)
        .filter((key) => !embeddingSectionKeys.has(key) && key !== 'video_id')
        .map((key) => ({
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        }))
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              Video Details
            </h2>
            {video.title && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '0.875rem' }}>
                {video.title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0.5rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading embedding data...</p>
            </div>
          ) : (
            <>
              {error && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              {/* Video Sections */}
              {videoSections.map((section) => (
                <div key={section.title} style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#495057',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    {section.title}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {section.fields.map((field) => {
                      // Special handling for thumbnail URL
                      if (field.key === 'thumbnail_url' && video[field.key]) {
                        return (
                          <div key={field.key} style={{ marginBottom: '1rem', gridColumn: '1 / -1' }}>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#6c757d',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.25rem',
                              }}
                            >
                              {field.label}
                            </div>
                            <img
                              src={video[field.key]}
                              alt="Thumbnail"
                              style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6',
                              }}
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6c757d', wordBreak: 'break-all' }}>
                              {video[field.key]}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={field.key}>
                          {renderField(field.label, video[field.key], field.isLarge)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Embedding Sections */}
              {embedding ? (
                embeddingSections.map((section) => (
                  <div key={section.title} style={{ marginBottom: '2rem' }}>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#495057',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #dee2e6',
                      }}
                    >
                      {section.title}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      {section.fields.map((field) => (
                        <div key={field.key} style={{ gridColumn: field.isLarge ? '1 / -1' : 'auto' }}>
                          {renderField(field.label, embedding[field.key], field.isLarge)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#495057',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Embedding Data
                  </h3>
                  <p style={{ margin: 0, color: '#6c757d' }}>
                    No embedding data found for this video. Use "Edit Embeddings" to create one.
                  </p>
                </div>
              )}

              {/* Other Video Fields */}
              {otherVideoFields.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#495057',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    Additional Video Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {otherVideoFields.map((field) => (
                      <div key={field.key}>
                        {renderField(field.label, video[field.key])}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Embedding Fields */}
              {otherEmbeddingFields.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#495057',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    Additional Embedding Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {otherEmbeddingFields.map((field) => (
                      <div key={field.key}>
                        {renderField(field.label, embedding[field.key])}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
