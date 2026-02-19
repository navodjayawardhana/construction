import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { JcbJob, Vehicle, Client, Worker } from '../../types';
import { getJcbJob, createJcbJob, updateJcbJob } from '../../services/jcbJobService';
import { getVehicles } from '../../services/vehicleService';
import { getClients } from '../../services/clientService';
import { getWorkers } from '../../services/workerService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface FormData {
    vehicle_id: string;
    client_id: string;
    worker_id: string;
    job_date: string;
    start_meter: string;
    end_meter: string;
    total_hours: string;
    rate_type: 'hourly' | 'daily';
    rate_amount: string;
    location: string;
    notes: string;
}

const initialFormData: FormData = {
    vehicle_id: '',
    client_id: '',
    worker_id: '',
    job_date: '',
    start_meter: '',
    end_meter: '',
    total_hours: '',
    rate_type: 'hourly',
    rate_amount: '',
    location: '',
    notes: '',
};

const JcbJobForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [vehiclesRes, clientsRes, workersRes] = await Promise.all([
                    getVehicles({ type: 'jcb', per_page: 100 } as any),
                    getClients({ per_page: 100 } as any),
                    getWorkers({ per_page: 100 } as any),
                ]);

                setVehicles(vehiclesRes.data.data as any);
                setClients(clientsRes.data.data as any);
                setWorkers(workersRes.data.data as any);

                if (isEdit && id) {
                    const jobRes = await getJcbJob(id);
                    const job = jobRes.data as any;
                    setFormData({
                        vehicle_id: String(job.vehicle_id || ''),
                        client_id: String(job.client_id || ''),
                        worker_id: String(job.worker_id || ''),
                        job_date: job.job_date || '',
                        start_meter: String(job.start_meter ?? ''),
                        end_meter: String(job.end_meter ?? ''),
                        total_hours: String(job.total_hours ?? ''),
                        rate_type: job.rate_type || 'hourly',
                        rate_amount: String(job.rate_amount ?? ''),
                        location: job.location || '',
                        notes: job.notes || '',
                    });
                }
            } catch {
                toast.error('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const totalHours = useMemo(() => {
        const hours = parseFloat(formData.total_hours);
        if (!isNaN(hours) && hours > 0) {
            return hours;
        }
        return 0;
    }, [formData.total_hours]);

    const calculatedAmount = useMemo(() => {
        const rate = parseFloat(formData.rate_amount);
        if (!isNaN(rate) && totalHours > 0) {
            return totalHours * rate;
        }
        return 0;
    }, [totalHours, formData.rate_amount]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.vehicle_id) newErrors.vehicle_id = 'Vehicle is required';
        if (!formData.client_id) newErrors.client_id = 'Client is required';
        if (!formData.job_date) newErrors.job_date = 'Job date is required';
        if (!formData.total_hours) newErrors.total_hours = 'Total hours is required';
        if (!formData.rate_type) newErrors.rate_type = 'Rate type is required';
        if (!formData.rate_amount) newErrors.rate_amount = 'Rate amount is required';

        const hours = parseFloat(formData.total_hours);
        if (!isNaN(hours) && hours <= 0) {
            newErrors.total_hours = 'Total hours must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                vehicle_id: formData.vehicle_id,
                client_id: formData.client_id,
                worker_id: formData.worker_id || null,
                job_date: formData.job_date,
                start_meter: formData.start_meter ? parseFloat(formData.start_meter) : null,
                end_meter: formData.end_meter ? parseFloat(formData.end_meter) : null,
                total_hours: totalHours,
                rate_type: formData.rate_type,
                rate_amount: parseFloat(formData.rate_amount),
                total_amount: calculatedAmount,
                location: formData.location || null,
                notes: formData.notes || null,
            };

            if (isEdit && id) {
                await updateJcbJob(id, payload);
                toast.success('JCB job updated successfully');
            } else {
                await createJcbJob(payload);
                toast.success('JCB job created successfully');
            }
            navigate('/jcb-jobs');
        } catch (err: any) {
            if (err?.response?.data?.errors) {
                const serverErrors: Record<string, string> = {};
                Object.entries(err.response.data.errors).forEach(([key, msgs]: [string, any]) => {
                    serverErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
                });
                setErrors(serverErrors);
                toast.error('Please fix the validation errors');
            } else {
                toast.error(isEdit ? 'Failed to update JCB job' : 'Failed to create JCB job');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <PageHeader
                title={isEdit ? 'Edit JCB Job' : 'Create JCB Job'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'JCB Jobs', path: '/jcb-jobs' },
                    { label: isEdit ? 'Edit' : 'Create' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Vehicle */}
                        <div>
                            <label htmlFor="vehicle_id" className="block text-sm font-semibold mb-2">
                                Vehicle <span className="text-danger">*</span>
                            </label>
                            <select
                                id="vehicle_id"
                                name="vehicle_id"
                                className={`form-select ${errors.vehicle_id ? 'border-danger' : ''}`}
                                value={formData.vehicle_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Vehicle</option>
                                {vehicles.map((v: any) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name} {v.registration_number ? `(${v.registration_number})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.vehicle_id && <p className="text-danger text-xs mt-1">{errors.vehicle_id}</p>}
                        </div>

                        {/* Client */}
                        <div>
                            <label htmlFor="client_id" className="block text-sm font-semibold mb-2">
                                Client <span className="text-danger">*</span>
                            </label>
                            <select
                                id="client_id"
                                name="client_id"
                                className={`form-select ${errors.client_id ? 'border-danger' : ''}`}
                                value={formData.client_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Client</option>
                                {clients.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.company_name ? `- ${c.company_name}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.client_id && <p className="text-danger text-xs mt-1">{errors.client_id}</p>}
                        </div>

                        {/* Worker */}
                        <div>
                            <label htmlFor="worker_id" className="block text-sm font-semibold mb-2">
                                Worker / Operator
                            </label>
                            <select
                                id="worker_id"
                                name="worker_id"
                                className="form-select"
                                value={formData.worker_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Worker (Optional)</option>
                                {workers.map((w: any) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Job Date */}
                        <div>
                            <label htmlFor="job_date" className="block text-sm font-semibold mb-2">
                                Job Date <span className="text-danger">*</span>
                            </label>
                            <input
                                id="job_date"
                                type="date"
                                name="job_date"
                                className={`form-input ${errors.job_date ? 'border-danger' : ''}`}
                                value={formData.job_date}
                                onChange={handleChange}
                            />
                            {errors.job_date && <p className="text-danger text-xs mt-1">{errors.job_date}</p>}
                        </div>

                        {/* Total Hours / Days */}
                        <div>
                            <label htmlFor="total_hours" className="block text-sm font-semibold mb-2">
                                {formData.rate_type === 'daily' ? 'Total Days' : 'Total Hours'} <span className="text-danger">*</span>
                            </label>
                            <input
                                id="total_hours"
                                type="number"
                                name="total_hours"
                                className={`form-input ${errors.total_hours ? 'border-danger' : ''}`}
                                value={formData.total_hours}
                                onChange={handleChange}
                                placeholder={formData.rate_type === 'daily' ? 'Enter total days worked' : 'Enter total hours worked'}
                                step="0.01"
                            />
                            {errors.total_hours && <p className="text-danger text-xs mt-1">{errors.total_hours}</p>}
                        </div>

                        {/* Start Meter */}
                        <div>
                            <label htmlFor="start_meter" className="block text-sm font-semibold mb-2">
                                Start Meter
                            </label>
                            <input
                                id="start_meter"
                                type="number"
                                name="start_meter"
                                className="form-input"
                                value={formData.start_meter}
                                onChange={handleChange}
                                placeholder="Enter start meter reading (optional)"
                                step="0.01"
                            />
                        </div>

                        {/* End Meter */}
                        <div>
                            <label htmlFor="end_meter" className="block text-sm font-semibold mb-2">
                                End Meter
                            </label>
                            <input
                                id="end_meter"
                                type="number"
                                name="end_meter"
                                className="form-input"
                                value={formData.end_meter}
                                onChange={handleChange}
                                placeholder="Enter end meter reading (optional)"
                                step="0.01"
                            />
                        </div>

                        {/* Rate Type */}
                        <div>
                            <label htmlFor="rate_type" className="block text-sm font-semibold mb-2">
                                Rate Type <span className="text-danger">*</span>
                            </label>
                            <select
                                id="rate_type"
                                name="rate_type"
                                className={`form-select ${errors.rate_type ? 'border-danger' : ''}`}
                                value={formData.rate_type}
                                onChange={handleChange}
                            >
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                            </select>
                            {errors.rate_type && <p className="text-danger text-xs mt-1">{errors.rate_type}</p>}
                        </div>

                        {/* Rate Amount */}
                        <div>
                            <label htmlFor="rate_amount" className="block text-sm font-semibold mb-2">
                                Rate Amount (Rs.) <span className="text-danger">*</span>
                            </label>
                            <input
                                id="rate_amount"
                                type="number"
                                name="rate_amount"
                                className={`form-input ${errors.rate_amount ? 'border-danger' : ''}`}
                                value={formData.rate_amount}
                                onChange={handleChange}
                                placeholder="Enter rate amount"
                                step="0.01"
                            />
                            {errors.rate_amount && <p className="text-danger text-xs mt-1">{errors.rate_amount}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-semibold mb-2">
                                Location
                            </label>
                            <input
                                id="location"
                                type="text"
                                name="location"
                                className="form-input"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Enter job location"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-semibold mb-2">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="form-textarea"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Any additional notes..."
                        />
                    </div>

                    {/* Live Calculation Box */}
                    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-5">
                        <h4 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Live Calculation
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{formData.rate_type === 'daily' ? 'Total Days' : 'Total Hours'}</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                    {totalHours > 0 ? totalHours.toFixed(2) : '--'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rate ({formData.rate_type})</p>
                                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                    {formData.rate_amount ? `Rs. ${parseFloat(formData.rate_amount).toLocaleString('en-IN')}` : '--'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">per {formData.rate_type === 'hourly' ? 'hour' : 'day'}</p>
                            </div>
                            <div className="text-center p-3 bg-amber-100 dark:bg-amber-800/30 rounded-lg shadow-sm border border-amber-300 dark:border-amber-700">
                                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1 font-semibold">Total Amount</p>
                                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                                    {calculatedAmount > 0
                                        ? `Rs. ${calculatedAmount.toLocaleString('en-IN', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })}`
                                        : '--'}
                                </p>
                                <p className="text-xs text-amber-500 mt-1">{totalHours > 0 ? `${totalHours.toFixed(2)} x ${formData.rate_amount || '0'}` : `${formData.rate_type === 'daily' ? 'days' : 'hours'} x rate`}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                        <button
                            type="submit"
                            className="btn btn-warning shadow-md"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>{isEdit ? 'Update JCB Job' : 'Create JCB Job'}</>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => navigate('/jcb-jobs')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JcbJobForm;
