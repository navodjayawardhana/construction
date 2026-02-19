import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { VehicleExpense, Vehicle } from '../../types';
import { getExpense, createExpense, updateExpense } from '../../services/vehicleExpenseService';
import { getVehicles } from '../../services/vehicleService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const CATEGORIES = [
    { value: 'fuel', label: 'Fuel' },
    { value: 'repair', label: 'Repair' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'tire', label: 'Tire' },
    { value: 'other', label: 'Other' },
];

const ExpenseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        category: '',
        amount: '',
        expense_date: '',
        description: '',
    });

    useEffect(() => {
        fetchVehicles();
        if (isEdit && id) {
            fetchExpense(id);
        }
    }, [id, isEdit]);

    const fetchVehicles = async () => {
        try {
            const response = await getVehicles({ per_page: 100 } as any);
            setVehicles(response.data.data as any);
        } catch (error) {
            toast.error('Failed to fetch vehicles');
        }
    };

    const fetchExpense = async (expenseId: string) => {
        setLoading(true);
        try {
            const response = await getExpense(expenseId);
            const expense: VehicleExpense = response.data as any;
            setFormData({
                vehicle_id: expense.vehicle_id || '',
                category: expense.category || '',
                amount: String(expense.amount) || '',
                expense_date: expense.expense_date || '',
                description: expense.description || '',
            });
        } catch (error) {
            toast.error('Failed to fetch expense details');
            navigate('/expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...formData,
            vehicle_id: formData.vehicle_id,
            amount: Number(formData.amount),
        };

        try {
            if (isEdit && id) {
                await updateExpense(id, payload);
                toast.success('Expense updated successfully');
            } else {
                await createExpense(payload);
                toast.success('Expense created successfully');
            }
            navigate('/expenses');
        } catch (error: any) {
            const message = error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} expense`;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <PageHeader
                title={isEdit ? 'Edit Expense' : 'Add Expense'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Expenses', path: '/expenses' },
                    { label: isEdit ? 'Edit' : 'Add' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="vehicle_id" className="label">
                                Vehicle <span className="text-danger">*</span>
                            </label>
                            <select
                                id="vehicle_id"
                                name="vehicle_id"
                                className="form-select"
                                value={formData.vehicle_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Vehicle</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="category" className="label">
                                Category <span className="text-danger">*</span>
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="form-select"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="amount" className="label">
                                Amount <span className="text-danger">*</span>
                            </label>
                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                placeholder="Enter amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="expense_date" className="label">
                                Date <span className="text-danger">*</span>
                            </label>
                            <input
                                id="expense_date"
                                name="expense_date"
                                type="date"
                                className="form-input"
                                value={formData.expense_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="label">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-input"
                            placeholder="Enter description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Update Expense' : 'Create Expense'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => navigate('/expenses')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;
