import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Vehicle, Worker } from '../../types';
import { getVehicle, createVehicle, updateVehicle } from '../../services/vehicleService';
import { getWorkers } from '../../services/workerService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const VehicleForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        registration_number: '',
        type: 'jcb' as Vehicle['type'],
        color: '',
        status: 'active' as Vehicle['status'],
        make: '',
        model: '',
        year: '',
    });

    useEffect(() => {
        fetchWorkers();
        if (isEdit && id) {
            fetchVehicle();
        }
    }, [id]);

    const fetchWorkers = async () => {
        try {
            const response = await getWorkers({ per_page: 200, is_active: 1 } as any);
            setAllWorkers(response.data.data as unknown as Worker[]);
        } catch {
            // silently fail
        }
    };

    const fetchVehicle = async () => {
        setLoading(true);
        try {
            const response = await getVehicle(id);
            const vehicle = response.data as unknown as Vehicle;
            setFormData({
                name: vehicle.name || '',
                registration_number: vehicle.registration_number || '',
                type: vehicle.type,
                color: vehicle.color || '',
                status: vehicle.status,
                make: vehicle.make || '',
                model: vehicle.model || '',
                year: vehicle.year ? String(vehicle.year) : '',
            });
            if (vehicle.workers) {
                setSelectedWorkerIds(vehicle.workers.map((w: any) => w.id));
            }
        } catch (error) {
            toast.error('Failed to fetch vehicle details');
            navigate('/vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vehicle name is required');
            return;
        }

        if (!formData.type) {
            toast.error('Vehicle type is required');
            return;
        }

        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                name: formData.name,
                registration_number: formData.registration_number || undefined,
                type: formData.type,
                color: formData.color || undefined,
                status: formData.status,
                make: formData.make || undefined,
                model: formData.model || undefined,
                year: formData.year ? Number(formData.year) : undefined,
                worker_ids: selectedWorkerIds,
            };

            if (isEdit && id) {
                await updateVehicle(id, payload);
                toast.success('Vehicle updated successfully');
            } else {
                await createVehicle(payload);
                toast.success('Vehicle created successfully');
            }
            navigate('/vehicles');
        } catch (error: any) {
            const message = error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} vehicle`;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const vehicleTypes = [
        { value: 'jcb', label: 'JCB' },
        { value: 'lorry', label: 'Lorry' },
        { value: 'excavator', label: 'Excavator' },
        { value: 'roller', label: 'Roller' },
        { value: 'other', label: 'Other' },
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'maintenance', label: 'Maintenance' },
    ];

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <PageHeader
                title={isEdit ? 'Edit Vehicle' : 'Create Vehicle'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Vehicles', path: '/vehicles' },
                    { label: isEdit ? 'Edit' : 'Create' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold mb-1">
                                Name <span className="text-danger">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="Enter vehicle name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="registration_number" className="block text-sm font-semibold mb-1">
                                Registration Number
                            </label>
                            <input
                                id="registration_number"
                                name="registration_number"
                                type="text"
                                className="form-input"
                                placeholder="Enter registration number"
                                value={formData.registration_number}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-semibold mb-1">
                                Type <span className="text-danger">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                className="form-select"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                {vehicleTypes.map((vt) => (
                                    <option key={vt.value} value={vt.value}>
                                        {vt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="color" className="block text-sm font-semibold mb-1">
                                Color
                            </label>
                            <input
                                id="color"
                                name="color"
                                type="text"
                                className="form-input"
                                placeholder="Enter color"
                                value={formData.color}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-semibold mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                className="form-select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="make" className="block text-sm font-semibold mb-1">
                                Make
                            </label>
                            <input
                                id="make"
                                name="make"
                                type="text"
                                className="form-input"
                                placeholder="Enter make"
                                value={formData.make}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="model" className="block text-sm font-semibold mb-1">
                                Model
                            </label>
                            <input
                                id="model"
                                name="model"
                                type="text"
                                className="form-input"
                                placeholder="Enter model"
                                value={formData.model}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="year" className="block text-sm font-semibold mb-1">
                                Year
                            </label>
                            <input
                                id="year"
                                name="year"
                                type="number"
                                className="form-input"
                                placeholder="Enter year"
                                value={formData.year}
                                onChange={handleChange}
                                min="1900"
                                max="2099"
                            />
                        </div>
                    </div>

                    {/* Assigned Workers */}
                    <div className="mt-6">
                        <label className="block text-sm font-semibold mb-2">Assigned Workers</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select workers who operate this vehicle. When creating a job, these workers will be suggested automatically.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            {allWorkers.length === 0 ? (
                                <p className="text-sm text-gray-400 col-span-full">No active workers found</p>
                            ) : (
                                allWorkers.map((worker) => (
                                    <label
                                        key={worker.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                            selectedWorkerIds.includes(worker.id)
                                                ? 'bg-primary/10 border border-primary'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-checkbox text-primary rounded"
                                            checked={selectedWorkerIds.includes(worker.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedWorkerIds((prev) => [...prev, worker.id]);
                                                } else {
                                                    setSelectedWorkerIds((prev) => prev.filter((id) => id !== worker.id));
                                                }
                                            }}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{worker.name}</div>
                                            {worker.role && <div className="text-xs text-gray-500 truncate">{worker.role}</div>}
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        {selectedWorkerIds.length > 0 && (
                            <p className="text-xs text-primary mt-1">{selectedWorkerIds.length} worker(s) selected</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-8">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Create Vehicle'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => navigate('/vehicles')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleForm;
