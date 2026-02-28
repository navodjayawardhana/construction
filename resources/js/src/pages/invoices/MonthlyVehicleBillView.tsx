import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MonthlyVehicleBill } from '../../types';
import { getMonthlyVehicleBill } from '../../services/monthlyVehicleBillService';
import { useSettings } from '../../contexts/SettingsContext';
import '../../styles/print.css';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MonthlyVehicleBillView = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { settings } = useSettings();
    const [bill, setBill] = useState<MonthlyVehicleBill | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchBill(id);
    }, [id]);

    const fetchBill = async (billId: string) => {
        setLoading(true);
        try {
            const response = await getMonthlyVehicleBill(billId);
            setBill(response.data);
        } catch {
            toast.error('Failed to load bill');
            navigate('/invoices/monthly-vehicle-bill');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const getVehicleTypeLabel = (type: string) => {
        const labels: Record<string, string> = { jcb: 'JCB', lorry: 'Lorry', excavator: 'Excavator', roller: 'Roller', other: 'Vehicle' };
        return labels[type] || type;
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
    }

    if (!bill) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Bill not found</div>;
    }

    const vehicle = bill.vehicle;
    const client = bill.client;
    const items = bill.items || [];
    const billRate = Number(bill.rate);
    const overtimeKms = Number(bill.overtime_kms);
    const overtimeAmount = Number(bill.overtime_amount);
    const isLorry = vehicle?.type === 'lorry';
    const perDayKm = Number(bill.per_day_km);
    const overtimeRatePerKm = Number(bill.overtime_rate);

    // Lorry-specific calculations
    const days = items.length;
    const baseAmount = days * billRate;
    const totalKm = items.reduce((sum, item) => sum + Number(item.total_hours), 0);
    const allowedKm = days * perDayKm;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Controls */}
            <div className="no-print mb-6 max-w-[210mm] mx-auto">
                <h2 className="text-xl font-bold mb-4">Monthly Vehicle Bill</h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="btn btn-success">Print</button>
                    <button onClick={() => navigate(`/invoices/monthly-vehicle-bill/${bill.id}/edit`)} className="btn btn-warning">Edit</button>
                    <button onClick={() => navigate('/invoices/monthly-vehicle-bill')} className="btn btn-outline-dark">Back to List</button>
                </div>
            </div>

            {/* A4 Bill */}
            <div className="print-content bg-white max-w-[210mm] mx-auto p-10 shadow-lg" style={{ minHeight: '297mm' }}>
                {/* Header */}
                <div className="print-header border-b-2 border-gray-800 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        {settings.business_logo && <img src={settings.business_logo} alt="Logo" className="w-12 h-12 object-contain" />}
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide">{(settings.business_name || 'CONSTRUCTION COMPANY').toUpperCase()}</h1>
                            {settings.business_address && <p className="text-sm text-gray-500 mt-0.5">{settings.business_address}</p>}
                            {settings.business_contact && <p className="text-sm text-gray-500">Tel: {settings.business_contact}</p>}
                        </div>
                    </div>
                </div>

                {/* Date & Reference */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-sm">Date: ................................</p>
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-semibold">{monthNames[bill.month - 1]} {bill.year}</p>
                    </div>
                </div>

                {/* Client Address Block */}
                <div className="mb-6">
                    <p className="font-bold">{client?.name}</p>
                    {client?.company_name && <p>{client.company_name}</p>}
                    {client?.address && <p className="text-sm">{client.address}</p>}
                </div>

                {/* Subject */}
                <div className="mb-6">
                    <p className="font-bold underline">
                        Subject: Regarding the submission of bill related to supply of {vehicle ? getVehicleTypeLabel(vehicle.type) : 'Vehicle'} for the month of {monthNames[bill.month - 1]} {bill.year}
                    </p>
                </div>

                {/* Vehicle Info */}
                <div className="mb-4 text-sm">
                    <p><span className="font-semibold">Vehicle:</span> {vehicle?.name} {vehicle?.registration_number ? `(${vehicle.registration_number})` : ''}</p>
                    {billRate > 0 && (
                        <p><span className="font-semibold">Rate:</span> {billRate.toFixed(2)} {isLorry ? 'per day' : 'per hour'}</p>
                    )}
                    {isLorry && perDayKm > 0 && (
                        <p><span className="font-semibold">Per Day KM Allowance:</span> {perDayKm.toFixed(2)} km</p>
                    )}
                    {isLorry && overtimeRatePerKm > 0 && (
                        <p><span className="font-semibold">Overtime Rate:</span> {overtimeRatePerKm.toFixed(2)} per km</p>
                    )}
                </div>

                {/* Table */}
                <table className="w-full mb-6">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left text-xs">#</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-xs">Date</th>
                            <th className="border border-gray-300 px-3 py-2 text-right text-xs">Starting Meter</th>
                            <th className="border border-gray-300 px-3 py-2 text-right text-xs">End Meter</th>
                            <th className="border border-gray-300 px-3 py-2 text-right text-xs">{isLorry ? 'Total KMs' : 'Total Hours/Kms'}</th>
                            {!isLorry && <th className="border border-gray-300 px-3 py-2 text-right text-xs">Rate</th>}
                            {!isLorry && <th className="border border-gray-300 px-3 py-2 text-right text-xs">Amount (Rs.)</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={item.id}>
                                <td className="border border-gray-300 px-3 py-1.5 text-xs">{i + 1}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-xs">{formatDate(item.item_date)}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-xs text-right">{Number(item.start_meter).toFixed(2)}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-xs text-right">{Number(item.end_meter).toFixed(2)}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-xs text-right font-semibold">{Number(item.total_hours).toFixed(2)}</td>
                                {!isLorry && <td className="border border-gray-300 px-3 py-1.5 text-xs text-right">{billRate.toFixed(2)}</td>}
                                {!isLorry && <td className="border border-gray-300 px-3 py-1.5 text-xs text-right font-semibold">{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={isLorry ? 5 : 7} className="border border-gray-300 px-3 py-4 text-center text-xs text-gray-500">
                                    No items in this bill
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-80">
                        {isLorry ? (
                            <>
                                <div className="flex justify-between py-2 border-t border-gray-300 text-sm">
                                    <span className="font-semibold">Days ({days}) x Rate ({billRate.toFixed(2)}):</span>
                                    <span className="font-bold">{formatCurrency(baseAmount)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-t border-gray-300 text-sm">
                                    <span className="font-semibold">Total KMs:</span>
                                    <span className="font-bold">{totalKm.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-t border-gray-300 text-sm">
                                    <span className="font-semibold">Allowed KMs ({days} x {perDayKm.toFixed(0)}):</span>
                                    <span className="font-bold">{allowedKm.toFixed(2)}</span>
                                </div>
                                {overtimeKms > 0 && (
                                    <div className="flex justify-between py-2 border-t border-gray-300 text-sm">
                                        <span className="font-semibold">Overtime: {overtimeKms.toFixed(2)} km x {overtimeRatePerKm.toFixed(2)}</span>
                                        <span className="font-bold">{formatCurrency(overtimeAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
                                    <span>Total Amount:</span>
                                    <span>{formatCurrency(bill.total_amount)}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between py-2 border-t border-gray-300 text-sm">
                                    <span className="font-semibold">Total Hours/Kms:</span>
                                    <span className="font-bold">{Number(bill.total_hours_sum).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
                                    <span>Total Amount:</span>
                                    <span>{formatCurrency(bill.total_amount)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {bill.notes && (
                    <div className="mb-6 text-sm">
                        <p className="font-semibold">Notes:</p>
                        <p className="text-gray-600">{bill.notes}</p>
                    </div>
                )}

                {/* Signature Blocks */}
                <div className="mt-auto pt-8">
                    <div className="grid grid-cols-2 gap-16 mt-16">
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 text-sm">Prepared By</div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 text-sm">Authorized Signature</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-16 mt-12">
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 text-sm">Received By (Client)</div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 text-sm">Date</div>
                        </div>
                    </div>
                    <div className="print-footer text-center mt-8 text-xs text-gray-400">
                        <p>Printed on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyVehicleBillView;
