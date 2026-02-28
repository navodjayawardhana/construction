import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Vehicle } from '../../types';
import { getVehicles, deleteVehicle } from '../../services/vehicleService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getVehicles({
                page: currentPage,
                search: search || undefined,
                type: typeFilter || undefined,
            });
            const paginated = response.data;
            setVehicles(paginated.data as unknown as Vehicle[]);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch vehicles');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, typeFilter]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDelete = async (vehicle: Vehicle) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete vehicle "${vehicle.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                await deleteVehicle(vehicle.id);
                toast.success('Vehicle deleted successfully');
                fetchVehicles();
            } catch (error) {
                toast.error('Failed to delete vehicle');
            }
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
        },
        {
            key: 'registration_number',
            label: 'Registration',
            sortable: true,
            render: (item: Vehicle) => item.registration_number || '-',
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (item: Vehicle) => item.type.toUpperCase(),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: Vehicle) => <StatusBadge status={item.status} type="vehicle" />,
        },
        {
            key: 'make',
            label: 'Make/Model',
            render: (item: Vehicle) => {
                const parts = [item.make, item.model].filter(Boolean);
                return parts.length > 0 ? parts.join(' ') : '-';
            },
        },
    ];

    const vehicleTypes = [
        { value: '', label: 'All Types' },
        { value: 'jcb', label: 'JCB' },
        { value: 'lorry', label: 'Tipper' },
    ];

    return (
        <div>
            <PageHeader
                title="Vehicles"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Vehicles' },
                ]}
                action={
                    <Link to="/vehicles/create" className="btn btn-primary">
                        <svg className="w-5 h-5 ltr:mr-1.5 rtl:ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Vehicle
                    </Link>
                }
            />

            <div className="panel">
                <div className="mb-5">
                    <label htmlFor="typeFilter" className="text-sm font-semibold mb-1 block">
                        Filter by Type
                    </label>
                    <select
                        id="typeFilter"
                        className="form-select w-auto"
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        {vehicleTypes.map((vt) => (
                            <option key={vt.value} value={vt.value}>
                                {vt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <DataTable
                    columns={columns}
                    data={vehicles as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    loading={loading}
                    searchPlaceholder="Search vehicles..."
                    actions={(item: any) => {
                        const vehicle = item as Vehicle;
                        return (
                            <div className="flex items-center justify-center gap-2">
                                <Link
                                    to={`/vehicles/${vehicle.id}`}
                                    className="btn btn-sm btn-outline-info"
                                    title="View"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </Link>
                                <Link
                                    to={`/vehicles/${vehicle.id}/edit`}
                                    className="btn btn-sm btn-outline-primary"
                                    title="Edit"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    title="Delete"
                                    onClick={() => handleDelete(vehicle)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
};

export default VehicleList;
