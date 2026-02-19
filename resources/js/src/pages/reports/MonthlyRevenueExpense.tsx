import { useState } from 'react';
import toast from 'react-hot-toast';
import { MonthlyRevenueExpenseData } from '../../types/reports';
import { getMonthlyRevenueExpense, exportMonthlyRevenueExpense } from '../../services/reportService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const MonthlyRevenueExpense = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<MonthlyRevenueExpenseData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await getMonthlyRevenueExpense({ month, year });
            setData(response.data);
        } catch {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        try {
            await exportMonthlyRevenueExpense({ month, year, format });
            toast.success(`${format.toUpperCase()} downloaded successfully`);
        } catch {
            toast.error(`Failed to export ${format.toUpperCase()}`);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const categoryLabels: Record<string, string> = {
        fuel: 'Fuel',
        repair: 'Repair',
        maintenance: 'Maintenance',
        insurance: 'Insurance',
        tire: 'Tire',
        other: 'Other',
    };

    const rateTypeLabels: Record<string, string> = {
        per_trip: 'Per Trip',
        per_km: 'Per KM',
        per_day: 'Per Day',
    };

    return (
        <div>
            <PageHeader
                title="Monthly Revenue & Expense"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Reports', path: '/reports' },
                    { label: 'Monthly Revenue & Expense' },
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
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.revenue.total)}</p>
                        </div>
                        <div className="panel bg-red-50 dark:bg-red-900/20">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.expenses.total)}</p>
                        </div>
                        <div className={`panel ${data.profit_loss >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Profit / Loss</p>
                            <p className={`text-2xl font-bold ${data.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(data.profit_loss)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Breakdown */}
                        <div className="panel">
                            <h3 className="text-lg font-bold mb-4 text-green-600 dark:text-green-400">Revenue Breakdown</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">JCB Jobs ({data.revenue.jcb_count})</span>
                                    <span className="font-semibold">{formatCurrency(data.revenue.jcb_total)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Lorry Jobs ({data.revenue.lorry_count})</span>
                                    <span className="font-semibold">{formatCurrency(data.revenue.lorry_total)}</span>
                                </div>
                                {Object.entries(data.revenue.lorry_by_type || {}).map(([type, amount]) => (
                                    <div key={type} className="flex justify-between pl-6 text-sm">
                                        <span className="text-gray-400">{rateTypeLabels[type] || type}</span>
                                        <span>{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2 border-t-2 font-bold text-green-600 dark:text-green-400">
                                    <span>Total Revenue</span>
                                    <span>{formatCurrency(data.revenue.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expense Breakdown */}
                        <div className="panel">
                            <h3 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">Expense Breakdown</h3>
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Vehicle Expenses</p>
                                {Object.entries(data.expenses.vehicle_expenses_by_category || {}).map(([cat, amount]) => (
                                    <div key={cat} className="flex justify-between border-b pb-2 pl-4">
                                        <span className="text-gray-500 dark:text-gray-400">{categoryLabels[cat] || cat}</span>
                                        <span className="font-semibold">{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Vehicle Expenses Subtotal</span>
                                    <span className="font-semibold">{formatCurrency(data.expenses.total_vehicle_expenses)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Salary Payments ({data.expenses.salary_payments_count})</span>
                                    <span className="font-semibold">{formatCurrency(data.expenses.total_salary_payments)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t-2 font-bold text-red-600 dark:text-red-400">
                                    <span>Total Expenses</span>
                                    <span>{formatCurrency(data.expenses.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyRevenueExpense;
