import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { SalaryPayment, Worker, PaginatedResponse } from '../../types';
import { getSalaryPayments, deleteSalaryPayment, calculateSalary, createSalaryPayment } from '../../services/salaryPaymentService';
import { getWorkers } from '../../services/workerService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';

const SalaryPaymentList = () => {
    const [payments, setPayments] = useState<SalaryPayment[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [workerFilter, setWorkerFilter] = useState('');

    // Calculate & Pay state
    const [showCalculateForm, setShowCalculateForm] = useState(false);
    const [calcWorkerId, setCalcWorkerId] = useState('');
    const [calcPeriodFrom, setCalcPeriodFrom] = useState('');
    const [calcPeriodTo, setCalcPeriodTo] = useState('');
    const [calculating, setCalculating] = useState(false);
    const [calcResult, setCalcResult] = useState<{ total_days: number; present_days: number; absent_days: number; total_salary: number } | null>(null);
    const [confirming, setConfirming] = useState(false);

    const fetchWorkers = useCallback(async () => {
        try {
            const response = await getWorkers({ per_page: 200 } as any);
            setWorkers(response.data.data as unknown as Worker[]);
        } catch (error) {
            toast.error('Failed to fetch workers');
        }
    }, []);

    const fetchPayments = useCallback(async (page: number, searchTerm: string) => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page,
                search: searchTerm || undefined,
            };
            if (workerFilter) {
                params.worker_id = workerFilter;
            }
            const response = await getSalaryPayments(params);
            const paginated: PaginatedResponse<SalaryPayment> = response.data as unknown as PaginatedResponse<SalaryPayment>;
            setPayments(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch salary payments');
        } finally {
            setLoading(false);
        }
    }, [workerFilter]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    useEffect(() => {
        fetchPayments(currentPage, search);
    }, [currentPage, search, fetchPayments]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleWorkerFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setWorkerFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await deleteSalaryPayment(id);
                toast.success('Salary payment deleted successfully');
                fetchPayments(currentPage, search);
            } catch (error) {
                toast.error('Failed to delete salary payment');
            }
        }
    };

    const handleCalculate = async () => {
        if (!calcWorkerId || !calcPeriodFrom || !calcPeriodTo) {
            toast.error('Please select a worker and specify the period');
            return;
        }

        setCalculating(true);
        setCalcResult(null);
        try {
            const response = await calculateSalary({
                worker_id: calcWorkerId,
                month: calcPeriodFrom,
                period_from: calcPeriodFrom,
                period_to: calcPeriodTo,
            } as any);
            setCalcResult(response.data);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to calculate salary';
            toast.error(message);
        } finally {
            setCalculating(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!calcResult || !calcWorkerId) return;

        setConfirming(true);
        try {
            await createSalaryPayment({
                worker_id: calcWorkerId,
                amount: calcResult.total_salary,
                payment_date: new Date().toISOString().split('T')[0],
                period_from: calcPeriodFrom,
                period_to: calcPeriodTo,
                worked_days: calcResult.present_days,
            } as any);
            toast.success('Salary payment created successfully');
            setShowCalculateForm(false);
            setCalcResult(null);
            setCalcWorkerId('');
            setCalcPeriodFrom('');
            setCalcPeriodTo('');
            fetchPayments(currentPage, search);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to create salary payment';
            toast.error(message);
        } finally {
            setConfirming(false);
        }
    };

    const columns = [
        {
            key: 'worker.name',
            label: 'Worker Name',
            render: (payment: SalaryPayment) => payment.worker?.name || '-',
        },
        {
            key: 'amount',
            label: 'Amount (Rs.)',
            render: (payment: SalaryPayment) => `Rs. ${Number(payment.amount).toLocaleString()}`,
        },
        {
            key: 'payment_date',
            label: 'Payment Date',
            sortable: true,
            render: (payment: SalaryPayment) => new Date(payment.payment_date).toLocaleDateString(),
        },
        {
            key: 'period',
            label: 'Period',
            render: (payment: SalaryPayment) =>
                `${new Date(payment.period_from).toLocaleDateString()} - ${new Date(payment.period_to).toLocaleDateString()}`,
        },
        {
            key: 'worked_days',
            label: 'Worked Days',
        },
    ];

    const actions = (payment: SalaryPayment) => (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(payment.id)}
            >
                Delete
            </button>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Salary Payments"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Workers', path: '/workers' },
                    { label: 'Salary Payments' },
                ]}
                action={
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowCalculateForm(!showCalculateForm)}
                    >
                        {showCalculateForm ? 'Close' : 'Calculate & Pay'}
                    </button>
                }
            />

            {showCalculateForm && (
                <div className="panel mb-5">
                    <h3 className="text-lg font-semibold mb-4 text-dark dark:text-white-light">
                        Calculate & Pay Salary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        <div>
                            <label htmlFor="calc-worker" className="label">
                                Worker <span className="text-danger">*</span>
                            </label>
                            <select
                                id="calc-worker"
                                className="form-select"
                                value={calcWorkerId}
                                onChange={(e) => {
                                    setCalcWorkerId(e.target.value);
                                    setCalcResult(null);
                                }}
                            >
                                <option value="">Select Worker</option>
                                {workers.map((worker) => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="calc-from" className="label">
                                Period From <span className="text-danger">*</span>
                            </label>
                            <input
                                id="calc-from"
                                type="date"
                                className="form-input"
                                value={calcPeriodFrom}
                                onChange={(e) => {
                                    setCalcPeriodFrom(e.target.value);
                                    setCalcResult(null);
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="calc-to" className="label">
                                Period To <span className="text-danger">*</span>
                            </label>
                            <input
                                id="calc-to"
                                type="date"
                                className="form-input"
                                value={calcPeriodTo}
                                onChange={(e) => {
                                    setCalcPeriodTo(e.target.value);
                                    setCalcResult(null);
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                        <button
                            type="button"
                            className="btn btn-info"
                            disabled={calculating}
                            onClick={handleCalculate}
                        >
                            {calculating ? 'Calculating...' : 'Calculate'}
                        </button>
                    </div>

                    {calcResult && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                            <h4 className="text-md font-semibold mb-3 text-dark dark:text-white-light">
                                Calculation Result
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Days</p>
                                    <p className="text-lg font-bold text-dark dark:text-white-light">
                                        {calcResult.total_days}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Worked Days</p>
                                    <p className="text-lg font-bold text-success">
                                        {calcResult.present_days}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Absent Days</p>
                                    <p className="text-lg font-bold text-danger">
                                        {calcResult.absent_days}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                                    <p className="text-lg font-bold text-primary">
                                        Rs. {Number(calcResult.total_salary).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-success"
                                disabled={confirming}
                                onClick={handleConfirmPayment}
                            >
                                {confirming ? 'Processing...' : 'Confirm & Create Payment'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="panel">
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                    <div>
                        <label htmlFor="workerFilter" className="label mr-2">
                            Filter by Worker
                        </label>
                        <select
                            id="workerFilter"
                            className="form-select w-auto"
                            value={workerFilter}
                            onChange={handleWorkerFilterChange}
                        >
                            <option value="">All Workers</option>
                            {workers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={payments as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    loading={loading}
                    actions={actions as any}
                    searchPlaceholder="Search salary payments..."
                />
            </div>
        </div>
    );
};

export default SalaryPaymentList;
