import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { JcbJob } from '../../types';
import { getJcbJobInvoice } from '../../services/reportService';
import { useSettings } from '../../contexts/SettingsContext';
import '../../styles/print.css';

const JcbJobInvoice = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [job, setJob] = useState<JcbJob | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const response = await getJcbJobInvoice(id);
                setJob(response.data);
            } catch {
                toast.error('Failed to load invoice data');
                navigate('/jcb-jobs');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const formatCurrency = (amount: number) => {
        return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Print Button */}
            <div className="no-print mb-4 flex gap-2 max-w-[210mm] mx-auto">
                <button onClick={() => window.print()} className="btn btn-primary">
                    Print Invoice
                </button>
                <button onClick={() => navigate(-1)} className="btn btn-outline-dark">
                    Back
                </button>
            </div>

            {/* A4 Invoice */}
            <div className="print-content bg-white max-w-[210mm] mx-auto p-10 shadow-lg relative" style={{ minHeight: '297mm' }}>
                {/* Watermark Rubber Stamp */}
                <div className="invoice-watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div style={{ transform: 'rotate(-18deg)', opacity: 0.18 }}>
                        {(() => {
                            const color = job.status === 'paid' ? '#16a34a' : job.status === 'completed' ? '#2563eb' : '#dc2626';
                            const label = job.status.toUpperCase();
                            const fontSize = label.length > 7 ? 28 : label.length > 5 ? 34 : 48;
                            const spacing = label.length > 7 ? 2 : label.length > 5 ? 3 : 6;
                            return (
                                <svg width="300" height="300" viewBox="0 0 300 300" className="watermark-svg">
                                    {/* Outer ring */}
                                    <circle cx="150" cy="150" r="140" fill="none" stroke={color} strokeWidth="8" />
                                    {/* Inner ring */}
                                    <circle cx="150" cy="150" r="125" fill="none" stroke={color} strokeWidth="3" />
                                    {/* Stars */}
                                    <text x="30" y="158" fontSize="20" fill={color} fontFamily="serif">&#9733;</text>
                                    <text x="255" y="158" fontSize="20" fill={color} fontFamily="serif">&#9733;</text>
                                    {/* Horizontal lines */}
                                    <line x1="30" y1="165" x2="100" y2="165" stroke={color} strokeWidth="2" />
                                    <line x1="200" y1="165" x2="270" y2="165" stroke={color} strokeWidth="2" />
                                    <line x1="30" y1="135" x2="100" y2="135" stroke={color} strokeWidth="2" />
                                    <line x1="200" y1="135" x2="270" y2="135" stroke={color} strokeWidth="2" />
                                    {/* Main text */}
                                    <text x="150" y="158" textAnchor="middle" fontSize={fontSize} fontWeight="900" fill={color} fontFamily="Arial Black, Impact, sans-serif" letterSpacing={spacing}>
                                        {label}
                                    </text>
                                    {/* Curved text */}
                                    <defs>
                                        <path id="jcbTopArc" d="M 55,150 A 95,95 0 0,1 245,150" fill="none" />
                                        <path id="jcbBottomArc" d="M 245,160 A 95,95 0 0,1 55,160" fill="none" />
                                    </defs>
                                    <text fontSize="14" fill={color} fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="4">
                                        <textPath href="#jcbTopArc" startOffset="50%" textAnchor="middle">{(settings.business_name || 'CONSTRUCTION CO.').toUpperCase()}</textPath>
                                    </text>
                                    <text fontSize="13" fill={color} fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="3">
                                        <textPath href="#jcbBottomArc" startOffset="50%" textAnchor="middle">AUTHORIZED</textPath>
                                    </text>
                                </svg>
                            );
                        })()}
                    </div>
                </div>

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

                {/* Invoice Title & Number */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
                        <p className="text-sm text-gray-500 mt-1">JCB Job Service</p>
                    </div>
                    <div className="text-right text-sm">
                        <p><span className="font-semibold">Invoice No:</span> JCB-{job.id.substring(0, 8).toUpperCase()}</p>
                        <p><span className="font-semibold">Date:</span> {formatDate(job.job_date)}</p>
                        <p><span className="font-semibold">Status:</span> {job.status.toUpperCase()}</p>
                    </div>
                </div>

                {/* Bill To & Vehicle Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="border border-gray-300 rounded p-4">
                        <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Bill To</h3>
                        <p className="font-bold text-base">{job.client?.name || '-'}</p>
                        {job.client?.company_name && <p className="text-sm">{job.client.company_name}</p>}
                        {job.client?.address && <p className="text-sm text-gray-600">{job.client.address}</p>}
                        {job.client?.phone && <p className="text-sm text-gray-600">Tel: {job.client.phone}</p>}
                        {job.client?.email && <p className="text-sm text-gray-600">{job.client.email}</p>}
                    </div>
                    <div className="border border-gray-300 rounded p-4">
                        <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Vehicle Details</h3>
                        <p className="font-bold text-base">{job.vehicle?.name || '-'}</p>
                        {job.vehicle?.registration_number && <p className="text-sm">Reg: {job.vehicle.registration_number}</p>}
                        {job.vehicle?.make && <p className="text-sm text-gray-600">{job.vehicle.make} {job.vehicle.model || ''}</p>}
                        {job.worker && <p className="text-sm text-gray-600 mt-2">Operator: {job.worker.name}</p>}
                        {job.location && <p className="text-sm text-gray-600">Location: {job.location}</p>}
                    </div>
                </div>

                {/* Job Details Table */}
                <table className="w-full mb-6">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm">Description</th>
                            <th className="border border-gray-300 px-4 py-2 text-right text-sm w-32">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {job.start_meter > 0 && (
                            <tr>
                                <td className="border border-gray-300 px-4 py-2 text-sm">Start Meter Reading</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-right">{Number(job.start_meter).toFixed(2)}</td>
                            </tr>
                        )}
                        {job.end_meter > 0 && (
                            <tr>
                                <td className="border border-gray-300 px-4 py-2 text-sm">End Meter Reading</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-right">{Number(job.end_meter).toFixed(2)}</td>
                            </tr>
                        )}
                        <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">{job.rate_type === 'daily' ? 'Total Days' : 'Total Hours Worked'}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-right font-semibold">{Number(job.total_hours).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Rate Type</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-right capitalize">{job.rate_type}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Rate Amount</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-right">{formatCurrency(job.rate_amount)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Calculation Summary */}
                <div className="flex justify-end mb-8">
                    <div className="w-72">
                        <div className="flex justify-between py-2 border-b text-sm">
                            <span>Calculation:</span>
                            <span>{Number(job.total_hours).toFixed(2)} x {formatCurrency(job.rate_amount)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b-2 border-gray-800 text-lg font-bold">
                            <span>TOTAL AMOUNT</span>
                            <span>{formatCurrency(job.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {job.notes && (
                    <div className="mb-8 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                        <span className="font-semibold">Notes:</span> {job.notes}
                    </div>
                )}

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
        </div>
    );
};

export default JcbJobInvoice;
