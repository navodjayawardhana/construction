import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LorryJob, Vehicle, Client, Worker } from '../../types';
import { createLorryJob, updateLorryJob, getLorryJob } from '../../services/lorryJobService';
import { getVehicles } from '../../services/vehicleService';
import { getClients } from '../../services/clientService';
import { getWorkers } from '../../services/workerService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const LorryJobForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);

    const [formData, setFormData] = useState({
        vehicle_id: '',
        client_id: '',
        worker_id: '',
        job_date: '',
        rate_type: 'per_trip' as 'per_trip' | 'per_km' | 'per_day',
        rate_amount: '',
        trips: '',
        distance_km: '',
        days: '',
        location: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [vehicleRes, clientRes, workerRes] = await Promise.all([
                    getVehicles({ type: 'lorry' }),
                    getClients({}),
                    getWorkers({}),
                ]);
                setVehicles(vehicleRes.data.data as unknown as Vehicle[]);
                setClients(clientRes.data.data as unknown as Client[]);
                setWorkers(workerRes.data.data as unknown as Worker[]);
            } catch (error) {
                toast.error('Failed to load form data');
            }
        };

        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            const fetchJob = async () => {
                setLoading(true);
                try {
                    const response = await getLorryJob(id);
                    const job = response.data as unknown as LorryJob;
                    setFormData({
                        vehicle_id: job.vehicle_id || '',
                        client_id: job.client_id || '',
                        worker_id: job.worker_id || '',
                        job_date: job.job_date || '',
                        rate_type: job.rate_type || 'per_trip',
                        rate_amount: job.rate_amount != null ? String(job.rate_amount) : '',
                        trips: job.trips != null ? String(job.trips) : '',
                        distance_km: job.distance_km != null ? String(job.distance_km) : '',
                        days: job.days != null ? String(job.days) : '',
                        location: job.location || '',
                        notes: job.notes || '',
                    });
                } catch (error) {
                    toast.error('Failed to load lorry job');
                    navigate('/lorry-jobs');
                } finally {
                    setLoading(false);
                }
            };

            fetchJob();
        }
    }, [id, isEdit, navigate]);

    const calculatedTotal = useMemo(() => {
        const rate = parseFloat(formData.rate_amount) || 0;
        switch (formData.rate_type) {
            case 'per_trip':
                return rate * (parseFloat(formData.trips) || 0);
            case 'per_km':
                return rate * (parseFloat(formData.distance_km) || 0);
            case 'per_day':
                return rate * (parseFloat(formData.days) || 0);
            default:
                return 0;
        }
    }, [formData.rate_type, formData.rate_amount, formData.trips, formData.distance_km, formData.days]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.vehicle_id) newErrors.vehicle_id = 'Vehicle is required';
        if (!formData.client_id) newErrors.client_id = 'Client is required';
        if (!formData.job_date) newErrors.job_date = 'Job date is required';
        if (!formData.rate_type) newErrors.rate_type = 'Rate type is required';
        if (!formData.rate_amount || parseFloat(formData.rate_amount) <= 0) {
            newErrors.rate_amount = 'Rate amount must be greater than 0';
        }

        if (formData.rate_type === 'per_trip' && (!formData.trips || parseFloat(formData.trips) <= 0)) {
            newErrors.trips = 'Number of trips must be greater than 0';
        }
        if (formData.rate_type === 'per_km' && (!formData.distance_km || parseFloat(formData.distance_km) <= 0)) {
            newErrors.distance_km = 'Distance must be greater than 0';
        }
        if (formData.rate_type === 'per_day' && (!formData.days || parseFloat(formData.days) <= 0)) {
            newErrors.days = 'Number of days must be greater than 0';
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
                rate_type: formData.rate_type,
                rate_amount: parseFloat(formData.rate_amount),
                total_amount: calculatedTotal,
                location: formData.location || null,
                notes: formData.notes || null,
            };

            if (formData.rate_type === 'per_trip') {
                payload.trips = parseFloat(formData.trips);
                payload.distance_km = null;
                payload.days = null;
            } else if (formData.rate_type === 'per_km') {
                payload.trips = null;
                payload.distance_km = parseFloat(formData.distance_km);
                payload.days = null;
            } else if (formData.rate_type === 'per_day') {
                payload.trips = null;
                payload.distance_km = null;
                payload.days = parseFloat(formData.days);
            }

            if (isEdit && id) {
                await updateLorryJob(id, payload);
                toast.success('Lorry job updated successfully');
            } else {
                await createLorryJob(payload);
                toast.success('Lorry job created successfully');
            }

            navigate('/lorry-jobs');
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const serverErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, messages]) => {
                    serverErrors[key] = (messages as string[])[0];
                });
                setErrors(serverErrors);
                toast.error('Please fix the validation errors');
            } else {
                toast.error(isEdit ? 'Failed to update lorry job' : 'Failed to create lorry job');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <PageHeader
                title={isEdit ? 'Edit Lorry Job' : 'Create Lorry Job'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Lorry Jobs', path: '/lorry-jobs' },
                    { label: isEdit ? 'Edit' : 'Create' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Vehicle */}
                        <div>
                            <label htmlFor="vehicle_id" className="label">
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
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} {vehicle.registration_number ? `(${vehicle.registration_number})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.vehicle_id && <p className="text-danger text-xs mt-1">{errors.vehicle_id}</p>}
                        </div>

                        {/* Client */}
                        <div>
                            <label htmlFor="client_id" className="label">
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
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                            {errors.client_id && <p className="text-danger text-xs mt-1">{errors.client_id}</p>}
                        </div>

                        {/* Worker */}
                        <div>
                            <label htmlFor="worker_id" className="label">
                                Worker
                            </label>
                            <select
                                id="worker_id"
                                name="worker_id"
                                className="form-select"
                                value={formData.worker_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Worker (Optional)</option>
                                {workers.map((worker) => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Job Date */}
                        <div>
                            <label htmlFor="job_date" className="label">
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

                        {/* Rate Type */}
                        <div>
                            <label htmlFor="rate_type" className="label">
                                Rate Type <span className="text-danger">*</span>
                            </label>
                            <select
                                id="rate_type"
                                name="rate_type"
                                className={`form-select ${errors.rate_type ? 'border-danger' : ''}`}
                                value={formData.rate_type}
                                onChange={handleChange}
                            >
                                <option value="per_trip">Per Trip</option>
                                <option value="per_km">Per KM</option>
                                <option value="per_day">Per Day</option>
                            </select>
                            {errors.rate_type && <p className="text-danger text-xs mt-1">{errors.rate_type}</p>}
                        </div>

                        {/* Rate Amount */}
                        <div>
                            <label htmlFor="rate_amount" className="label">
                                Rate Amount (Rs.) <span className="text-danger">*</span>
                            </label>
                            <input
                                id="rate_amount"
                                type="number"
                                name="rate_amount"
                                className={`form-input ${errors.rate_amount ? 'border-danger' : ''}`}
                                value={formData.rate_amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                            {errors.rate_amount && <p className="text-danger text-xs mt-1">{errors.rate_amount}</p>}
                        </div>

                        {/* Conditional: Number of Trips */}
                        {formData.rate_type === 'per_trip' && (
                            <div>
                                <label htmlFor="trips" className="label">
                                    Number of Trips <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="trips"
                                    type="number"
                                    name="trips"
                                    className={`form-input ${errors.trips ? 'border-danger' : ''}`}
                                    value={formData.trips}
                                    onChange={handleChange}
                                    placeholder="0"
                                    step="1"
                                    min="0"
                                />
                                {errors.trips && <p className="text-danger text-xs mt-1">{errors.trips}</p>}
                            </div>
                        )}

                        {/* Conditional: Distance (km) */}
                        {formData.rate_type === 'per_km' && (
                            <div>
                                <label htmlFor="distance_km" className="label">
                                    Distance (km) <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="distance_km"
                                    type="number"
                                    name="distance_km"
                                    className={`form-input ${errors.distance_km ? 'border-danger' : ''}`}
                                    value={formData.distance_km}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                                {errors.distance_km && <p className="text-danger text-xs mt-1">{errors.distance_km}</p>}
                            </div>
                        )}

                        {/* Conditional: Number of Days */}
                        {formData.rate_type === 'per_day' && (
                            <div>
                                <label htmlFor="days" className="label">
                                    Number of Days <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="days"
                                    type="number"
                                    name="days"
                                    className={`form-input ${errors.days ? 'border-danger' : ''}`}
                                    value={formData.days}
                                    onChange={handleChange}
                                    placeholder="0"
                                    step="0.5"
                                    min="0"
                                />
                                {errors.days && <p className="text-danger text-xs mt-1">{errors.days}</p>}
                            </div>
                        )}

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="label">
                                Location
                            </label>
                            <input
                                id="location"
                                type="text"
                                name="location"
                                className="form-input"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Job location"
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label htmlFor="notes" className="label">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                className="form-textarea"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    {/* Live Calculation Display */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {formData.rate_type === 'per_trip' && (
                                    <span>
                                        Rs. {parseFloat(formData.rate_amount) || 0} x {parseFloat(formData.trips) || 0} trip(s)
                                    </span>
                                )}
                                {formData.rate_type === 'per_km' && (
                                    <span>
                                        Rs. {parseFloat(formData.rate_amount) || 0} x {parseFloat(formData.distance_km) || 0} km
                                    </span>
                                )}
                                {formData.rate_type === 'per_day' && (
                                    <span>
                                        Rs. {parseFloat(formData.rate_amount) || 0} x {parseFloat(formData.days) || 0} day(s)
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                                <p className="text-2xl font-bold text-primary">
                                    Rs. {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center gap-4 mt-6">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Update Lorry Job' : 'Create Lorry Job'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => navigate('/lorry-jobs')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LorryJobForm;
