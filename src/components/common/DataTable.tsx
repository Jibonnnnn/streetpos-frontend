import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from './Skeleton';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
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

  const filteredData = useMemo(() => {
    if (onSearch) {
      return data;
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return data;
    }

    return data.filter((item) => {
      try {
        return JSON.stringify(item).toLowerCase().includes(term);
      } catch {
        return false;
      }
    });
  }, [data, onSearch, searchTerm]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input 
          placeholder={searchPlaceholder} 
          value={searchTerm} 
          onChange={handleSearch}
          className="max-w-full sm:max-w-sm"
        />
      </div>

      <div className="rounded-3xl border bg-white dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full">
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
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8 text-center sm:p-12">
                    <p className="text-zinc-500">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="p-4 align-top">
                        {col.render
                          ? col.render(item)
                          : typeof col.accessor === 'function' 
                          ? col.accessor(item) 
                          : String(item[col.accessor])}
                      </td>
                    ))}
                    {actions && <td className="p-4 text-right align-top">{actions(item)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}