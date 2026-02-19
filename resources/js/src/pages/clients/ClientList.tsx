import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Client, PaginatedResponse } from '../../types';
import { getClients, deleteClient } from '../../services/clientService';
import DataTable from '../../components/shared/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';

const ClientList = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    const fetchClients = useCallback(async (page: number, searchTerm: string) => {
        setLoading(true);
        try {
            const response = await getClients({ page, search: searchTerm || undefined });
            const paginated: PaginatedResponse<Client> = response.data;
            setClients(paginated.data);
            setCurrentPage(paginated.current_page);
            setTotalPages(paginated.last_page);
            setTotal(paginated.total);
        } catch (error) {
            toast.error('Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients(currentPage, search);
    }, [currentPage, search, fetchClients]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
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
                await deleteClient(id);
                toast.success('Client deleted successfully');
                fetchClients(currentPage, search);
            } catch (error) {
                toast.error('Failed to delete client');
            }
        }
    };

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'company_name', label: 'Company', sortable: true },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        {
            key: 'is_active',
            label: 'Status',
            render: (client: Client) => (
                <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
            ),
        },
    ];

    const actions = (client: Client) => (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                className="btn btn-sm btn-outline-info"
                onClick={() => navigate(`/clients/${client.id}`)}
            >
                View
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(`/clients/${client.id}/edit`)}
            >
                Edit
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(client.id)}
            >
                Delete
            </button>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Clients"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Clients' },
                ]}
                action={
                    <Link to="/clients/create" className="btn btn-primary">
                        Add Client
                    </Link>
                }
            />

            <div className="panel">
                <DataTable
                    columns={columns}
                    data={clients as any}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    total={total}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    loading={loading}
                    actions={actions as any}
                    searchPlaceholder="Search clients..."
                />
            </div>
        </div>
    );
};

export default ClientList;
