import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Vehicle, Client } from '../../types';
import {
    getMonthlyVehicleBill,
    createMonthlyVehicleBill,
    updateMonthlyVehicleBill,
} from '../../services/monthlyVehicleBillService';
import { getVehicles } from '../../services/vehicleService';
import { getClients } from '../../services/clientService';

interface ItemRow {
    key: number;
    item_date: string;
    start_meter: number | '';
    end_meter: number | '';
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let rowKeyCounter = 0;
const nextKey = () => ++rowKeyCounter;

const MonthlyVehicleBillForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const now = new Date();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [vehicleId, setVehicleId] = useState('');
    const [clientId, setClientId] = useState('');
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [rate, setRate] = useState<number | ''>('');
    const [perDayKm, setPerDayKm] = useState<number | ''>('');
    const [overtimeRate, setOvertimeRate] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);
    const isLorry = selectedVehicle?.type === 'lorry';

    useEffect(() => {
        fetchDropdowns();
        if (isEdit && id) {
            fetchBill(id);
        }
    }, [id]);

    const fetchDropdowns = async () => {
        try {
            const [vRes, cRes] = await Promise.all([
                getVehicles({ page: 1 }),
                getClients({ page: 1 }),
            ]);
            setVehicles((vRes.data as any).data || []);
            setClients((cRes.data as any).data || []);
        } catch {
            toast.error('Failed to load data');
        }
    };

    const fetchBill = async (billId: string) => {
        setLoading(true);
        try {
            const response = await getMonthlyVehicleBill(billId);
            const bill = response.data;
            setVehicleId(bill.vehicle_id);
            setClientId(bill.client_id);
            setMonth(bill.month);
            setYear(bill.year);
            setRate(Number(bill.rate));
            setPerDayKm(Number(bill.per_day_km));
            setOvertimeRate(Number(bill.overtime_rate));
            setNotes(bill.notes || '');
            setItems(
                (bill.items || []).map((item) => ({
                    key: nextKey(),
                    item_date: typeof item.item_date === 'string' ? item.item_date.split('T')[0] : item.item_date,
                    start_meter: Number(item.start_meter),
                    end_meter: Number(item.end_meter),
                }))
            );
        } catch {
            toast.error('Failed to load bill');
            navigate('/invoices/monthly-vehicle-bill');
        } finally {
            setLoading(false);
        }
    };

    const addManualRow = () => {
        let nextDate = `${year}-${String(month).padStart(2, '0')}-01`;
        let startMeter: number | '' = '';
        if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (lastItem.item_date) {
                const d = new Date(lastItem.item_date);
                d.setDate(d.getDate() + 1);
                nextDate = d.toISOString().split('T')[0];
            }
            if (lastItem.end_meter !== '') startMeter = lastItem.end_meter;
        }
        setItems([
            ...items,
            {
                key: nextKey(),
                item_date: nextDate,
                start_meter: startMeter,
                end_meter: '',
            },
        ]);
    };

    const updateItem = (key: number, field: keyof ItemRow, value: any) => {
        setItems(items.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    };

    const removeItem = (key: number) => {
        setItems(items.filter((item) => item.key !== key));
    };

    // Calculations
    const num = (v: number | '') => v === '' ? 0 : v;
    const calcTotalValue = (item: ItemRow) => num(item.end_meter) - num(item.start_meter);
    const calcAmount = (item: ItemRow) => calcTotalValue(item) * num(rate);
    const totalValueSum = items.reduce((sum, item) => sum + calcTotalValue(item), 0);

    // JCB calculations
    const itemsTotal = items.reduce((sum, item) => sum + calcAmount(item), 0);
    const jcbGrandTotal = itemsTotal;

    // Lorry calculations
    const days = items.length;
    const baseAmount = days * num(rate);
    const allowedKm = days * num(perDayKm);
    const lorryOvertimeKms = Math.max(0, totalValueSum - allowedKm);
    const lorryOvertimeAmount = lorryOvertimeKms * num(overtimeRate);
    const lorryGrandTotal = baseAmount + lorryOvertimeAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleId || !clientId) {
            toast.error('Select vehicle and client');
            return;
        }
        if (items.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                vehicle_id: vehicleId,
                client_id: clientId,
                month,
                year,
                overtime_kms: isLorry ? lorryOvertimeKms : 0,
                rate: num(rate),
                per_day_km: isLorry ? num(perDayKm) : 0,
                overtime_rate: isLorry ? num(overtimeRate) : 0,
                notes: notes || undefined,
                items: items.map((item) => ({
                    item_date: item.item_date,
                    start_meter: num(item.start_meter),
                    end_meter: num(item.end_meter),
                })),
            };

            if (isEdit && id) {
                await updateMonthlyVehicleBill(id, payload);
                toast.success('Bill updated');
            } else {
                await createMonthlyVehicleBill(payload);
                toast.success('Bill created');
            }
            navigate('/invoices/monthly-vehicle-bill');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to save bill';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">{isEdit ? 'Edit' : 'Create'} Monthly Vehicle Bill</h2>

            <form onSubmit={handleSubmit}>
                {/* Header Fields */}
                <div className="bg-white rounded shadow p-6 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Vehicle *</label>
                            <select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                                <option value="">Select Vehicle</option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name} {v.registration_number ? `(${v.registration_number})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Client *</label>
                            <select className="form-select" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                                <option value="">Select Client</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Month *</label>
                            <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                                {monthNames.map((name, i) => (
                                    <option key={i} value={i + 1}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Year *</label>
                            <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isLorry ? (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Rate (per day) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Per Day KM *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={perDayKm}
                                    onChange={(e) => setPerDayKm(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Overtime Rate (per km) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={overtimeRate}
                                    onChange={(e) => setOvertimeRate(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <input type="text" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Rate (per hour) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <input type="text" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Items Section */}
                <div className="bg-white rounded shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Bill Items</h3>
                        <button type="button" onClick={addManualRow} className="btn btn-outline-success">
                            + Add Row
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-2 py-2 text-left text-xs font-semibold">#</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold">Date</th>
                                    <th className="px-2 py-2 text-right text-xs font-semibold">Start Meter</th>
                                    <th className="px-2 py-2 text-right text-xs font-semibold">End Meter</th>
                                    <th className="px-2 py-2 text-right text-xs font-semibold">{isLorry ? 'Total KMs' : 'Total Hours'}</th>
                                    {!isLorry && <th className="px-2 py-2 text-right text-xs font-semibold">Amount</th>}
                                    <th className="px-2 py-2 text-center text-xs font-semibold w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={isLorry ? 6 : 7} className="px-2 py-8 text-center text-gray-500 text-sm">
                                            Click "+ Add Row" to add items.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={item.key} className="border-b">
                                            <td className="px-2 py-1 text-sm">{idx + 1}</td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="date"
                                                    className="form-input text-sm py-1"
                                                    value={item.item_date}
                                                    onChange={(e) => updateItem(item.key, 'item_date', e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    className="form-input text-sm py-1 text-right w-28"
                                                    value={item.start_meter}
                                                    onChange={(e) => updateItem(item.key, 'start_meter', e.target.value === '' ? '' : Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    className="form-input text-sm py-1 text-right w-28"
                                                    value={item.end_meter}
                                                    onChange={(e) => updateItem(item.key, 'end_meter', e.target.value === '' ? '' : Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-1 text-right text-sm font-semibold">
                                                {calcTotalValue(item).toFixed(2)}
                                            </td>
                                            {!isLorry && (
                                                <td className="px-2 py-1 text-right text-sm font-semibold">
                                                    {calcAmount(item).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            )}
                                            <td className="px-2 py-1 text-center">
                                                <button type="button" onClick={() => removeItem(item.key)} className="text-red-500 hover:text-red-700 text-sm" title="Remove">
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    {items.length > 0 && (
                        <div className="flex justify-end mt-4">
                            <div className="w-80 text-sm">
                                {isLorry ? (
                                    <>
                                        <div className="flex justify-between py-1 border-t">
                                            <span className="font-semibold">Days ({days}) x Rate ({num(rate).toFixed(2)}):</span>
                                            <span className="font-bold">Rs. {baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-t">
                                            <span className="font-semibold">Total KMs:</span>
                                            <span className="font-bold">{totalValueSum.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-t">
                                            <span className="font-semibold">Allowed KMs ({days} x {num(perDayKm)}):</span>
                                            <span className="font-bold">{allowedKm.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-t">
                                            <span className="font-semibold">Overtime KMs:</span>
                                            <span className="font-bold">{lorryOvertimeKms.toFixed(2)}</span>
                                        </div>
                                        {lorryOvertimeKms > 0 && (
                                            <div className="flex justify-between py-1 border-t">
                                                <span className="font-semibold">Overtime: {lorryOvertimeKms.toFixed(2)} x {num(overtimeRate).toFixed(2)}</span>
                                                <span className="font-bold">Rs. {lorryOvertimeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-2 border-t-2 border-gray-800 text-base font-bold">
                                            <span>Grand Total:</span>
                                            <span>Rs. {lorryGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between py-1 border-t">
                                            <span className="font-semibold">Total Hours/Kms:</span>
                                            <span className="font-bold">{totalValueSum.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t-2 border-gray-800 text-base font-bold">
                                            <span>Grand Total:</span>
                                            <span>Rs. {jcbGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : isEdit ? 'Update Bill' : 'Save Bill'}
                    </button>
                    <button type="button" onClick={() => navigate('/invoices/monthly-vehicle-bill')} className="btn btn-outline-dark">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MonthlyVehicleBillForm;
