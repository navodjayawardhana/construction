import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Vehicle } from '../../types';
import { VehicleReportData } from '../../types/reports';
import { getVehicles } from '../../services/vehicleService';
import { getVehicleReport, exportVehicleReport } from '../../services/reportService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/shared/StatusBadge';

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

const VehicleReport = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleId, setVehicleId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<VehicleReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [jcbPage, setJcbPage] = useState(1);
    const [lorryPage, setLorryPage] = useState(1);
    const [expensePage, setExpensePage] = useState(1);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await getVehicles({ page: 1 });
            setVehicles((response.data as any).data || []);
        } catch {
            toast.error('Failed to load vehicles');
        }
    };

    const fetchReport = async (jcb = jcbPage, lorry = lorryPage, expense = expensePage) => {
        if (!vehicleId || !dateFrom || !dateTo) return;
        setLoading(true);
        try {
            const response = await getVehicleReport({
                vehicle_id: vehicleId,
                date_from: dateFrom,
                date_to: dateTo,
                jcb_page: jcb,
                lorry_page: lorry,
                expense_page: expense,
            });
            setData(response.data);
        } catch {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        if (!vehicleId || !dateFrom || !dateTo) {
            toast.error('Please select vehicle and date range');
            return;
        }
        setJcbPage(1);
        setLorryPage(1);
        setExpensePage(1);
        fetchReport(1, 1, 1);
    };

    const handleJcbPageChange = (page: number) => {
        setJcbPage(page);
        fetchReport(page, lorryPage, expensePage);
    };

    const handleLorryPageChange = (page: number) => {
        setLorryPage(page);
        fetchReport(jcbPage, page, expensePage);
    };

    const handleExpensePageChange = (page: number) => {
        setExpensePage(page);
        fetchReport(jcbPage, lorryPage, page);
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!vehicleId || !dateFrom || !dateTo) return;
        try {
            await exportVehicleReport({ vehicle_id: vehicleId, date_from: dateFrom, date_to: dateTo, format });
            toast.success(`${format.toUpperCase()} downloaded successfully`);
        } catch {
            toast.error(`Failed to export ${format.toUpperCase()}`);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const categoryLabels: Record<string, string> = {
        fuel: 'Fuel', repair: 'Repair', maintenance: 'Maintenance',
        insurance: 'Insurance', tire: 'Tire', other: 'Other',
    };

    return (
        <div>
            <PageHeader
                title="Vehicle Report"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Reports', path: '/reports' },
                    { label: 'Vehicle Report' },
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="label">Vehicle <span className="text-danger">*</span></label>
                        <select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                            <option value="">Select Vehicle</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}{v.registration_number ? ` (${v.registration_number})` : ''}</option>
                            ))}
                        </select>
                    </div>
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
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="panel bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.summary.total_revenue)}</p>
                            <p className="text-xs text-gray-400 mt-1">JCB: {formatCurrency(data.summary.total_jcb_revenue)} | Lorry: {formatCurrency(data.summary.total_lorry_revenue)}</p>
                        </div>
                        <div className="panel bg-red-50 dark:bg-red-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.summary.total_expenses)}</p>
                        </div>
                        <div className={`panel ${data.summary.net_income >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Net Income</p>
                            <p className={`text-2xl font-bold ${data.summary.net_income >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(data.summary.net_income)}
                            </p>
                        </div>
                    </div>

                    {/* JCB Jobs */}
                    {data.jcb_jobs.total > 0 && (
                        <div className="panel">
                            <h3 className="text-lg font-bold mb-4">JCB Jobs ({data.jcb_jobs.total})</h3>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Client</th>
                                            <th>Location</th>
                                            <th>Hours</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.jcb_jobs.data.map((job) => (
                                            <tr key={job.id}>
                                                <td>{formatDate(job.job_date)}</td>
                                                <td>{job.client?.name || '-'}</td>
                                                <td>{job.location || '-'}</td>
                                                <td>{job.total_hours}</td>
                                                <td>{formatCurrency(job.rate_amount)}</td>
                                                <td className="font-semibold">{formatCurrency(job.total_amount)}</td>
                                                <td><StatusBadge status={job.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td colSpan={5} className="text-right">JCB Total:</td>
                                            <td>{formatCurrency(data.summary.total_jcb_revenue)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <Pagination currentPage={data.jcb_jobs.current_page} lastPage={data.jcb_jobs.last_page} onPageChange={handleJcbPageChange} />
                        </div>
                    )}

                    {/* Lorry Jobs */}
                    {data.lorry_jobs.total > 0 && (
                        <div className="panel">
                            <h3 className="text-lg font-bold mb-4">Lorry Jobs ({data.lorry_jobs.total})</h3>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Client</th>
                                            <th>Location</th>
                                            <th>Rate Type</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.lorry_jobs.data.map((job) => (
                                            <tr key={job.id}>
                                                <td>{formatDate(job.job_date)}</td>
                                                <td>{job.client?.name || '-'}</td>
                                                <td>{job.location || '-'}</td>
                                                <td className="capitalize">{job.rate_type.replace('_', ' ')}</td>
                                                <td>{formatCurrency(job.rate_amount)}</td>
                                                <td className="font-semibold">{formatCurrency(job.total_amount)}</td>
                                                <td><StatusBadge status={job.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td colSpan={5} className="text-right">Lorry Total:</td>
                                            <td>{formatCurrency(data.summary.total_lorry_revenue)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <Pagination currentPage={data.lorry_jobs.current_page} lastPage={data.lorry_jobs.last_page} onPageChange={handleLorryPageChange} />
                        </div>
                    )}

                    {/* Expenses */}
                    {data.expenses.total > 0 && (
                        <div className="panel">
                            <h3 className="text-lg font-bold mb-4">Expenses ({data.expenses.total})</h3>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.expenses.data.map((exp) => (
                                            <tr key={exp.id}>
                                                <td>{formatDate(exp.expense_date)}</td>
                                                <td>{categoryLabels[exp.category] || exp.category}</td>
                                                <td>{exp.description || '-'}</td>
                                                <td className="font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td colSpan={3} className="text-right">Total Expenses:</td>
                                            <td className="text-red-600">{formatCurrency(data.summary.total_expenses)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <Pagination currentPage={data.expenses.current_page} lastPage={data.expenses.last_page} onPageChange={handleExpensePageChange} />
                            {/* Expense by Category */}
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm font-semibold mb-2">Expenses by Category</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(data.summary.expenses_by_category || {}).map(([cat, amount]) => (
                                        <div key={cat} className="flex justify-between text-sm">
                                            <span className="text-gray-500">{categoryLabels[cat] || cat}:</span>
                                            <span className="font-semibold">{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleReport;
