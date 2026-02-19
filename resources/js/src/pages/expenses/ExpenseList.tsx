import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { VehicleExpense, Vehicle, PaginatedResponse } from '../../types';
import { getExpenses, deleteExpense } from '../../services/vehicleExpenseService';
import { getVehicles } from '../../services/vehicleService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';

const CATEGORIES = ['fuel', 'repair', 'maintenance', 'insurance', 'tire', 'other'];

const ExpenseList = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [vehicleId, setVehicleId] = useState<string>('');
    const [category, setCategory] = useState<string>('');

    const fetchVehicles = async () => {
        try {
            const response = await getVehicles({ per_page: 100 } as any);
            setVehicles(response.data.data as any);
        } catch (error) {
            toast.error('Failed to fetch vehicles');
        }
    };

    const fetchExpenses = useCallback(async (page: number, searchTerm: string) => {
        setLoading(true);
        try {
            const params: any = { page, search: searchTerm || undefined };
            if (vehicleId) params.vehicle_id = vehicleId;
            if (category) params.category = category;
            const response = await getExpenses(params);
            const paginated: PaginatedResponse<VehicleExpense> = response.data as any;
            setExpenses(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    }, [vehicleId, category]);

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        fetchExpenses(currentPage, search);
    }, [currentPage, search, fetchExpenses]);

    useEffect(() => {
        setCurrentPage(1);
    }, [vehicleId, category]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
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
                await deleteExpense(id);
                toast.success('Expense deleted successfully');
                fetchExpenses(currentPage, search);
            } catch (error) {
                toast.error('Failed to delete expense');
            }
        }
    };

    const capitalize = (str: string) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const formatAmount = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const columns = [
        { key: 'expense_date', label: 'Date', sortable: true },
        {
            key: 'vehicle.name',
            label: 'Vehicle',
            render: (expense: VehicleExpense) => expense.vehicle?.name || '-',
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

    return (
        <div>
            <PageHeader
                title="Vehicle Expenses"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Expenses' },
                ]}
                action={
                    <Link to="/expenses/create" className="btn btn-primary">
                        Add Expense
                    </Link>
                }
            />

            <div className="panel">
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                    <div>
                        <select
                            className="form-select w-auto"
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                        >
                            <option value="">All Vehicles</option>
                            {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            className="form-select w-auto"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {capitalize(cat)}
                                </option>
                            ))}
                        </select>
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

export default ExpenseList;
