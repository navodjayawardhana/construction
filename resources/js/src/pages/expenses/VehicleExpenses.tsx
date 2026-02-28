import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReactApexChart from 'react-apexcharts';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { VehicleExpense, Vehicle, PaginatedResponse } from '../../types';
import { getExpenses, deleteExpense, getExpenseSummary, ExpenseSummaryItem } from '../../services/vehicleExpenseService';
import { getVehicle } from '../../services/vehicleService';
import { getExpenseCategories, ExpenseCategory } from '../../services/expenseCategoryService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const VehicleExpenses = () => {
    const { vehicleId } = useParams<{ vehicleId: string }>();
    const navigate = useNavigate();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
    const [summary, setSummary] = useState<ExpenseSummaryItem[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        if (vehicleId) {
            fetchVehicle(vehicleId);
        }
        fetchCategories();
    }, [vehicleId]);

    const fetchCategories = async () => {
        try {
            const response = await getExpenseCategories();
            setCategories(response.data);
        } catch {
            // silent
        }
    };

    const fetchVehicle = async (id: string) => {
        try {
            const response = await getVehicle(id);
            setVehicle(response.data as any);
        } catch {
            toast.error('Vehicle not found');
            navigate('/expenses');
        }
    };

    const fetchExpenses = useCallback(async (page: number, searchTerm: string) => {
        if (!vehicleId) return;
        setLoading(true);
        try {
            const params: any = { page, search: searchTerm || undefined, vehicle_id: vehicleId };
            if (category) params.category = category;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const response = await getExpenses(params);
            const paginated: PaginatedResponse<VehicleExpense> = response.data as any;
            setExpenses(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch {
            toast.error('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    }, [vehicleId, category, dateFrom, dateTo]);

    const fetchSummary = useCallback(async () => {
        if (!vehicleId) return;
        try {
            const params: any = { vehicle_id: vehicleId };
            if (category) params.category = category;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const response = await getExpenseSummary(params);
            setSummary(response.data);
        } catch {
            // silent
        }
    }, [vehicleId, category, dateFrom, dateTo]);

    useEffect(() => {
        fetchExpenses(currentPage, search);
    }, [currentPage, search, fetchExpenses]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        setCurrentPage(1);
    }, [category, dateFrom, dateTo]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleSearch = (value: string) => { setSearch(value); setCurrentPage(1); };

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
                await deleteExpense(id);
                toast.success('Expense deleted successfully');
                fetchExpenses(currentPage, search);
                fetchSummary();
            } catch {
                toast.error('Failed to delete expense');
            }
        }
    };

    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    const formatAmount = (amount: number) => `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const columns = [
        {
            key: 'expense_date',
            label: 'Date',
            sortable: true,
            render: (expense: VehicleExpense) =>
                expense.date_to ? `${expense.expense_date} → ${expense.date_to}` : expense.expense_date,
        },
        {
            key: 'category',
            label: 'Category',
            render: (expense: VehicleExpense) => capitalize(expense.category),
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (expense: VehicleExpense) => formatAmount(expense.amount),
        },
        { key: 'description', label: 'Description' },
    ];

    const actions = (expense: VehicleExpense) => (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(`/expenses/${expense.id}/edit`)}
            >
                Edit
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(expense.id)}
            >
                Delete
            </button>
        </div>
    );

    if (!vehicle && loading) return <LoadingSpinner />;

    return (
        <div>
            <PageHeader
                title={vehicle ? `${vehicle.name} - Expenses` : 'Vehicle Expenses'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Expenses', path: '/expenses' },
                    { label: vehicle?.name || 'Vehicle' },
                ]}
                action={
                    <Link to="/expenses/create" className="btn btn-primary">
                        Add Expense
                    </Link>
                }
            />

            {summary.length > 0 && (
                <div className="panel mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">Expense Breakdown by Category</h5>
                    <ReactApexChart
                        type="donut"
                        height={300}
                        series={summary.map((s) => Number(s.total))}
                        options={{
                            chart: { fontFamily: 'Nunito, sans-serif' },
                            labels: summary.map((s) => capitalize(s.category)),
                            colors: summary.map((s) => {
                                const cat = categories.find((c) => c.name.toLowerCase() === s.category.toLowerCase());
                                return cat?.color || '#6b7280';
                            }),
                            legend: {
                                position: 'bottom',
                                labels: { colors: isDark ? '#e0e6ed' : undefined },
                            },
                            plotOptions: {
                                pie: {
                                    donut: {
                                        size: '65%',
                                        labels: {
                                            show: true,
                                            total: {
                                                show: true,
                                                label: 'Total',
                                                formatter: (w: any) => {
                                                    const t = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                                    return `Rs. ${Number(t).toLocaleString('en-IN')}`;
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            dataLabels: { enabled: false },
                            tooltip: {
                                y: {
                                    formatter: (val: number) => `Rs. ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                                },
                            },
                            states: { hover: { filter: { type: 'none' } } },
                            stroke: { show: false },
                        }}
                    />
                </div>
            )}

            <div className="panel">
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                    <div>
                        <select
                            className="form-select w-auto"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="From"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="To"
                        />
                        {(dateFrom || dateTo) && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={expenses as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    loading={loading}
                    actions={actions as any}
                    searchPlaceholder="Search expenses..."
                />
            </div>
        </div>
    );
};

export default VehicleExpenses;
