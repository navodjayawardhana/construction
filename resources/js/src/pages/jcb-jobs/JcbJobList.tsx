import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { JcbJob, PaginatedResponse } from '../../types';
import { getJcbJobs, deleteJcbJob, markCompleted, markPaid } from '../../services/jcbJobService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';

const JcbJobList = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JcbJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page: currentPage,
                search: search || undefined,
                with: 'vehicle,client,worker',
            };
            if (statusFilter) {
                params.status = statusFilter;
            }
            const response = await getJcbJobs(params);
            const paginated: PaginatedResponse<JcbJob> = response.data;
            setJobs(paginated.data);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch {
            toast.error('Failed to fetch JCB jobs');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, statusFilter]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleDelete = (job: JcbJob) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This JCB job record will be permanently deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteJcbJob(job.id);
                    toast.success('JCB job deleted successfully');
                    fetchJobs();
                } catch {
                    toast.error('Failed to delete JCB job');
                }
            }
        });
    };

    const handleMarkCompleted = async (job: JcbJob) => {
        const { value: endMeter } = await Swal.fire({
            title: 'End Meter Reading',
            input: 'number',
            inputLabel: `Start Meter: ${job.start_meter ?? '-'}`,
            inputPlaceholder: 'Enter end meter reading',
            inputAttributes: {
                min: '0',
                step: '0.01',
            },
            showCancelButton: true,
            confirmButtonText: 'Complete',
            confirmButtonColor: '#00ab55',
            inputValidator: (value) => {
                if (!value || parseFloat(value) <= 0) {
                    return 'End meter reading is required';
                }
                if (job.start_meter && parseFloat(value) < Number(job.start_meter)) {
                    return 'End meter must be greater than start meter';
                }
                return null;
            },
        });

        if (!endMeter) return;

        try {
            await markCompleted(job.id, { end_meter: parseFloat(endMeter) });
            toast.success('Job marked as completed');
            fetchJobs();
        } catch {
            toast.error('Failed to update job status');
        }
    };

    const handleMarkPaid = async (job: JcbJob) => {
        try {
            await markPaid(job.id);
            toast.success('Job marked as paid');
            fetchJobs();
        } catch {
            toast.error('Failed to update job status');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const columns = [
        {
            key: 'job_date',
            label: 'Date',
            sortable: true,
            render: (item: JcbJob) => (
                <span className="font-medium">{formatDate(item.job_date)}</span>
            ),
        },
        {
            key: 'vehicle.name',
            label: 'Vehicle',
            render: (item: JcbJob) => (
                <span className="text-yellow-600 font-semibold">{item.vehicle?.name || '-'}</span>
            ),
        },
        {
            key: 'client.name',
            label: 'Client',
            render: (item: JcbJob) => item.client?.name || '-',
        },
        {
            key: 'start_meter',
            label: 'Start Meter',
            render: (item: JcbJob) => item.start_meter,
        },
        {
            key: 'end_meter',
            label: 'End Meter',
            render: (item: JcbJob) => item.end_meter,
        },
        {
            key: 'total_hours',
            label: 'Total Hours',
            render: (item: JcbJob) => (
                <span className="font-semibold">{item.total_hours}</span>
            ),
        },
        {
            key: 'total_amount',
            label: 'Total Amount',
            sortable: true,
            render: (item: JcbJob) => (
                <span className="font-bold text-amber-700">{formatCurrency(item.total_amount)}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: JcbJob) => <StatusBadge status={item.status} type="job" />,
        },
    ];

    const renderActions = (item: JcbJob) => (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
                onClick={() => navigate(`/jcb-jobs/${item.id}`)}
                className="btn btn-sm btn-outline-primary"
                title="View"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </button>
            <button
                onClick={() => navigate(`/jcb-jobs/${item.id}/edit`)}
                className="btn btn-sm btn-outline-warning"
                title="Edit"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
            <button
                onClick={() => handleDelete(item)}
                className="btn btn-sm btn-outline-danger"
                title="Delete"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            {item.status === 'pending' && (
                <button
                    onClick={() => handleMarkCompleted(item)}
                    className="btn btn-sm btn-outline-info"
                    title="Mark Complete"
                >
                    Mark Complete
                </button>
            )}
            {item.status === 'completed' && (
                <button
                    onClick={() => handleMarkPaid(item)}
                    className="btn btn-sm btn-outline-success"
                    title="Mark Paid"
                >
                    Mark Paid
                </button>
            )}
        </div>
    );

    return (
        <div>
            <PageHeader
                title="JCB Jobs"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'JCB Jobs' },
                ]}
                action={
                    <Link to="/jcb-jobs/create" className="btn btn-warning shadow-md">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add JCB Job
                    </Link>
                }
            />

            <div className="panel">
                <div className="mb-5 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-600">Status:</label>
                        <select
                            className="form-select w-auto text-sm"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={jobs as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={setCurrentPage}
                    onSearch={handleSearch}
                    loading={loading}
                    actions={renderActions as any}
                    searchPlaceholder="Search by client, vehicle, location..."
                />
            </div>
        </div>
    );
};

export default JcbJobList;
