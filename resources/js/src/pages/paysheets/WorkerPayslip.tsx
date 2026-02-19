import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PayslipData } from '../../types/reports';
import { Worker } from '../../types';
import { getWorkerPayslip } from '../../services/reportService';
import { getWorkers } from '../../services/workerService';
import '../../styles/print.css';

const WorkerPayslip = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [workerId, setWorkerId] = useState(id || '');
    const [periodFrom, setPeriodFrom] = useState(searchParams.get('period_from') || '');
    const [periodTo, setPeriodTo] = useState(searchParams.get('period_to') || '');
    const [data, setData] = useState<PayslipData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWorkers();
    }, []);

    useEffect(() => {
        if (workerId && periodFrom && periodTo) {
            handleGenerate();
        }
    }, []);

    const fetchWorkers = async () => {
        try {
            const response = await getWorkers({ page: 1 });
            setWorkers((response.data as any).data || []);
        } catch {
            toast.error('Failed to load workers');
        }
    };

    const handleGenerate = async () => {
        if (!workerId || !periodFrom || !periodTo) {
            toast.error('Please select worker and period');
            return;
        }
        setLoading(true);
        try {
            const response = await getWorkerPayslip(workerId, { period_from: periodFrom, period_to: periodTo });
            setData(response.data);
        } catch {
            toast.error('Failed to generate payslip');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatDateShort = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Controls */}
            <div className="no-print mb-6 max-w-[210mm] mx-auto">
                <h2 className="text-xl font-bold mb-4">Worker Payslip</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-white p-4 rounded shadow">
                    <div>
                        <label className="block text-sm font-medium mb-1">Worker</label>
                        <select className="form-select" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
                            <option value="">Select Worker</option>
                            {workers.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Period From</label>
                        <input type="date" className="form-input" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Period To</label>
                        <input type="date" className="form-input" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} className="btn btn-primary flex-1" disabled={loading}>
                            {loading ? 'Loading...' : 'Generate'}
                        </button>
                        {data && (
                            <button onClick={() => window.print()} className="btn btn-success">Print</button>
                        )}
                    </div>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-outline-dark mt-3">Back</button>
            </div>

            {/* A4 Payslip */}
            {data && (
                <div className="print-content bg-white max-w-[210mm] mx-auto p-10 shadow-lg" style={{ minHeight: '297mm' }}>
                    {/* Header */}
                    <div className="print-header border-b-2 border-gray-800 pb-4 mb-6">
                        <h1 className="text-2xl font-bold tracking-wide">CONSTRUCTION COMPANY</h1>
                        <p className="text-sm text-gray-500 mt-1">Building Excellence Since Day One</p>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800">SALARY PAYSLIP</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Period: {formatDate(data.period_from)} to {formatDate(data.period_to)}
                        </p>
                    </div>

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="border border-gray-300 rounded p-4">
                            <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Employee Details</h3>
                            <div className="space-y-1">
                                <p className="font-bold text-base">{data.worker.name}</p>
                                {data.worker.nic && <p className="text-sm text-gray-600">NIC: {data.worker.nic}</p>}
                                {data.worker.role && <p className="text-sm text-gray-600">Role: {data.worker.role}</p>}
                                {data.worker.phone && <p className="text-sm text-gray-600">Phone: {data.worker.phone}</p>}
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded p-4">
                            <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Salary Information</h3>
                            <div className="space-y-1">
                                <p className="text-sm">Type: <span className="font-semibold capitalize">{data.worker.salary_type}</span></p>
                                {data.worker.salary_type === 'daily' ? (
                                    <p className="text-sm">Daily Rate: <span className="font-semibold">{formatCurrency(data.worker.daily_rate || 0)}</span></p>
                                ) : (
                                    <p className="text-sm">Monthly Salary: <span className="font-semibold">{formatCurrency(data.worker.monthly_salary || 0)}</span></p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attendance Summary Table */}
                    <h3 className="font-bold text-sm uppercase text-gray-600 mb-2">Attendance Summary</h3>
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left text-sm">Category</th>
                                <th className="border border-gray-300 px-4 py-2 text-right text-sm w-32">Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2 text-sm">Present Days</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-right text-green-600 font-semibold">{data.attendance.present_days}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2 text-sm">Half Days</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-right text-amber-600 font-semibold">{data.attendance.half_days}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2 text-sm">Absent Days</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-right text-red-600 font-semibold">{data.attendance.absent_days}</td>
                            </tr>
                            <tr className="bg-gray-50 font-bold">
                                <td className="border border-gray-300 px-4 py-2 text-sm">Total Worked Days</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-right">{data.attendance.worked_days}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Salary Calculation */}
                    <h3 className="font-bold text-sm uppercase text-gray-600 mb-2">Salary Calculation</h3>
                    <table className="w-full mb-6">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left text-sm">Description</th>
                                <th className="border border-gray-300 px-4 py-2 text-right text-sm w-40">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.worker.salary_type === 'daily' ? (
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 text-sm">
                                        {data.attendance.worked_days} days x {formatCurrency(data.worker.daily_rate || 0)}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-semibold">{formatCurrency(data.salary.calculated_salary)}</td>
                                </tr>
                            ) : (
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 text-sm">Monthly Salary</td>
                                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-semibold">{formatCurrency(data.salary.calculated_salary)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Payments Made */}
                    {data.salary_payments.length > 0 && (
                        <>
                            <h3 className="font-bold text-sm uppercase text-gray-600 mb-2">Payments Made</h3>
                            <table className="w-full mb-6">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-4 py-2 text-left text-sm">#</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left text-sm">Date</th>
                                        <th className="border border-gray-300 px-4 py-2 text-right text-sm">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.salary_payments.map((p, i) => (
                                        <tr key={p.id}>
                                            <td className="border border-gray-300 px-4 py-2 text-sm">{i + 1}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-sm">{formatDateShort(p.payment_date)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-sm text-right">{formatCurrency(p.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold bg-gray-50">
                                        <td colSpan={2} className="border border-gray-300 px-4 py-2 text-sm text-right">Total Paid:</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-right text-green-600">{formatCurrency(data.salary.total_paid)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </>
                    )}

                    {/* Balance Summary */}
                    <div className="flex justify-end mb-8">
                        <div className="w-80 border-t-2 border-gray-800">
                            <div className="flex justify-between py-2 text-sm">
                                <span>Calculated Salary:</span>
                                <span className="font-semibold">{formatCurrency(data.salary.calculated_salary)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm border-b">
                                <span>Total Paid:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(data.salary.total_paid)}</span>
                            </div>
                            <div className="flex justify-between py-3 text-lg font-bold">
                                <span>BALANCE DUE</span>
                                <span className={data.salary.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {formatCurrency(data.salary.balance)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8">
                        <div className="grid grid-cols-2 gap-16 mt-16">
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 text-sm">Employee Signature</div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 text-sm">Authorized Signature</div>
                            </div>
                        </div>
                        <div className="print-footer text-center mt-8 text-xs text-gray-400">
                            <p>This is a computer-generated payslip.</p>
                            <p className="mt-1">Printed on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerPayslip;
