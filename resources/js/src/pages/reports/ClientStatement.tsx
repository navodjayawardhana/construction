import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Client } from '../../types';
import { ClientStatementData } from '../../types/reports';
import { getClients } from '../../services/clientService';
import { getClientStatement, exportClientStatement } from '../../services/reportService';
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

const ClientStatement = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [clientId, setClientId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<ClientStatementData | null>(null);
    const [loading, setLoading] = useState(false);
    const [jcbPage, setJcbPage] = useState(1);
    const [lorryPage, setLorryPage] = useState(1);
    const [paymentPage, setPaymentPage] = useState(1);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await getClients({ page: 1 });
            setClients((response.data as any).data || []);
        } catch {
            toast.error('Failed to load clients');
        }
    };

    const fetchReport = async (jcb = jcbPage, lorry = lorryPage, payment = paymentPage) => {
        if (!clientId || !dateFrom || !dateTo) return;
        setLoading(true);
        try {
            const response = await getClientStatement({
                client_id: clientId,
                date_from: dateFrom,
                date_to: dateTo,
                jcb_page: jcb,
                lorry_page: lorry,
                payment_page: payment,
            });
            setData(response.data);
        } catch {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        if (!clientId || !dateFrom || !dateTo) {
            toast.error('Please select client and date range');
            return;
        }
        setJcbPage(1);
        setLorryPage(1);
        setPaymentPage(1);
        fetchReport(1, 1, 1);
    };

    const handleJcbPageChange = (page: number) => {
        setJcbPage(page);
        fetchReport(page, lorryPage, paymentPage);
    };

    const handleLorryPageChange = (page: number) => {
        setLorryPage(page);
        fetchReport(jcbPage, page, paymentPage);
    };

    const handlePaymentPageChange = (page: number) => {
        setPaymentPage(page);
        fetchReport(jcbPage, lorryPage, page);
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!clientId || !dateFrom || !dateTo) return;
        try {
            await exportClientStatement({ client_id: clientId, date_from: dateFrom, date_to: dateTo, format });
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

    return (
        <div>
            <PageHeader
                title="Client Statement"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Reports', path: '/reports' },
                    { label: 'Client Statement' },
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
                            <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                                Print
                            </button>
                        </div>
                    ) : undefined
                }
            />

            {/* Filters */}
            <div className="panel mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="label">Client <span className="text-danger">*</span></label>
                        <select className="form-select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                            <option value="">Select Client</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` - ${c.company_name}` : ''}</option>
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
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="panel bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs Amount</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.summary.total_jobs_amount)}</p>
                            <p className="text-xs text-gray-400 mt-1">JCB: {formatCurrency(data.summary.total_jcb_amount)} | Lorry: {formatCurrency(data.summary.total_lorry_amount)}</p>
                        </div>
                        <div className="panel bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.summary.total_payments)}</p>
                        </div>
                        <div className={`panel ${data.summary.outstanding_balance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
                            <p className={`text-2xl font-bold ${data.summary.outstanding_balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {formatCurrency(data.summary.outstanding_balance)}
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
                                            <th>Vehicle</th>
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
                                                <td className="font-semibold text-yellow-600">{job.vehicle?.name || '-'}</td>
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
                                            <td>{formatCurrency(data.summary.total_jcb_amount)}</td>
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
                                            <th>Vehicle</th>
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
                                                <td className="font-semibold text-yellow-600">{job.vehicle?.name || '-'}</td>
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
                                            <td>{formatCurrency(data.summary.total_lorry_amount)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <Pagination currentPage={data.lorry_jobs.current_page} lastPage={data.lorry_jobs.last_page} onPageChange={handleLorryPageChange} />
                        </div>
                    )}

                    {/* Payments */}
                    {data.payments.total > 0 && (
                        <div className="panel">
                            <h3 className="text-lg font-bold mb-4">Payments ({data.payments.total})</h3>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Method</th>
                                            <th>Notes</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.payments.data.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>{formatDate(payment.payment_date)}</td>
                                                <td className="capitalize">{payment.payment_method.replace('_', ' ')}</td>
                                                <td>{payment.notes || '-'}</td>
                                                <td className="font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold">
                                            <td colSpan={3} className="text-right">Total Payments:</td>
                                            <td className="text-green-600">{formatCurrency(data.summary.total_payments)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <Pagination currentPage={data.payments.current_page} lastPage={data.payments.last_page} onPageChange={handlePaymentPageChange} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientStatement;
