import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CombinedInvoiceData } from '../../types/reports';
import { Client } from '../../types';
import { getClientCombinedInvoice } from '../../services/reportService';
import { getClients } from '../../services/clientService';
import { useSettings } from '../../contexts/SettingsContext';
import '../../styles/print.css';

const ClientCombinedInvoice = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [searchParams] = useSearchParams();
    const [clients, setClients] = useState<Client[]>([]);
    const [clientId, setClientId] = useState(searchParams.get('client_id') || '');
    const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');
    const [data, setData] = useState<CombinedInvoiceData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (clientId && dateFrom && dateTo) {
            handleGenerate();
        }
    }, []);

    const fetchClients = async () => {
        try {
            const response = await getClients({ page: 1 });
            setClients((response.data as any).data || []);
        } catch {
            toast.error('Failed to load clients');
        }
    };

    const handleGenerate = async () => {
        if (!clientId || !dateFrom || !dateTo) {
            toast.error('Please select client and date range');
            return;
        }
        setLoading(true);
        try {
            const response = await getClientCombinedInvoice({ client_id: clientId, date_from: dateFrom, date_to: dateTo });
            setData(response.data);
        } catch {
            toast.error('Failed to generate invoice');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateLong = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getRateTypeLabel = (type: string) => {
        const labels: Record<string, string> = { per_trip: 'Per Trip', per_km: 'Per KM', per_day: 'Per Day' };
        return labels[type] || type;
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Controls */}
            <div className="no-print mb-6 max-w-[210mm] mx-auto">
                <h2 className="text-xl font-bold mb-4">Combined Client Invoice</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-white p-4 rounded shadow">
                    <div>
                        <label className="block text-sm font-medium mb-1">Client</label>
                        <select className="form-select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                            <option value="">Select Client</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">From</label>
                        <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">To</label>
                        <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} className="btn btn-primary flex-1" disabled={loading}>
                            {loading ? 'Loading...' : 'Generate'}
                        </button>
                        {data && (
                            <button onClick={() => window.print()} className="btn btn-success">Print</button>
                        )}
                    </div>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-outline-dark mt-3">Back</button>
            </div>

            {/* A4 Invoice */}
            {data && (
                <div className="print-content bg-white max-w-[210mm] mx-auto p-10 shadow-lg" style={{ minHeight: '297mm' }}>
                    {/* Header */}
                    <div className="print-header border-b-2 border-gray-800 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            {settings.business_logo && <img src={settings.business_logo} alt="Logo" className="w-12 h-12 object-contain" />}
                            <div>
                                <h1 className="text-2xl font-bold tracking-wide">{(settings.business_name || 'CONSTRUCTION COMPANY').toUpperCase()}</h1>
                                {settings.business_address && <p className="text-sm text-gray-500 mt-0.5">{settings.business_address}</p>}
                                {settings.business_contact && <p className="text-sm text-gray-500">Tel: {settings.business_contact}</p>}
                                {!settings.business_address && !settings.business_contact && <p className="text-sm text-gray-500 mt-1">Building Excellence Since Day One</p>}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Title & Info */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">COMBINED INVOICE</h2>
                            <p className="text-sm text-gray-500 mt-1">Period: {formatDateLong(dateFrom)} to {formatDateLong(dateTo)}</p>
                        </div>
                        <div className="text-right text-sm">
                            <p><span className="font-semibold">Invoice No:</span> CMB-{data.client.id.substring(0, 8).toUpperCase()}</p>
                            <p><span className="font-semibold">Generated:</span> {formatDateLong(new Date().toISOString())}</p>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="border border-gray-300 rounded p-4 mb-8">
                        <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Bill To</h3>
                        <p className="font-bold text-base">{data.client.name}</p>
                        {data.client.company_name && <p className="text-sm">{data.client.company_name}</p>}
                        {data.client.address && <p className="text-sm text-gray-600">{data.client.address}</p>}
                        {data.client.phone && <p className="text-sm text-gray-600">Tel: {data.client.phone}</p>}
                    </div>

                    {/* All Jobs */}
                    {data.jobs.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-sm uppercase text-gray-600 mb-2">Jobs</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs">#</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs">Date</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs">Type</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs">Vehicle</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs">Location</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs">Details</th>
                                        <th className="border border-gray-300 px-3 py-2 text-right text-xs">Rate</th>
                                        <th className="border border-gray-300 px-3 py-2 text-right text-xs">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.jobs.map((job: any, i: number) => (
                                        <tr key={job.id}>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs">{i + 1}</td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs">{formatDate(job.job_date)}</td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs uppercase font-bold">{job.job_type}</td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs">{job.vehicle?.name || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs">{job.location || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs">
                                                {job.job_type === 'jcb'
                                                    ? `${Number(job.total_hours || 0).toFixed(2)}h`
                                                    : getRateTypeLabel(job.rate_type)}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs text-right">{formatCurrency(job.rate_amount)}</td>
                                            <td className="border border-gray-300 px-3 py-1.5 text-xs text-right font-semibold">{formatCurrency(job.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-end mb-8">
                        <div className="w-72 border-t-2 border-gray-800">
                            {data.total_jcb > 0 && (
                                <div className="flex justify-between py-1 text-sm">
                                    <span>JCB Total:</span>
                                    <span>{formatCurrency(data.total_jcb)}</span>
                                </div>
                            )}
                            {data.total_lorry > 0 && (
                                <div className="flex justify-between py-1 text-sm">
                                    <span>Lorry Total:</span>
                                    <span>{formatCurrency(data.total_lorry)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
                                <span>GRAND TOTAL</span>
                                <span>{formatCurrency(data.grand_total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8">
                        <div className="grid grid-cols-2 gap-16 mt-16">
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 text-sm">Customer Signature</div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 text-sm">Authorized Signature</div>
                            </div>
                        </div>
                        <div className="print-footer text-center mt-8 text-xs text-gray-400">
                            <p>Thank you for your business!</p>
                            <p className="mt-1">Printed on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientCombinedInvoice;
