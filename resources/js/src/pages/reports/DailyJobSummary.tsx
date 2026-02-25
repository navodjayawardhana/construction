import { useState } from 'react';
import toast from 'react-hot-toast';
import { DailyJobSummaryData } from '../../types/reports';
import { getDailyJobSummary, exportDailyJobSummary } from '../../services/reportService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Pagination = ({ currentPage, lastPage, onPageChange }: { currentPage: number; lastPage: number; onPageChange: (page: number) => void }) => {
    if (lastPage <= 1) return null;
    return (
        <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
            <div className="flex gap-2">
                <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </button>
                {Array.from({ length: lastPage }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                    }, [])
                    .map((p, i) =>
                        typeof p === 'string' ? (
                            <span key={`ellipsis-${i}`} className="px-2 py-1">...</span>
                        ) : (
                            <button
                                key={p}
                                className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => onPageChange(p)}
                            >
                                {p}
                            </button>
                        )
                    )}
                <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const DailyJobSummary = () => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<DailyJobSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);

    const fetchReport = async (p = page) => {
        if (!dateFrom || !dateTo) return;
        setLoading(true);
        try {
            const response = await getDailyJobSummary({ date_from: dateFrom, date_to: dateTo, page: p });
            setData(response.data);
        } catch {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        if (!dateFrom || !dateTo) {
            toast.error('Please select date range');
            return;
        }
        setPage(1);
        setExpandedDates(new Set());
        fetchReport(1);
    };

    const handlePageChange = (p: number) => {
        setPage(p);
        setExpandedDates(new Set());
        fetchReport(p);
    };

    const toggleDate = (date: string) => {
        setExpandedDates((prev) => {
            const next = new Set(prev);
            if (next.has(date)) {
                next.delete(date);
            } else {
                next.add(date);
            }
            return next;
        });
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!dateFrom || !dateTo) return;
        try {
            await exportDailyJobSummary({ date_from: dateFrom, date_to: dateTo, format });
            toast.success(`${format.toUpperCase()} downloaded successfully`);
        } catch {
            toast.error(`Failed to export ${format.toUpperCase()}`);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div>
            <PageHeader
                title="Daily Job Summary"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Reports', path: '/reports' },
                    { label: 'Daily Job Summary' },
                ]}
                action={
                    data ? (
                        <div className="flex gap-2">
                            <button onClick={() => handleExport('pdf')} className="btn btn-outline-danger btn-sm">
                                Export PDF
                            </button>
                            <button onClick={() => handleExport('excel')} className="btn btn-outline-success btn-sm">
                                Export Excel
                            </button>
                            <button onClick={() => window.print()} className="btn btn-primary btn-sm">Print</button>
                        </div>
                    ) : undefined
                }
            />

            {/* Filters */}
            <div className="panel mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Date From <span className="text-danger">*</span></label>
                        <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Date To <span className="text-danger">*</span></label>
                        <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div>
                        <button onClick={handleGenerate} className="btn btn-primary w-full" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            </div>

            {loading && <LoadingSpinner />}

            {data && !loading && (
                <div className="space-y-4">
                    {/* Grand Total */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="panel bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total JCB ({data.grand_total.total_jcb_count} jobs)</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.grand_total.total_jcb)}</p>
                        </div>
                        <div className="panel bg-amber-50 dark:bg-amber-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Lorry ({data.grand_total.total_lorry_count} jobs)</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(data.grand_total.total_lorry)}</p>
                        </div>
                        <div className="panel bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Grand Total</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.grand_total.total)}</p>
                        </div>
                    </div>

                    {/* Daily Breakdown */}
                    {data.daily_summary.data.map((day) => (
                        <div key={day.date} className="panel">
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleDate(day.date)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`transform transition-transform ${expandedDates.has(day.date) ? 'rotate-90' : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-dark dark:text-white-light">{formatDate(day.date)}</h3>
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                                        {day.jcb_count} JCB
                                    </span>
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                                        {day.lorry_count} Lorry
                                    </span>
                                </div>
                                <span className="font-bold text-lg">{formatCurrency(day.daily_total)}</span>
                            </div>

                            {expandedDates.has(day.date) && (
                                <div className="mt-4">
                                    <div className="table-responsive">
                                        <table className="table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Vehicle</th>
                                                    <th>Client</th>
                                                    <th>Location</th>
                                                    <th>Details</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {day.jobs.map((job) => (
                                                    <tr key={job.id}>
                                                        <td>
                                                            <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${job.job_type === 'jcb' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {job.job_type}
                                                            </span>
                                                        </td>
                                                        <td className="text-yellow-600 font-semibold">{job.vehicle?.name || '-'}</td>
                                                        <td>{job.client?.name || '-'}</td>
                                                        <td>{job.location || '-'}</td>
                                                        <td>
                                                            {job.job_type === 'jcb'
                                                                ? `${Number(job.total_hours || 0).toFixed(2)}h`
                                                                : (job.rate_type || '').replace('_', ' ')}
                                                        </td>
                                                        <td className="font-semibold">{formatCurrency(job.total_amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end gap-6 text-sm pt-2 border-t mt-2">
                                        <span>JCB: <strong>{formatCurrency(day.jcb_total)}</strong></span>
                                        <span>Lorry: <strong>{formatCurrency(day.lorry_total)}</strong></span>
                                        <span>Total: <strong className="text-green-600">{formatCurrency(day.daily_total)}</strong></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {data.daily_summary.data.length === 0 && (
                        <div className="panel text-center text-gray-500 py-8">
                            No jobs found for the selected date range.
                        </div>
                    )}

                    {/* Pagination for dates */}
                    <Pagination currentPage={data.daily_summary.current_page} lastPage={data.daily_summary.last_page} onPageChange={handlePageChange} />
                </div>
            )}
        </div>
    );
};

export default DailyJobSummary;
