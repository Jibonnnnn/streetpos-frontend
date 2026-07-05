import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from './Skeleton';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  loading = false, 
  searchPlaceholder = "Search...", 
  onSearch,
  actions,
  emptyMessage = "No data found."
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch?.(term);
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          placeholder={searchPlaceholder} 
          value={searchTerm} 
          onChange={handleSearch}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50 dark:bg-zinc-800">
              {columns.map((col, i) => (
                <th key={i} className={`text-left p-4 font-medium ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="text-right p-4">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="p-12 text-center">
                  <p className="text-zinc-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="p-4">
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : String(item[col.accessor])}
                    </td>
                  ))}
                  {actions && <td className="p-4 text-right">{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}