import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Job, Vehicle, Client, Worker } from '../../types';
import { getJob, createJob, updateJob } from '../../services/jobService';
import { getVehicles } from '../../services/vehicleService';
import { getClients } from '../../services/clientService';
import { getWorkers } from '../../services/workerService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface FormData {
    job_type: 'jcb' | 'lorry';
    vehicle_id: string;
    client_id: string;
    worker_id: string;
    job_date: string;
    rate_type: 'hourly' | 'daily' | 'per_trip' | 'per_km' | 'per_day';
    rate_amount: string;
    location: string;
    notes: string;
    // JCB-specific
    start_meter: string;
    end_meter: string;
    total_hours: string;
    // Tipper-specific
    trips: string;
    distance_km: string;
    days: string;
}

const initialFormData: FormData = {
    job_type: 'jcb',
    vehicle_id: '',
    client_id: '',
    worker_id: '',
    job_date: '',
    rate_type: 'hourly',
    rate_amount: '',
    location: '',
    notes: '',
    start_meter: '',
    end_meter: '',
    total_hours: '',
    trips: '',
    distance_km: '',
    days: '',
};

const JobForm = () => {
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
                    getVehicles({ per_page: 100 } as any),
                    getClients({ per_page: 100 } as any),
                    getWorkers({ per_page: 100 } as any),
                ]);

                setVehicles(vehiclesRes.data.data as any);
                setClients(clientsRes.data.data as any);
                setWorkers(workersRes.data.data as any);

                if (isEdit && id) {
                    const jobRes = await getJob(id);
                    const job = jobRes.data as any;
                    setFormData({
                        job_type: job.job_type || 'jcb',
                        vehicle_id: String(job.vehicle_id || ''),
                        client_id: String(job.client_id || ''),
                        worker_id: String(job.worker_id || ''),
                        job_date: job.job_date || '',
                        rate_type: job.rate_type || (job.job_type === 'lorry' ? 'per_trip' : 'hourly'),
                        rate_amount: String(job.rate_amount ?? ''),
                        location: job.location || '',
                        notes: job.notes || '',
                        start_meter: String(job.start_meter ?? ''),
                        end_meter: String(job.end_meter ?? ''),
                        total_hours: String(job.total_hours ?? ''),
                        trips: job.trips != null ? String(job.trips) : '',
                        distance_km: job.distance_km != null ? String(job.distance_km) : '',
                        days: job.days != null ? String(job.days) : '',
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

    // Filter vehicles by selected job type
    const filteredVehicles = useMemo(() => {
        return vehicles.filter((v) => v.type === formData.job_type);
    }, [vehicles, formData.job_type]);

    // Reset vehicle and rate_type when job_type changes
    const handleJobTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newJobType = e.target.value as 'jcb' | 'lorry';
        setFormData((prev) => ({
            ...prev,
            job_type: newJobType,
            vehicle_id: '',
            rate_type: newJobType === 'jcb' ? 'hourly' : 'per_trip',
            // Clear type-specific fields
            start_meter: '',
            end_meter: '',
            total_hours: '',
            trips: '',
            distance_km: '',
            days: '',
        }));
        // Clear related errors
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy.vehicle_id;
            delete copy.rate_type;
            delete copy.total_hours;
            delete copy.trips;
            delete copy.distance_km;
            delete copy.days;
            return copy;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            // Auto-calculate hours from meter readings for JCB
            if (updated.job_type === 'jcb' && (name === 'start_meter' || name === 'end_meter')) {
                const s = parseFloat(updated.start_meter);
                const en = parseFloat(updated.end_meter);
                if (!isNaN(s) && !isNaN(en) && en > s) {
                    updated.total_hours = (en - s).toFixed(2);
                }
            }
            return updated;
        });
        if (errors[name]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    // Quantity for calculation
    const quantity = useMemo(() => {
        if (formData.job_type === 'jcb') {
            const hours = parseFloat(formData.total_hours);
            return !isNaN(hours) && hours > 0 ? hours : 0;
        }
        switch (formData.rate_type) {
            case 'per_trip':
                return parseFloat(formData.trips) || 0;
            case 'per_km':
                return parseFloat(formData.distance_km) || 0;
            case 'per_day':
                return parseFloat(formData.days) || 0;
            default:
                return 0;
        }
    }, [formData.job_type, formData.rate_type, formData.total_hours, formData.trips, formData.distance_km, formData.days]);

    const calculatedTotal = useMemo(() => {
        const rate = parseFloat(formData.rate_amount);
        if (!isNaN(rate) && quantity > 0) {
            return quantity * rate;
        }
        return 0;
    }, [quantity, formData.rate_amount]);

    // Label helpers for calculation display
    const quantityLabel = useMemo(() => {
        if (formData.job_type === 'jcb') {
            return formData.rate_type === 'daily' ? 'Total Days' : 'Total Hours';
        }
        switch (formData.rate_type) {
            case 'per_trip':
                return 'Trips';
            case 'per_km':
                return 'Distance (km)';
            case 'per_day':
                return 'Days';
            default:
                return 'Quantity';
        }
    }, [formData.job_type, formData.rate_type]);

    const rateUnitLabel = useMemo(() => {
        switch (formData.rate_type) {
            case 'hourly':
                return 'per hour';
            case 'daily':
                return 'per day';
            case 'per_trip':
                return 'per trip';
            case 'per_km':
                return 'per km';
            case 'per_day':
                return 'per day';
            default:
                return '';
        }
    }, [formData.rate_type]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.job_type) newErrors.job_type = 'Job type is required';
        if (!formData.vehicle_id) newErrors.vehicle_id = 'Vehicle is required';
        if (!formData.client_id) newErrors.client_id = 'Client is required';
        if (!formData.job_date) newErrors.job_date = 'Job date is required';
        if (!formData.rate_type) newErrors.rate_type = 'Rate type is required';
        if (!formData.rate_amount || parseFloat(formData.rate_amount) <= 0) {
            newErrors.rate_amount = 'Rate amount must be greater than 0';
        }

        if (formData.job_type === 'jcb') {
            if (!formData.total_hours || parseFloat(formData.total_hours) <= 0) {
                newErrors.total_hours = formData.rate_type === 'daily' ? 'Total days must be greater than 0' : 'Total hours must be greater than 0';
            }
        }

        if (formData.job_type === 'lorry') {
            if (formData.rate_type === 'per_trip' && (!formData.trips || parseFloat(formData.trips) <= 0)) {
                newErrors.trips = 'Number of trips must be greater than 0';
            }
            if (formData.rate_type === 'per_km' && (!formData.distance_km || parseFloat(formData.distance_km) <= 0)) {
                newErrors.distance_km = 'Distance must be greater than 0';
            }
            if (formData.rate_type === 'per_day' && (!formData.days || parseFloat(formData.days) <= 0)) {
                newErrors.days = 'Number of days must be greater than 0';
            }
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
                job_type: formData.job_type,
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

            if (formData.job_type === 'jcb') {
                payload.start_meter = formData.start_meter ? parseFloat(formData.start_meter) : null;
                payload.end_meter = formData.end_meter ? parseFloat(formData.end_meter) : null;
                payload.total_hours = parseFloat(formData.total_hours);
                // Clear tipper fields
                payload.trips = null;
                payload.distance_km = null;
                payload.days = null;
            } else {
                // Tipper
                payload.start_meter = null;
                payload.end_meter = null;
                payload.total_hours = null;

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
            }

            if (isEdit && id) {
                await updateJob(id, payload);
                toast.success('Job updated successfully');
            } else {
                await createJob(payload);
                toast.success('Job created successfully');
            }
            navigate('/jobs');
        } catch (err: any) {
            if (err?.response?.data?.errors) {
                const serverErrors: Record<string, string> = {};
                Object.entries(err.response.data.errors).forEach(([key, msgs]: [string, any]) => {
                    serverErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
                });
                setErrors(serverErrors);
                toast.error('Please fix the validation errors');
            } else {
                toast.error(isEdit ? 'Failed to update job' : 'Failed to create job');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <PageHeader
                title={isEdit ? 'Edit Job' : 'Create Job'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Jobs', path: '/jobs' },
                    { label: isEdit ? 'Edit' : 'Create' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Job Type */}
                        <div>
                            <label htmlFor="job_type" className="block text-sm font-semibold mb-2">
                                Job Type <span className="text-danger">*</span>
                            </label>
                            {isEdit ? (
                                <div>
                                    <input
                                        type="text"
                                        className="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                        value={formData.job_type === 'jcb' ? 'JCB' : 'Tipper'}
                                        readOnly
                                    />
                                    <input type="hidden" name="job_type" value={formData.job_type} />
                                </div>
                            ) : (
                                <select
                                    id="job_type"
                                    name="job_type"
                                    className={`form-select ${errors.job_type ? 'border-danger' : ''}`}
                                    value={formData.job_type}
                                    onChange={handleJobTypeChange}
                                >
                                    <option value="jcb">JCB</option>
                                    <option value="lorry">Tipper</option>
                                </select>
                            )}
                            {errors.job_type && <p className="text-danger text-xs mt-1">{errors.job_type}</p>}
                        </div>

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
                                {filteredVehicles.map((v) => (
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
                                {clients.map((c) => (
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
                                {workers.map((w) => (
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
                                {formData.job_type === 'jcb' ? (
                                    <>
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="per_trip">Per Trip</option>
                                        <option value="per_km">Per KM</option>
                                        <option value="per_day">Per Day</option>
                                    </>
                                )}
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
                                min="0"
                            />
                            {errors.rate_amount && <p className="text-danger text-xs mt-1">{errors.rate_amount}</p>}
                        </div>

                        {/* JCB-specific: Start Meter */}
                        {formData.job_type === 'jcb' && (
                            <div>
                                <label htmlFor="start_meter" className="block text-sm font-semibold mb-2">
                                    Start Meter <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="start_meter"
                                    type="number"
                                    name="start_meter"
                                    className={`form-input ${errors.start_meter ? 'border-danger' : ''}`}
                                    value={formData.start_meter}
                                    onChange={handleChange}
                                    placeholder="Enter start meter reading"
                                    step="0.01"
                                />
                                {errors.start_meter && <p className="text-danger text-xs mt-1">{errors.start_meter}</p>}
                            </div>
                        )}

                        {/* JCB-specific: End Meter */}
                        {formData.job_type === 'jcb' && (
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
                                    placeholder="Enter end meter reading"
                                    step="0.01"
                                />
                            </div>
                        )}

                        {/* JCB-specific: Total Hours / Days (auto-calculated from meters) */}
                        {formData.job_type === 'jcb' && (
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
                                    placeholder="Auto-calculated from meters"
                                    step="0.01"
                                    min="0"
                                />
                                {errors.total_hours && <p className="text-danger text-xs mt-1">{errors.total_hours}</p>}
                            </div>
                        )}

                        {/* Tipper-specific: Number of Trips */}
                        {formData.job_type === 'lorry' && formData.rate_type === 'per_trip' && (
                            <div>
                                <label htmlFor="trips" className="block text-sm font-semibold mb-2">
                                    Number of Trips <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="trips"
                                    type="number"
                                    name="trips"
                                    className={`form-input ${errors.trips ? 'border-danger' : ''}`}
                                    value={formData.trips}
                                    onChange={handleChange}
                                    placeholder="Enter number of trips"
                                    step="1"
                                    min="0"
                                />
                                {errors.trips && <p className="text-danger text-xs mt-1">{errors.trips}</p>}
                            </div>
                        )}

                        {/* Tipper-specific: Distance (km) */}
                        {formData.job_type === 'lorry' && formData.rate_type === 'per_km' && (
                            <div>
                                <label htmlFor="distance_km" className="block text-sm font-semibold mb-2">
                                    Distance (km) <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="distance_km"
                                    type="number"
                                    name="distance_km"
                                    className={`form-input ${errors.distance_km ? 'border-danger' : ''}`}
                                    value={formData.distance_km}
                                    onChange={handleChange}
                                    placeholder="Enter distance in km"
                                    step="0.01"
                                    min="0"
                                />
                                {errors.distance_km && <p className="text-danger text-xs mt-1">{errors.distance_km}</p>}
                            </div>
                        )}

                        {/* Tipper-specific: Number of Days */}
                        {formData.job_type === 'lorry' && formData.rate_type === 'per_day' && (
                            <div>
                                <label htmlFor="days" className="block text-sm font-semibold mb-2">
                                    Number of Days <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="days"
                                    type="number"
                                    name="days"
                                    className={`form-input ${errors.days ? 'border-danger' : ''}`}
                                    value={formData.days}
                                    onChange={handleChange}
                                    placeholder="Enter number of days"
                                    step="0.5"
                                    min="0"
                                />
                                {errors.days && <p className="text-danger text-xs mt-1">{errors.days}</p>}
                            </div>
                        )}

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
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{quantityLabel}</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                    {quantity > 0 ? quantity.toFixed(2) : '--'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rate ({formData.rate_type.replace('_', ' ')})</p>
                                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                    {formData.rate_amount ? `Rs. ${parseFloat(formData.rate_amount).toLocaleString('en-IN')}` : '--'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{rateUnitLabel}</p>
                            </div>
                            <div className="text-center p-3 bg-amber-100 dark:bg-amber-800/30 rounded-lg shadow-sm border border-amber-300 dark:border-amber-700">
                                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1 font-semibold">Total Amount</p>
                                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                                    {calculatedTotal > 0
                                        ? `Rs. ${calculatedTotal.toLocaleString('en-IN', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })}`
                                        : '--'}
                                </p>
                                <p className="text-xs text-amber-500 mt-1">
                                    {quantity > 0
                                        ? `${quantity.toFixed(2)} x ${formData.rate_amount || '0'}`
                                        : `${quantityLabel.toLowerCase()} x rate`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                        <button
                            type="submit"
                            className="btn btn-primary shadow-md"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block mr-2"></span>
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>{isEdit ? 'Update Job' : 'Create Job'}</>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => navigate('/jobs')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobForm;
