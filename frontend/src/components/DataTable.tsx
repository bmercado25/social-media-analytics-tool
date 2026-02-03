import React from 'react';

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns?: Column[];
  onActionClick?: (row: any) => void;
  actionLabel?: string;
  tableName?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onActionClick,
  actionLabel = 'Actions',
  tableName,
}) => {
  // If no columns provided, auto-generate from first row
  const autoColumns: Column[] = React.useMemo(() => {
    if (columns) return columns;
    if (data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    }));
  }, [columns, data]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
        <p>No data available in {tableName || 'this table'}</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            {autoColumns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#495057',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {column.label}
              </th>
            ))}
            {onActionClick && (
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#495057',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '120px',
                }}
              >
                {actionLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              style={{
                borderBottom: '1px solid #dee2e6',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {autoColumns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '1rem',
                    color: '#212529',
                    fontSize: '0.875rem',
                  }}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : formatValue(row[column.key])}
                </td>
              ))}
              {onActionClick && (
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <button
                    onClick={() => onActionClick(row)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0056b3';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#007bff';
                    }}
                  >
                    Actions
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
