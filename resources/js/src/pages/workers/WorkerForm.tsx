import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Worker } from '../../types';
import { getWorker, createWorker, updateWorker } from '../../services/workerService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const WorkerForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        nic: '',
        address: '',
        role: '',
        salary_type: 'daily' as 'daily' | 'monthly',
        daily_rate: '',
        monthly_salary: '',
        is_active: true,
    });

    useEffect(() => {
        if (isEdit && id) {
            fetchWorker(id);
        }
    }, [id, isEdit]);

    const fetchWorker = async (workerId: string) => {
        setLoading(true);
        try {
            const response = await getWorker(workerId);
            const worker: Worker = response.data;
            setFormData({
                name: worker.name || '',
                phone: worker.phone || '',
                nic: worker.nic || '',
                address: worker.address || '',
                role: worker.role || '',
                salary_type: worker.salary_type || 'daily',
                daily_rate: worker.daily_rate ? String(worker.daily_rate) : '',
                monthly_salary: worker.monthly_salary ? String(worker.monthly_salary) : '',
                is_active: worker.is_active,
            });
        } catch (error) {
            toast.error('Failed to fetch worker details');
            navigate('/workers');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                name: formData.name,
                phone: formData.phone || undefined,
                nic: formData.nic || undefined,
                address: formData.address || undefined,
                role: formData.role || undefined,
                salary_type: formData.salary_type,
                is_active: formData.is_active,
            };

            if (formData.salary_type === 'daily') {
                payload.daily_rate = formData.daily_rate ? Number(formData.daily_rate) : undefined;
                payload.monthly_salary = undefined;
            } else {
                payload.monthly_salary = formData.monthly_salary ? Number(formData.monthly_salary) : undefined;
                payload.daily_rate = undefined;
            }

            if (isEdit && id) {
                await updateWorker(id, payload);
                toast.success('Worker updated successfully');
            } else {
                await createWorker(payload);
                toast.success('Worker created successfully');
            }
            navigate('/workers');
        } catch (error: any) {
            const message = error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} worker`;
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
                title={isEdit ? 'Edit Worker' : 'Add Worker'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Workers', path: '/workers' },
                    { label: isEdit ? 'Edit' : 'Add' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="name" className="label">
                                Name <span className="text-danger">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="Enter worker name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="label">
                                Phone
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                className="form-input"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="nic" className="label">
                                NIC
                            </label>
                            <input
                                id="nic"
                                name="nic"
                                type="text"
                                className="form-input"
                                placeholder="Enter NIC number"
                                value={formData.nic}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="label">
                                Role
                            </label>
                            <input
                                id="role"
                                name="role"
                                type="text"
                                className="form-input"
                                placeholder="Enter role (e.g. Driver, Operator)"
                                value={formData.role}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="salary_type" className="label">
                                Salary Type <span className="text-danger">*</span>
                            </label>
                            <select
                                id="salary_type"
                                name="salary_type"
                                className="form-select"
                                value={formData.salary_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        {formData.salary_type === 'daily' && (
                            <div>
                                <label htmlFor="daily_rate" className="label">
                                    Daily Rate (Rs.)
                                </label>
                                <input
                                    id="daily_rate"
                                    name="daily_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    placeholder="Enter daily rate"
                                    value={formData.daily_rate}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {formData.salary_type === 'monthly' && (
                            <div>
                                <label htmlFor="monthly_salary" className="label">
                                    Monthly Salary (Rs.)
                                </label>
                                <input
                                    id="monthly_salary"
                                    name="monthly_salary"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    placeholder="Enter monthly salary"
                                    value={formData.monthly_salary}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="address" className="label">
                            Address
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            className="form-input"
                            placeholder="Enter address"
                            rows={3}
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                className="form-checkbox"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            <span className="ml-2 text-dark dark:text-white-light">Active</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Update Worker' : 'Create Worker'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => navigate('/workers')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkerForm;
