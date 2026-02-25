import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Vehicle, Job, Worker } from '../../types';
import { getVehicle } from '../../services/vehicleService';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface VehicleWithJobs extends Vehicle {
    jobs?: Job[];
    workers?: Worker[];
}

const VehicleView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState<VehicleWithJobs | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchVehicle();
        }
    }, [id]);

    const fetchVehicle = async () => {
        setLoading(true);
        try {
            const response = await getVehicle(id);
            setVehicle(response.data as unknown as VehicleWithJobs);
        } catch (error) {
            toast.error('Failed to fetch vehicle details');
            navigate('/vehicles');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!vehicle) {
        return null;
    }

    const detailRows = [
        { label: 'Name', value: vehicle.name },
        { label: 'Registration Number', value: vehicle.registration_number || '-' },
        { label: 'Type', value: vehicle.type.toUpperCase() },
        { label: 'Status', value: <StatusBadge status={vehicle.status} type="vehicle" /> },
        { label: 'Color', value: vehicle.color || '-' },
        { label: 'Make', value: vehicle.make || '-' },
        { label: 'Model', value: vehicle.model || '-' },
        { label: 'Year', value: vehicle.year || '-' },
        { label: 'Created', value: new Date(vehicle.created_at).toLocaleDateString() },
        { label: 'Updated', value: new Date(vehicle.updated_at).toLocaleDateString() },
    ];

    return (
        <div>
            <PageHeader
                title="Vehicle Details"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Vehicles', path: '/vehicles' },
                    { label: vehicle.name },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <Link to={`/vehicles/${vehicle.id}/edit`} className="btn btn-primary">
                            <svg className="w-5 h-5 ltr:mr-1.5 rtl:ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                        </Link>
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => navigate('/vehicles')}
                        >
                            Back
                        </button>
                    </div>
                }
            />

            <div className="panel">
                <h3 className="text-lg font-semibold mb-5">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {detailRows.map((row) => (
                        <div key={row.label} className="flex flex-col">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                            <span className="text-base font-medium mt-0.5">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {vehicle.workers && vehicle.workers.length > 0 && (
                <div className="panel mt-5">
                    <h3 className="text-lg font-semibold mb-5">Assigned Workers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {vehicle.workers.map((worker) => (
                            <div key={worker.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {worker.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm truncate">{worker.name}</div>
                                    {worker.role && <div className="text-xs text-gray-500 dark:text-gray-400">{worker.role}</div>}
                                    {worker.phone && <div className="text-xs text-gray-500 dark:text-gray-400">{worker.phone}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {vehicle.jobs && vehicle.jobs.length > 0 && (
                <div className="panel mt-5">
                    <h3 className="text-lg font-semibold mb-5">Jobs</h3>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Client</th>
                                    <th>Location</th>
                                    <th>Details</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicle.jobs.map((job) => (
                                    <tr key={job.id}>
                                        <td>{new Date(job.job_date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${job.job_type === 'jcb' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {job.job_type}
                                            </span>
                                        </td>
                                        <td>{job.client?.name || '-'}</td>
                                        <td>{job.location || '-'}</td>
                                        <td>
                                            {job.job_type === 'jcb'
                                                ? `${Number(job.total_hours || 0).toFixed(2)}h`
                                                : (job.rate_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </td>
                                        <td>Rs. {Number(job.total_amount).toLocaleString()}</td>
                                        <td><StatusBadge status={job.status} type="job" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleView;
