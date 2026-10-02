import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Skeleton } from './skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  pageSize?: number;
  sortable?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  onRowClick?: (item: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  pageSize = 10,
  sortable = true,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
  onSort,
  className,
}: DataGridProps<T>) {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    new Set(columns.filter((c) => !c.hidden).map((c) => c.id))
  );
  const [selectAll, setSelectAll] = React.useState(false);

  const visibleCols = columns.filter((c) => visibleColumns.has(c.id));

  const filteredData = React.useMemo(() => {
    if (!search) return data;
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (columnId: string) => {
    if (!sortable) return;
    if (sortColumn === columnId) {
      const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDir);
      onSort?.(columnId, newDir);
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
      onSort?.(columnId, 'asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      onSelectionChange?.(new Set());
      setSelectAll(false);
    } else {
      const ids = new Set(pagedData.map(keyExtractor));
      onSelectionChange?.(ids);
      setSelectAll(true);
    }
  };

  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.(next);
  };

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="table-row" />
        ))}
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        {emptyIcon || <Inbox className="h-16 w-16 text-muted-foreground/40 mb-4" />}
        <p className="text-lg font-medium text-muted-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibleColumns.has(col.id)}
                onCheckedChange={(checked) => {
                  const next = new Set(visibleColumns);
                  if (checked) next.add(col.id);
                  else next.delete(col.id);
                  setVisibleColumns(next);
                }}
              >
                {col.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-auto rounded-xl border border-border/50">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {selectable && (
                <th className="h-12 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
              )}
              {visibleCols.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                    col.sortable !== false && sortable && 'cursor-pointer select-none hover:text-foreground transition-colors'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.id)}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable !== false && sortable && (
                      <span className="inline-flex">
                        {sortColumn === col.id ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {pagedData.map((item, index) => {
                const key = keyExtractor(item);
                return (
                  <motion.tr
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-muted/40',
                      onRowClick && 'cursor-pointer',
                      selectedIds.has(key) && 'bg-primary/5'
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <td className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(key)}
                          onChange={() => toggleSelect(key)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border"
                        />
                      </td>
                    )}
                    {visibleCols.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'p-4',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right'
                        )}
                      >
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? '')
                          : ''}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedData.length)} of{' '}
          {sortedData.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? 'default' : 'outline'}
                size="icon"
                onClick={() => setPage(pageNum)}
                className="h-8 w-8 text-xs"
              >
                {pageNum + 1}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { DataGrid };
export type { DataGridProps };
