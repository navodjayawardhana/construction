import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Worker, PaginatedResponse } from '../../types';
import { getWorkers, deleteWorker } from '../../services/workerService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';

const WorkerList = () => {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [salaryTypeFilter, setSalaryTypeFilter] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');

    const fetchWorkers = useCallback(async (page: number, searchTerm: string) => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page,
                search: searchTerm || undefined,
            };
            if (salaryTypeFilter) {
                params.salary_type = salaryTypeFilter;
            }
            if (isActiveFilter !== '') {
                params.is_active = isActiveFilter;
            }
            const response = await getWorkers(params);
            const paginated: PaginatedResponse<Worker> = response.data;
            setWorkers(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch workers');
        } finally {
            setLoading(false);
        }
    }, [salaryTypeFilter, isActiveFilter]);

    useEffect(() => {
        fetchWorkers(currentPage, search);
    }, [currentPage, search, fetchWorkers]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleSalaryTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSalaryTypeFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleIsActiveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIsActiveFilter(e.target.value);
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
                await deleteWorker(id);
                toast.success('Worker deleted successfully');
                fetchWorkers(currentPage, search);
            } catch (error) {
                toast.error('Failed to delete worker');
            }
        }
    };

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'phone', label: 'Phone' },
        { key: 'role', label: 'Role' },
        {
            key: 'salary_type',
            label: 'Salary Type',
            render: (worker: Worker) => (
                <span className="capitalize">{worker.salary_type}</span>
            ),
        },
        {
            key: 'daily_rate',
            label: 'Daily Rate / Monthly Salary',
            render: (worker: Worker) =>
                worker.salary_type === 'daily'
                    ? `Rs. ${Number(worker.daily_rate || 0).toLocaleString()}`
                    : `Rs. ${Number(worker.monthly_salary || 0).toLocaleString()}`,
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (worker: Worker) => (
                <StatusBadge status={worker.is_active ? 'active' : 'inactive'} />
            ),
        },
    ];

    const actions = (worker: Worker) => (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                className="btn btn-sm btn-outline-info"
                onClick={() => navigate(`/workers/${worker.id}`)}
            >
                View
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(`/workers/${worker.id}/edit`)}
            >
                Edit
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(worker.id)}
            >
                Delete
            </button>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Workers"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Workers' },
                ]}
                action={
                    <Link to="/workers/create" className="btn btn-primary">
                        Add Worker
                    </Link>
                }
            />

            <div className="panel">
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                    <div>
                        <label htmlFor="salaryTypeFilter" className="label mr-2">
                            Salary Type
                        </label>
                        <select
                            id="salaryTypeFilter"
                            className="form-select w-auto"
                            value={salaryTypeFilter}
                            onChange={handleSalaryTypeChange}
                        >
                            <option value="">All</option>
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="isActiveFilter" className="label mr-2">
                            Status
                        </label>
                        <select
                            id="isActiveFilter"
                            className="form-select w-auto"
                            value={isActiveFilter}
                            onChange={handleIsActiveChange}
                        >
                            <option value="">All</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={workers as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    loading={loading}
                    actions={actions as any}
                    searchPlaceholder="Search workers..."
                />
            </div>
        </div>
    );
};

export default WorkerList;
