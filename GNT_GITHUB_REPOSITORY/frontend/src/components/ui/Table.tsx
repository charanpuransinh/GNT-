import React from 'react';

/**
 * ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02।
 * pages दो शैलियों में columns देते हैं: `{ key, header, render }` और `{ header, accessor }` — दोनों चलेंगी।
 */
export interface TableColumn<T = Record<string, unknown>> {
  key?: string;
  accessor?: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = Record<string, unknown>> extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  columns?: ReadonlyArray<TableColumn<T>>;
  data?: ReadonlyArray<T>;
  rowKey?: (row: T, index: number) => React.Key;
  emptyMessage?: string;
  children?: React.ReactNode;
}

export function Table<T extends Record<string, unknown>>({ columns, data, rowKey, emptyMessage = 'कोई डेटा नहीं', children, ...rest }: TableProps<T>) {
  if (!columns) return <table {...rest}>{children}</table>;
  const rows = data ?? [];
  return (
    <table {...rest}>
      <thead>
        <tr>{columns.map((c, i) => <th key={c.key ?? c.accessor ?? i} style={{ width: c.width, textAlign: c.align }}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>
        ) : (
          rows.map((row, rowIndex) => (
            <tr key={rowKey ? rowKey(row, rowIndex) : (row.id as React.Key) ?? rowIndex}>
              {columns.map((c, i) => {
                const field = c.key ?? c.accessor;
                return <td key={c.key ?? c.accessor ?? i}>{c.render ? c.render(row) : field ? String(row[field] ?? '') : null}</td>;
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
