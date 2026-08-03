import { useEffect, useMemo, useState } from "react";

export type UsePaginationResult<T> = {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  total: number;
  paginated: T[];
  from: number;
  to: number;
};

/**
 * Client-side pagination. Resets to page 1 when the source list or page size changes.
 */
export function usePagination<T>(
  items: T[],
  initialPageSize = 10,
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  // Reset to first page when the list shrinks/filters or page size changes
  useEffect(() => {
    setPage(1);
  }, [total, pageSize]);

  // Clamp if current page is past the end (e.g. after deletes)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    paginated,
    from,
    to,
  };
}
