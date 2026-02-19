import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LorryJob, PaginatedResponse } from '../../types';
import { getLorryJobs, deleteLorryJob, markCompleted, markPaid } from '../../services/lorryJobService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';

const LorryJobList = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<LorryJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchJobs = useCallback(async (page: number, searchTerm: string, status: string) => {
        setLoading(true);
        try {
            const response = await getLorryJobs({
                page,
                search: searchTerm || undefined,
                status: status || undefined,
            });
            const paginated: PaginatedResponse<LorryJob> = response.data;
            setJobs(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch lorry jobs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs(currentPage, search, statusFilter);
    }, [currentPage, search, statusFilter, fetchJobs]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await deleteLorryJob(id);
                toast.success('Lorry job deleted successfully');
                fetchJobs(currentPage, search, statusFilter);
            } catch (error) {
                toast.error('Failed to delete lorry job');
            }
        }
    };

    const handleMarkCompleted = async (id: number) => {
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
                await markCompleted(id);
                toast.success('Job marked as completed');
                fetchJobs(currentPage, search, statusFilter);
            } catch (error) {
                toast.error('Failed to update job status');
            }
        }
    };

    const handleMarkPaid = async (id: number) => {
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
                await markPaid(id);
                toast.success('Job marked as paid');
                fetchJobs(currentPage, search, statusFilter);
            } catch (error) {
                toast.error('Failed to update job status');
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
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

    const getQuantityValue = (job: LorryJob) => {
        switch (job.rate_type) {
            case 'per_trip':
                return job.trips != null ? `${job.trips} trip(s)` : '-';
            case 'per_km':
                return job.distance_km != null ? `${job.distance_km} km` : '-';
            case 'per_day':
                return job.days != null ? `${job.days} day(s)` : '-';
            default:
                return '-';
        }
    };

    const columns = [
        {
            key: 'job_date',
            label: 'Date',
            sortable: true,
            render: (job: LorryJob) => formatDate(job.job_date),
        },
        {
            key: 'vehicle.name',
            label: 'Vehicle',
            render: (job: LorryJob) => job.vehicle?.name || '-',
        },
        {
            key: 'client.name',
            label: 'Client',
            render: (job: LorryJob) => job.client?.name || '-',
        },
        {
            key: 'rate_type',
            label: 'Rate Type',
            render: (job: LorryJob) => getRateTypeLabel(job.rate_type),
        },
        {
            key: 'quantity',
            label: 'Trips/Distance/Days',
            render: (job: LorryJob) => getQuantityValue(job),
        },
        {
            key: 'total_amount',
            label: 'Total Amount',
            sortable: true,
            render: (job: LorryJob) => formatAmount(job.total_amount),
        },
        {
            key: 'status',
            label: 'Status',
            render: (job: LorryJob) => <StatusBadge status={job.status} />,
        },
    ];

    const actions = (job: LorryJob) => (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
                type="button"
                className="btn btn-sm btn-outline-info"
                onClick={() => navigate(`/lorry-jobs/${job.id}`)}
            >
                View
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(`/lorry-jobs/${job.id}/edit`)}
            >
                Edit
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(job.id)}
            >
                Delete
            </button>
            {job.status === 'pending' && (
                <button
                    type="button"
                    className="btn btn-sm btn-outline-info"
                    onClick={() => handleMarkCompleted(job.id)}
                >
                    Mark Complete
                </button>
            )}
            {job.status === 'completed' && (
                <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleMarkPaid(job.id)}
                >
                    Mark Paid
                </button>
            )}
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Lorry Jobs"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Lorry Jobs' },
                ]}
                action={
                    <Link to="/lorry-jobs/create" className="btn btn-primary">
                        Add Lorry Job
                    </Link>
                }
            />

            <div className="panel">
                <div className="mb-5">
                    <label htmlFor="statusFilter" className="text-sm font-semibold mr-2">
                        Filter by Status:
                    </label>
                    <select
                        id="statusFilter"
                        className="form-select w-auto inline-block"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>

                <DataTable
                    columns={columns}
                    data={jobs as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    loading={loading}
                    actions={actions as any}
                    searchPlaceholder="Search lorry jobs..."
                />
            </div>
        </div>
    );
};

export default LorryJobList;
