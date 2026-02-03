/**
 * Example usage of DataTable component
 * 
 * This file shows different ways to use the DataTable component
 * with custom columns, formatting, and action handlers.
 */

import { DataTable, Column } from './DataTable';

// Example 1: Basic usage (auto-detects columns)
export const BasicExample = ({ data }: { data: any[] }) => {
  return (
    <DataTable
      data={data}
      tableName="my_table"
      onActionClick={(row) => console.log('Row clicked:', row)}
    />
  );
};

// Example 2: Custom columns with formatting
export const CustomColumnsExample = ({ data }: { data: any[] }) => {
  const columns: Column[] = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: 'name',
      label: 'Name',
      render: (value) => <span style={{ color: '#007bff' }}>{value}</span>,
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString();
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const color = value === 'active' ? '#28a745' : '#dc3545';
        return <span style={{ color }}>{value}</span>;
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value || 0);
      },
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      tableName="custom_table"
      onActionClick={(row) => {
        // Custom action logic
        console.log('Custom action for:', row);
      }}
      actionLabel="Options"
    />
  );
};

// Example 3: Without action buttons
export const NoActionsExample = ({ data }: { data: any[] }) => {
  return (
    <DataTable
      data={data}
      tableName="readonly_table"
      // onActionClick is optional - omit to hide action column
    />
  );
};

// Example 4: Filter specific columns
export const FilteredColumnsExample = ({ data }: { data: any[] }) => {
  // Only show specific columns
  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    // Other columns in data will be hidden
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      tableName="filtered_table"
      onActionClick={(row) => console.log('Action:', row)}
    />
  );
};
