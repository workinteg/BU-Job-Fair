/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface AppTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyState?: React.ReactNode;
}

export function AppTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
}: AppTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
      <table className="min-w-full divide-y divide-gray-100 text-left text-sm text-gray-500">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-6 py-4">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white text-gray-900">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12">
                {emptyState || (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No records available.
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr key={keyExtractor(row, rIdx)} className="hover:bg-gray-50/70 transition-all">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {col.render ? col.render(row, rIdx) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
export default AppTable;
