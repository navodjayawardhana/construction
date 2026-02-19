import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { JcbJob } from '../../types';
import { getJcbJob, markCompleted, markPaid } from '../../services/jcbJobService';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const JcbJobView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<JcbJob | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchJob = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await getJcbJob(id);
            setJob(response.data as any);
        } catch {
            toast.error('Failed to fetch JCB job details');
            navigate('/jcb-jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJob();
    }, [id]);

    const handleMarkCompleted = async () => {
        if (!job) return;
        try {
            await markCompleted(job.id);
            toast.success('Job marked as completed');
            fetchJob();
        } catch {
            toast.error('Failed to update job status');
        }
    };

    const handleMarkPaid = async () => {
        if (!job) return;
        try {
            await markPaid(job.id);
            toast.success('Job marked as paid');
            fetchJob();
        } catch {
            toast.error('Failed to update job status');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    if (loading) return <LoadingSpinner />;
    if (!job) return null;

    return (
        <div>
            <PageHeader
                title="JCB Job Details"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'JCB Jobs', path: '/jcb-jobs' },
                    { label: 'View' },
                ]}
                action={
                    <div className="flex items-center gap-2 flex-wrap">
                        {job.status === 'pending' && (
                            <button onClick={handleMarkCompleted} className="btn btn-info shadow-md">
                                Mark Complete
                            </button>
                        )}
                        {job.status === 'completed' && (
                            <button onClick={handleMarkPaid} className="btn btn-success shadow-md">
                                Mark Paid
                            </button>
                        )}
                        <Link to={`/invoices/jcb-job/${job.id}`} className="btn btn-dark shadow-md">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Invoice
                        </Link>
                        <Link to={`/jcb-jobs/${job.id}/edit`} className="btn btn-warning shadow-md">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </Link>
                        <button onClick={() => navigate('/jcb-jobs')} className="btn btn-outline-dark">
                            Back
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Job Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Job Information Panel */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-dark dark:text-white-light">Job Information</h3>
                            <StatusBadge status={job.status} type="job" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Job Date</p>
                                <p className="font-semibold text-dark dark:text-white-light">{formatDate(job.job_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                <p className="font-semibold text-dark dark:text-white-light">{job.location || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rate Type</p>
                                <p className="font-semibold text-dark dark:text-white-light capitalize">{job.rate_type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rate Amount</p>
                                <p className="font-semibold text-dark dark:text-white-light">{formatCurrency(job.rate_amount)}</p>
                            </div>
                            {job.notes && (
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                                    <p className="font-medium text-dark dark:text-white-light whitespace-pre-wrap">{job.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meter Readings (if available) */}
                    {(job.start_meter > 0 || job.end_meter > 0) && (
                        <div className="panel">
                            <h3 className="text-lg font-bold text-dark dark:text-white-light mb-4">Meter Readings</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Meter</p>
                                    <p className="font-semibold text-dark dark:text-white-light">{job.start_meter}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">End Meter</p>
                                    <p className="font-semibold text-dark dark:text-white-light">{job.end_meter}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calculation Breakdown Panel */}
                    <div className="panel border-2 border-amber-300 dark:border-amber-700">
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Calculation Breakdown
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[120px]">
                                <p className="text-xs text-gray-500 mb-1">{job.rate_type === 'daily' ? 'Total Days' : 'Total Hours'}</p>
                                <p className="text-xl font-bold text-dark dark:text-white-light">{job.total_hours}</p>
                            </div>
                            <div className="text-2xl font-bold text-gray-400">x</div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[120px]">
                                <p className="text-xs text-gray-500 mb-1">Rate ({job.rate_type === 'daily' ? 'per day' : 'per hour'})</p>
                                <p className="text-xl font-bold text-dark dark:text-white-light">{formatCurrency(job.rate_amount)}</p>
                            </div>
                            <div className="text-2xl font-bold text-gray-400">=</div>
                            <div className="p-4 bg-amber-100 dark:bg-amber-800/40 rounded-lg border-2 border-amber-400 dark:border-amber-600 min-w-[150px]">
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 font-semibold">Total Amount</p>
                                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{formatCurrency(job.total_amount)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Vehicle Card */}
                    <div className="panel">
                        <h3 className="text-lg font-bold text-dark dark:text-white-light mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Vehicle
                        </h3>
                        {job.vehicle ? (
                            <div className="space-y-2">
                                <p className="font-bold text-yellow-600 text-lg">{job.vehicle.name}</p>
                                {job.vehicle.registration_number && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Reg:</span> {job.vehicle.registration_number}
                                    </p>
                                )}
                                {job.vehicle.make && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Make:</span> {job.vehicle.make}
                                        {job.vehicle.model ? ` ${job.vehicle.model}` : ''}
                                    </p>
                                )}
                                <StatusBadge status={job.vehicle.status} type="vehicle" />
                            </div>
                        ) : (
                            <p className="text-gray-400">No vehicle information</p>
                        )}
                    </div>

                    {/* Client Card */}
                    <div className="panel">
                        <h3 className="text-lg font-bold text-dark dark:text-white-light mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Client
                        </h3>
                        {job.client ? (
                            <div className="space-y-2">
                                <p className="font-bold text-dark dark:text-white-light text-lg">{job.client.name}</p>
                                {job.client.company_name && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Company:</span> {job.client.company_name}
                                    </p>
                                )}
                                {job.client.phone && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Phone:</span> {job.client.phone}
                                    </p>
                                )}
                                {job.client.email && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Email:</span> {job.client.email}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400">No client information</p>
                        )}
                    </div>

                    {/* Worker Card */}
                    <div className="panel">
                        <h3 className="text-lg font-bold text-dark dark:text-white-light mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Worker / Operator
                        </h3>
                        {job.worker ? (
                            <div className="space-y-2">
                                <p className="font-bold text-dark dark:text-white-light text-lg">{job.worker.name}</p>
                                {job.worker.phone && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Phone:</span> {job.worker.phone}
                                    </p>
                                )}
                                {job.worker.role && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Role:</span> {job.worker.role}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400">No worker assigned</p>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div className="panel">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">Record Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Created</span>
                                <span className="text-dark dark:text-white-light">{formatDate(job.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Updated</span>
                                <span className="text-dark dark:text-white-light">{formatDate(job.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JcbJobView;
