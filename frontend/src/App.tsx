import { useState, useEffect } from 'react';
import { apiClient } from './config/api';
import { DataTable, Column } from './components/DataTable';

interface TestTableData {
  id: string;
  [key: string]: any;
}

function App() {
  const [data, setData] = useState<TestTableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);

  useEffect(() => {
    testConnection();
    fetchData();
  }, []);

  const testConnection = async () => {
    try {
      const response = await apiClient.get('/api/test-connection');
      setConnectionStatus({
        connected: response.data.success,
        message: response.data.message,
        rowCount: response.data.rowCount,
      });
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        message: err.response?.data?.message || 'Connection test failed',
      });
      console.error('Connection test error:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/analytics');
      setData(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Social Media Analytics Tool</h1>
        <p>Connected to Supabase via API</p>
      </header>

      {/* Connection Status */}
      {connectionStatus && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: connectionStatus.connected ? '#d4edda' : '#f8d7da',
            color: connectionStatus.connected ? '#155724' : '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${connectionStatus.connected ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          <strong>Supabase Connection:</strong> {connectionStatus.message}
          {connectionStatus.rowCount !== undefined && (
            <span> | Table has {connectionStatus.rowCount} row(s)</span>
          )}
        </div>
      )}

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        <button
          onClick={testConnection}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Test Connection
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && <p>Loading data from test_table...</p>}

      {!loading && !error && (
        <div>
          <h2>Data from test_table ({data.length} items)</h2>
          <DataTable
            data={data}
            tableName="test_table"
            onActionClick={(row) => {
              console.log('Action clicked for row:', row);
              // Action handler will be implemented later
              alert(`Action clicked for row ID: ${row.id || 'N/A'}`);
            }}
            actionLabel="Actions"
            // Optional: Define custom columns
            // columns={[
            //   { key: 'id', label: 'ID' },
            //   { key: 'name', label: 'Name' },
            //   { key: 'created_at', label: 'Created At', render: (value) => new Date(value).toLocaleString() },
            // ]}
          />
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>API Health Check</h3>
        <HealthCheck />
      </div>
    </div>
  );
}

function HealthCheck() {
  const [health, setHealth] = useState<{ status: string; timestamp?: string } | null>(null);

  useEffect(() => {
    apiClient
      .get('/health')
      .then((response) => setHealth(response.data))
      .catch((err) => setHealth({ status: 'error', timestamp: err.message }));
  }, []);

  return (
    <div>
      <p>Status: {health?.status || 'checking...'}</p>
      {health?.timestamp && <p>Timestamp: {health.timestamp}</p>}
    </div>
  );
}

export default App;
