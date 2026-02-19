import { useState, useEffect, useCallback } from 'react';

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    totalPages: number;
    currentPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onSearch: (search: string) => void;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    loading?: boolean;
    actions?: (item: T) => React.ReactNode;
    searchPlaceholder?: string;
}

function DataTable<T extends { id: string }>({
    columns,
    data,
    totalPages,
    currentPage,
    total,
    onPageChange,
    onSearch,
    onSort,
    loading = false,
    actions,
    searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const debounce = useCallback((fn: Function, delay: number) => {
        let timer: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }, []);

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            onSearch(value);
        }, 300),
        [onSearch]
    );

    useEffect(() => {
        debouncedSearch(search);
    }, [search]);

    const handleSort = (key: string) => {
        const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortKey(key);
        setSortDirection(direction);
        onSort?.(key, direction);
    };

    const getValue = (item: T, key: string): any => {
        return key.split('.').reduce((obj: any, k) => obj?.[k], item);
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <div className="relative">
                    <input
                        type="text"
                        className="form-input w-auto pr-10"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <p className="text-sm text-gray-500">Total: {total} records</p>
            </div>

            <div className="table-responsive">
                <table className="table-hover">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={col.sortable ? 'cursor-pointer select-none' : ''}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortKey === col.key && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th className="text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10">
                                    <div className="animate-spin border-4 border-construction border-l-transparent rounded-full w-8 h-8 mx-auto"></div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-gray-500">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id}>
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            {col.render ? col.render(item) : getValue(item, col.key)}
                                        </td>
                                    ))}
                                    {actions && <td className="text-center">{actions(item)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                            page = i + 1;
                        } else if (currentPage <= 3) {
                            page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                        } else {
                            page = currentPage - 2 + i;
                        }
                        return (
                            <button
                                key={page}
                                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        );
                    })}
                    <button
                        className="btn btn-outline-primary btn-sm"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default DataTable;
