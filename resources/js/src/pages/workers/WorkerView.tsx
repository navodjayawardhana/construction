import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Worker } from '../../types';
import { getWorker } from '../../services/workerService';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const WorkerView = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchWorker(id);
        }
    }, [id]);

    const fetchWorker = async (workerId: string) => {
        setLoading(true);
        try {
            const response = await getWorker(workerId);
            setWorker(response.data as unknown as Worker);
        } catch (error) {
            toast.error('Failed to fetch worker details');
            navigate('/workers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!worker) {
        return null;
    }

    return (
        <div>
            <PageHeader
                title="Worker Details"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Workers', path: '/workers' },
                    { label: worker.name },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/workers')}
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(`/workers/${worker.id}/edit`)}
                        >
                            Edit
                        </button>
                    </div>
                }
            />

            <div className="panel">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Name</label>
                        <p className="text-dark dark:text-white-light mt-1">{worker.name}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-dark dark:text-white-light mt-1">{worker.phone || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">NIC</label>
                        <p className="text-dark dark:text-white-light mt-1">{worker.nic || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Role</label>
                        <p className="text-dark dark:text-white-light mt-1">{worker.role || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Salary Type</label>
                        <p className="text-dark dark:text-white-light mt-1 capitalize">{worker.salary_type}</p>
                    </div>

                    {worker.salary_type === 'daily' ? (
                        <div>
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Daily Rate</label>
                            <p className="text-dark dark:text-white-light mt-1">
                                Rs. {Number(worker.daily_rate || 0).toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Monthly Salary</label>
                            <p className="text-dark dark:text-white-light mt-1">
                                Rs. {Number(worker.monthly_salary || 0).toLocaleString()}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-dark dark:text-white-light mt-1">{worker.address || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Status</label>
                        <div className="mt-1">
                            <StatusBadge status={worker.is_active ? 'active' : 'inactive'} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Created At</label>
                        <p className="text-dark dark:text-white-light mt-1">
                            {new Date(worker.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Updated At</label>
                        <p className="text-dark dark:text-white-light mt-1">
                            {new Date(worker.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700 my-6" />

                <div className="flex items-center gap-3">
                    <Link to="/attendance" className="btn btn-outline-success">
                        View Attendance
                    </Link>
                    <Link to="/salary-payments" className="btn btn-outline-info">
                        View Salary Payments
                    </Link>
                    <Link to={`/paysheets/worker/${worker.id}`} className="btn btn-outline-dark">
                        Print Payslip
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default WorkerView;
