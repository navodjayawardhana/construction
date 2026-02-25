import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getVehicleExpenseSummary, VehicleExpenseSummary } from '../../services/vehicleExpenseService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const ExpenseList = () => {
    const navigate = useNavigate();
    const [vehicleSummaries, setVehicleSummaries] = useState<VehicleExpenseSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchVehicleSummaries = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await getVehicleExpenseSummary({ page, per_page: 12 });
            const paginated = response.data;
            setVehicleSummaries(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch vehicle expenses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicleSummaries(currentPage);
    }, [currentPage, fetchVehicleSummaries]);

    const formatAmount = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const grandTotal = vehicleSummaries.reduce((sum, v) => sum + Number(v.total_amount), 0);

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

            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="panel mb-5">
                        <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-lg dark:text-white-light">All Vehicles</h5>
                            <div className="text-lg font-bold text-primary">
                                Page Total: {formatAmount(grandTotal)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {vehicleSummaries.map((item) => (
                            <div
                                key={item.vehicle_id}
                                className="panel cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-primary"
                                onClick={() => navigate(`/expenses/vehicle/${item.vehicle_id}`)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h6 className="font-semibold text-base dark:text-white-light">
                                        {item.vehicle?.name || 'Unknown Vehicle'}
                                    </h6>
                                    <span className="badge bg-primary/10 text-primary text-xs">
                                        {item.vehicle?.type?.toUpperCase()}
                                    </span>
                                </div>
                                {item.vehicle?.registration_number && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        {item.vehicle.registration_number}
                                    </p>
                                )}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
                                        <p className="text-lg font-bold text-danger">{formatAmount(Number(item.total_amount))}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Records</p>
                                        <p className="text-lg font-semibold dark:text-white-light">{item.expense_count}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
                                    <span className="text-sm text-primary hover:underline">View Details →</span>
                                </div>
                            </div>
                        ))}

                        {vehicleSummaries.length === 0 && (
                            <div className="col-span-full panel text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">No expenses recorded yet.</p>
                                <Link to="/expenses/create" className="btn btn-primary mt-3">
                                    Add First Expense
                                </Link>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-5">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {vehicleSummaries.length} of {total} vehicles
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ExpenseList;
