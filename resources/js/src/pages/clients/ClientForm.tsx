import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Client } from '../../types';
import { getClient, createClient, updateClient } from '../../services/clientService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const ClientForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        address: '',
        phone: '',
        email: '',
        notes: '',
        is_active: true,
    });

    useEffect(() => {
        if (isEdit && id) {
            fetchClient(id);
        }
    }, [id, isEdit]);

    const fetchClient = async (clientId: string) => {
        setLoading(true);
        try {
            const response = await getClient(clientId);
            const client: Client = response.data;
            setFormData({
                name: client.name || '',
                company_name: client.company_name || '',
                address: client.address || '',
                phone: client.phone || '',
                email: client.email || '',
                notes: client.notes || '',
                is_active: client.is_active,
            });
        } catch (error) {
            toast.error('Failed to fetch client details');
            navigate('/clients');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEdit && id) {
                await updateClient(id, formData);
                toast.success('Client updated successfully');
            } else {
                await createClient(formData);
                toast.success('Client created successfully');
            }
            navigate('/clients');
        } catch (error: any) {
            const message = error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} client`;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <PageHeader
                title={isEdit ? 'Edit Client' : 'Add Client'}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Clients', path: '/clients' },
                    { label: isEdit ? 'Edit' : 'Add' },
                ]}
            />

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="name" className="label">
                                Name <span className="text-danger">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="Enter client name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="company_name" className="label">
                                Company Name
                            </label>
                            <input
                                id="company_name"
                                name="company_name"
                                type="text"
                                className="form-input"
                                placeholder="Enter company name"
                                value={formData.company_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="label">
                                Phone
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                className="form-input"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="label">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="address" className="label">
                            Address
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            className="form-input"
                            placeholder="Enter address"
                            rows={3}
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="notes" className="label">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="form-input"
                            placeholder="Enter notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                className="form-checkbox"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            <span className="ml-2 text-dark dark:text-white-light">Active</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => navigate('/clients')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
