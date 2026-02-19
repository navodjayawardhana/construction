import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Client } from '../../types';
import { getClient } from '../../services/clientService';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const ClientView = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchClient(id);
        }
    }, [id]);

    const fetchClient = async (clientId: string) => {
        setLoading(true);
        try {
            const response = await getClient(clientId);
            setClient(response.data);
        } catch (error) {
            toast.error('Failed to fetch client details');
            navigate('/clients');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!client) {
        return null;
    }

    return (
        <div>
            <PageHeader
                title="Client Details"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Clients', path: '/clients' },
                    { label: client.name },
                ]}
                action={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => navigate('/clients')}
                        >
                            Back
                        </button>
                    </div>
                }
            />

            <div className="panel">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Name</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">{client.name}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Company Name</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">
                            {client.company_name || '-'}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">{client.phone || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Email</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">{client.email || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Status</label>
                        <div className="mt-1">
                            <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Created At</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">
                            {new Date(client.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">
                            {client.address || '-'}
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Notes</label>
                        <p className="text-base text-dark dark:text-white-light mt-1">
                            {client.notes || '-'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientView;
