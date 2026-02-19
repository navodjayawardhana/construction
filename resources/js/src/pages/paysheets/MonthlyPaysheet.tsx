import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MonthlyPaysheetData } from '../../types/reports';
import { getMonthlyPaysheet } from '../../services/reportService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const MonthlyPaysheet = () => {
    const navigate = useNavigate();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<MonthlyPaysheetData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await getMonthlyPaysheet({ month, year });
            setData(response.data);
        } catch {
            toast.error('Failed to generate paysheet');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div>
            <PageHeader
                title="Monthly Paysheet"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Reports', path: '/reports' },
                    { label: 'Monthly Paysheet' },
                ]}
                action={
                    data ? (
                        <button onClick={() => window.print()} className="btn btn-primary">Print</button>
                    ) : undefined
                }
            />

            {/* Filters */}
            <div className="panel mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Month</label>
                        <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Year</label>
                        <input type="number" className="form-input" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2000} />
                    </div>
                    <div>
                        <button onClick={handleGenerate} className="btn btn-primary w-full" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Paysheet'}
                        </button>
                    </div>
                </div>
            </div>

            {loading && <LoadingSpinner />}

            {data && !loading && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="panel bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Calculated Salary</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.grand_total.total_calculated)}</p>
                        </div>
                        <div className="panel bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.grand_total.total_paid)}</p>
                        </div>
                        <div className={`panel ${data.grand_total.total_balance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
                            <p className={`text-2xl font-bold ${data.grand_total.total_balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {formatCurrency(data.grand_total.total_balance)}
                            </p>
                        </div>
                    </div>

                    {/* Workers Table */}
                    <div className="panel">
                        <h3 className="text-lg font-bold mb-4">
                            {months[month - 1]} {year} - Worker Paysheet ({data.workers.length} workers)
                        </h3>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Worker</th>
                                        <th>Role</th>
                                        <th>Type</th>
                                        <th>Present</th>
                                        <th>Half</th>
                                        <th>Absent</th>
                                        <th>Worked</th>
                                        <th>Salary</th>
                                        <th>Paid</th>
                                        <th>Balance</th>
                                        <th className="no-print">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.workers.map((item, index) => (
                                        <tr key={item.worker.id}>
                                            <td>{index + 1}</td>
                                            <td className="font-semibold">{item.worker.name}</td>
                                            <td>{item.worker.role || '-'}</td>
                                            <td className="capitalize">{item.worker.salary_type}</td>
                                            <td className="text-green-600">{item.present_days}</td>
                                            <td className="text-amber-600">{item.half_days}</td>
                                            <td className="text-red-600">{item.absent_days}</td>
                                            <td className="font-semibold">{item.worked_days}</td>
                                            <td className="font-semibold">{formatCurrency(item.calculated_salary)}</td>
                                            <td className="text-green-600">{formatCurrency(item.total_paid)}</td>
                                            <td className={`font-semibold ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(item.balance)}
                                            </td>
                                            <td className="no-print">
                                                <button
                                                    onClick={() => navigate(`/paysheets/worker/${item.worker.id}?period_from=${year}-${String(month).padStart(2, '0')}-01&period_to=${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`)}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    Payslip
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold text-lg">
                                        <td colSpan={8} className="text-right">Grand Total:</td>
                                        <td>{formatCurrency(data.grand_total.total_calculated)}</td>
                                        <td className="text-green-600">{formatCurrency(data.grand_total.total_paid)}</td>
                                        <td className={data.grand_total.total_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                                            {formatCurrency(data.grand_total.total_balance)}
                                        </td>
                                        <td className="no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyPaysheet;
