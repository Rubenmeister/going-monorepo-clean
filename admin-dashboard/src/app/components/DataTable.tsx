/**
 * DataTable component - Reusable table for admin data display
 */

import React from 'react';
import { Card, CardBody, Badge } from '@going-monorepo-clean/shared-ui';

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * DataTable component for displaying admin data
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'id', label: 'ID' },
 *     { key: 'name', label: 'Name' },
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       render: (value) => <Badge variant={value === 'active' ? 'success' : 'warning'}>{value}</Badge>
 *     }
 *   ]}
 *   data={users}
 *   rowKey="id"
 *   actions={(row) => <Button size="sm">Edit</Button>}
 * />
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  actions,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Card shadow="sm">
        <CardBody className="flex justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin mb-3">
              <span className="text-3xl">⟳</span>
            </div>
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card shadow="sm">
        <CardBody className="flex justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 text-lg">📭 {emptyMessage}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card shadow="sm" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`
                    px-6 py-3
                    text-left text-sm font-semibold text-gray-700
                    ${col.width || ''}
                  `}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {data.map((row) => (
              <tr
                key={String(row[rowKey])}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                  transition-colors
                `}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`
                      px-6 py-4 text-sm text-gray-900
                      ${col.width || ''}
                    `}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * Status badge renderer helper
 */
export function renderStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    active: 'success',
    inactive: 'error',
    pending: 'warning',
    completed: 'success',
    failed: 'error',
    cancelled: 'error',
    succeeded: 'success',
    processing: 'info',
  };

  const variant = variants[status] || 'info';

  return (
    <Badge variant={variant} size="sm">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
