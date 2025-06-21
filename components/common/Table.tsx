import React from 'react';

export interface Column<T> {
  header: string | React.ReactElement | React.FC<any>;
  accessor: keyof T | ((item: T, rowIndex: number) => React.ReactNode);
  render?: (item: T, rowIndex: number) => React.ReactNode;
  className?: string; // class for th/td
  headerClassName?: string;
  cellClassName?: string | ((item: T, rowIndex: number) => string); // specific for td
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string | React.ReactNode;
  onRowClick?: (item: T, rowIndex: number) => void;
  rowKeyAccessor: keyof T | ((item: T, rowIndex: number) => React.Key);
  tableClassName?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string | ((item: T, rowIndex: number) => string);
}

const Table = <T extends object>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available.",
  onRowClick,
  rowKeyAccessor,
  tableClassName = '',
  headerRowClassName = '',
  bodyRowClassName = '',
}: TableProps<T>): React.ReactNode => {
  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-brand-border">
      <table className={`min-w-full divide-y divide-brand-border ${tableClassName}`}>
        <thead className="bg-slate-50">
          <tr className={headerRowClassName}>
            {columns.map((col, index) => {
              let headerContent: React.ReactNode;
              if (typeof col.header === 'function') {
                headerContent = React.createElement(col.header as React.FC<any>);
              } else {
                headerContent = col.header;
              }
              return (
                <th
                  key={index}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wider ${col.headerClassName || col.className || ''}`}
                >
                  {headerContent}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-brand-border">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-brand-text-secondary">
                <div className="flex flex-col justify-center items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
                  <span>Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-brand-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => {
              const key = typeof rowKeyAccessor === 'function' 
                ? rowKeyAccessor(item, rowIndex) 
                : String(item[rowKeyAccessor as keyof T]);

              const rowClasses = typeof bodyRowClassName === 'function' ? bodyRowClassName(item, rowIndex) : bodyRowClassName;

              return (
                <tr 
                  key={key ?? rowIndex}
                  onClick={() => onRowClick && onRowClick(item, rowIndex)}
                  className={`${onRowClick ? 'hover:bg-slate-50 cursor-pointer transition-colors duration-150' : ''} ${rowClasses}`}
                >
                  {columns.map((col, colIndex) => {
                    const cellSpecificClassName = typeof col.cellClassName === 'function'
                      ? col.cellClassName(item, rowIndex)
                      : col.cellClassName;
                    return (
                      <td key={colIndex} className={`px-4 py-3 whitespace-nowrap text-sm text-brand-text ${cellSpecificClassName || col.className || ''}`}>
                        {col.render
                          ? col.render(item, rowIndex)
                          : typeof col.accessor === 'function'
                          ? col.accessor(item, rowIndex)
                          : String(item[col.accessor as keyof T] ?? '')}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;