import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LorryJob } from '../../types';
import { getLorryJob, markCompleted, markPaid } from '../../services/lorryJobService';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const LorryJobView = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [job, setJob] = useState<LorryJob | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchJob = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await getLorryJob(id);
            setJob(response.data as unknown as LorryJob);
        } catch (error) {
            toast.error('Failed to load lorry job');
            navigate('/lorry-jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJob();
    }, [id]);

    const handleMarkCompleted = async () => {
        if (!job) return;
        const result = await Swal.fire({
            title: 'Mark as Completed?',
            text: 'This will update the job status to completed.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Yes, mark completed',
        });

        if (result.isConfirmed) {
            try {
                await markCompleted(job.id);
                toast.success('Job marked as completed');
                fetchJob();
            } catch (error) {
                toast.error('Failed to update job status');
            }
        }
    };

    const handleMarkPaid = async () => {
        if (!job) return;
        const result = await Swal.fire({
            title: 'Mark as Paid?',
            text: 'This will update the job status to paid.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            confirmButtonText: 'Yes, mark paid',
        });

        if (result.isConfirmed) {
            try {
                await markPaid(job.id);
                toast.success('Job marked as paid');
                fetchJob();
            } catch (error) {
                toast.error('Failed to update job status');
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getRateTypeLabel = (rateType: string) => {
        const labels: Record<string, string> = {
            per_trip: 'Per Trip',
            per_km: 'Per KM',
            per_day: 'Per Day',
        };
        return labels[rateType] || rateType;
    };

    if (loading) return <LoadingSpinner />;

    if (!job) {
        return (
            <div className="panel">
                <p className="text-center text-gray-500">Lorry job not found.</p>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Lorry Job Details"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Lorry Jobs', path: '/lorry-jobs' },
                    { label: 'View' },
                ]}
                action={
                    <div className="flex items-center gap-2 flex-wrap">
                        {job.status === 'pending' && (
                            <button
                                type="button"
                                className="btn btn-info"
                                onClick={handleMarkCompleted}
                            >
                                Mark Complete
                            </button>
                        )}
                        {job.status === 'completed' && (
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleMarkPaid}
                            >
                                Mark Paid
                            </button>
                        )}
                        <Link to={`/invoices/lorry-job/${job.id}`} className="btn btn-dark">
                            Print Invoice
                        </Link>
                        <Link to={`/lorry-jobs/${job.id}/edit`} className="btn btn-primary">
                            Edit
                        </Link>
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => navigate('/lorry-jobs')}
                        >
                            Back
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Details */}
                <div className="panel">
                    <h3 className="text-lg font-semibold mb-4">Job Information</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Status</span>
                            <StatusBadge status={job.status} />
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Job Date</span>
                            <span className="font-semibold">{formatDate(job.job_date)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Vehicle</span>
                            <span className="font-semibold">{job.vehicle?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Client</span>
                            <span className="font-semibold">{job.client?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Worker</span>
                            <span className="font-semibold">{job.worker?.name || 'Not assigned'}</span>
                        </div>
                        {job.location && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Location</span>
                                <span className="font-semibold">{job.location}</span>
                            </div>
                        )}
                        {job.notes && (
                            <div className="border-b pb-2">
                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Notes</span>
                                <span className="font-semibold">{job.notes}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="panel">
                    <h3 className="text-lg font-semibold mb-4">Calculation Breakdown</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Rate Type</span>
                            <span className="font-semibold">{getRateTypeLabel(job.rate_type)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Rate Amount</span>
                            <span className="font-semibold">{formatAmount(job.rate_amount)}</span>
                        </div>

                        {job.rate_type === 'per_trip' && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Number of Trips</span>
                                <span className="font-semibold">{job.trips ?? '-'}</span>
                            </div>
                        )}
                        {job.rate_type === 'per_km' && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Distance</span>
                                <span className="font-semibold">{job.distance_km != null ? `${job.distance_km} km` : '-'}</span>
                            </div>
                        )}
                        {job.rate_type === 'per_day' && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Number of Days</span>
                                <span className="font-semibold">{job.days ?? '-'}</span>
                            </div>
                        )}

                        {/* Calculation Formula */}
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Calculation</p>
                            <div className="text-sm mb-3">
                                {job.rate_type === 'per_trip' && (
                                    <span>
                                        {formatAmount(job.rate_amount)} x {job.trips ?? 0} trip(s)
                                    </span>
                                )}
                                {job.rate_type === 'per_km' && (
                                    <span>
                                        {formatAmount(job.rate_amount)} x {job.distance_km ?? 0} km
                                    </span>
                                )}
                                {job.rate_type === 'per_day' && (
                                    <span>
                                        {formatAmount(job.rate_amount)} x {job.days ?? 0} day(s)
                                    </span>
                                )}
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatAmount(job.total_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timestamps */}
            <div className="panel mt-6">
                <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Created: {formatDate(job.created_at)}</span>
                    <span>Last Updated: {formatDate(job.updated_at)}</span>
                </div>
            </div>
        </div>
    );
};

export default LorryJobView;
