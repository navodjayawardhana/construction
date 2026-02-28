import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getJobs, deleteJob, markCompleted, markPaid } from '../../services/jobService';
import { Job } from '../../types';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';

type JobTypeFilter = 'all' | 'jcb' | 'lorry';
type StatusFilter = 'all' | 'pending' | 'completed' | 'paid';

const formatCurrency = (amount: number): string => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const JobList = () => {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [jobTypeFilter, setJobTypeFilter] = useState<JobTypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page: currentPage,
                search: search || undefined,
            };
            if (jobTypeFilter !== 'all') {
                params.job_type = jobTypeFilter;
            }
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await getJobs(params);
            const paginated = response.data;
            setJobs(paginated.data as Job[]);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch {
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, jobTypeFilter, statusFilter]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [jobTypeFilter, statusFilter]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleDelete = async (job: Job) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This job will be permanently deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });
        if (result.isConfirmed) {
            try {
                await deleteJob(job.id);
                toast.success('Job deleted successfully');
                fetchJobs();
            } catch {
                toast.error('Failed to delete job');
            }
        }
    };

    const handleMarkCompleted = async (job: Job) => {
        if (job.job_type === 'jcb') {
            const { value: endMeter } = await Swal.fire({
                title: 'Enter End Meter Reading',
                input: 'number',
                inputLabel: 'End Meter',
                inputPlaceholder: 'Enter end meter reading',
                inputAttributes: {
                    min: '0',
                    step: '0.01',
                },
                showCancelButton: true,
                confirmButtonText: 'Mark Completed',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Please enter the end meter reading';
                    }
                    if (job.start_meter !== undefined && Number(value) <= job.start_meter) {
                        return `End meter must be greater than start meter (${job.start_meter})`;
                    }
                    return null;
                },
            });
            if (endMeter) {
                try {
                    await markCompleted(job.id, { end_meter: Number(endMeter) });
                    toast.success('Job marked as completed');
                    fetchJobs();
                } catch {
                    toast.error('Failed to mark job as completed');
                }
            }
        } else {
            const result = await Swal.fire({
                title: 'Mark as Completed?',
                text: 'Are you sure you want to mark this job as completed?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, complete it!',
                cancelButtonText: 'Cancel',
            });
            if (result.isConfirmed) {
                try {
                    await markCompleted(job.id);
                    toast.success('Job marked as completed');
                    fetchJobs();
                } catch {
                    toast.error('Failed to mark job as completed');
                }
            }
        }
    };

    const handleMarkPaid = async (job: Job) => {
        const result = await Swal.fire({
            title: 'Mark as Paid?',
            text: 'Are you sure you want to mark this job as paid?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, mark paid!',
            cancelButtonText: 'Cancel',
        });
        if (result.isConfirmed) {
            try {
                await markPaid(job.id);
                toast.success('Job marked as paid');
                fetchJobs();
            } catch {
                toast.error('Failed to mark job as paid');
            }
        }
    };

    const renderDetails = (job: Job): string => {
        if (job.job_type === 'jcb') {
            return job.total_hours != null ? `${job.total_hours} hrs` : '-';
        }
        const parts: string[] = [];
        if (job.trips != null) parts.push(`${job.trips} trips`);
        if (job.distance_km != null) parts.push(`${job.distance_km} km`);
        if (job.days != null) parts.push(`${job.days} days`);
        return parts.length > 0 ? parts.join(' / ') : '-';
    };

    const columns = [
        {
            key: 'job_date',
            label: 'Date',
            sortable: true,
            render: (job: Job) => formatDate(job.job_date),
        },
        {
            key: 'job_type',
            label: 'Type',
            render: (job: Job) => (
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        job.job_type === 'jcb'
                            ? 'bg-primary-dark-light text-primary'
                            : 'bg-secondary-dark-light text-secondary'
                    }`}
                >
                    {job.job_type.toUpperCase()}
                </span>
            ),
        },
        {
            key: 'vehicle.name',
            label: 'Vehicle',
            render: (job: Job) => job.vehicle?.name || '-',
        },
        {
            key: 'client.name',
            label: 'Client',
            render: (job: Job) => job.client?.name || '-',
        },
        {
            key: 'details',
            label: 'Details',
            render: (job: Job) => renderDetails(job),
        },
        {
            key: 'total_amount',
            label: 'Total Amount',
            sortable: true,
            render: (job: Job) => formatCurrency(job.total_amount),
        },
        {
            key: 'status',
            label: 'Status',
            render: (job: Job) => <StatusBadge status={job.status} />,
        },
    ];

    const jobTypeButtons: { value: JobTypeFilter; label: string; color: string }[] = [
        { value: 'all', label: 'All', color: 'btn-primary' },
        { value: 'jcb', label: 'JCB', color: 'btn-warning' },
        { value: 'lorry', label: 'Tipper', color: 'btn-info' },
    ];

    return (
        <div>
            <PageHeader
                title="Jobs"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Jobs' },
                ]}
                action={
                    <Link to="/jobs/create" className="btn btn-primary">
                        <svg className="w-5 h-5 ltr:mr-1.5 rtl:ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Job
                    </Link>
                }
            />

            <div className="panel">
                {/* Filter Tabs */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                    <div className="flex items-center gap-2">
                        {jobTypeButtons.map((btn) => (
                            <button
                                key={btn.value}
                                className={`btn btn-sm ${
                                    jobTypeFilter === btn.value ? btn.color : 'btn-outline-' + btn.color.replace('btn-', '')
                                }`}
                                onClick={() => setJobTypeFilter(btn.value)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    <div>
                        <select
                            className="form-select w-auto"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </div>

                <DataTable<Job>
                    columns={columns}
                    data={jobs}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={setCurrentPage}
                    onSearch={handleSearch}
                    loading={loading}
                    searchPlaceholder="Search jobs..."
                    actions={(job: Job) => (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                className="btn btn-sm btn-outline-primary"
                                title="View"
                                onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <button
                                className="btn btn-sm btn-outline-info"
                                title="Edit"
                                onClick={() => navigate(`/jobs/${job.id}/edit`)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                className="btn btn-sm btn-outline-danger"
                                title="Delete"
                                onClick={() => handleDelete(job)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            {job.status === 'pending' && (
                                <button
                                    className="btn btn-sm btn-outline-success"
                                    title="Mark Completed"
                                    onClick={() => handleMarkCompleted(job)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            )}
                            {job.status === 'completed' && (
                                <button
                                    className="btn btn-sm btn-outline-warning"
                                    title="Mark Paid"
                                    onClick={() => handleMarkPaid(job)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default JobList;
