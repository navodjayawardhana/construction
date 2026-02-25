import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MonthlyVehicleBill, Vehicle, Client } from '../../types';
import { getMonthlyVehicleBills, deleteMonthlyVehicleBill } from '../../services/monthlyVehicleBillService';
import { getVehicles } from '../../services/vehicleService';
import { getClients } from '../../services/clientService';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MonthlyVehicleBillList = () => {
    const [bills, setBills] = useState<MonthlyVehicleBill[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [vehicleId, setVehicleId] = useState('');
    const [clientId, setClientId] = useState('');
    const now = new Date();
    const [month, setMonth] = useState<number | ''>('');
    const [year, setYear] = useState<number | ''>(now.getFullYear());

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        fetchBills();
    }, [page, vehicleId, clientId, month, year]);

    const fetchDropdowns = async () => {
        try {
            const [vRes, cRes] = await Promise.all([
                getVehicles({ page: 1 }),
                getClients({ page: 1 }),
            ]);
            setVehicles((vRes.data as any).data || []);
            setClients((cRes.data as any).data || []);
        } catch {
            toast.error('Failed to load filters');
        }
    };

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page };
            if (vehicleId) params.vehicle_id = vehicleId;
            if (clientId) params.client_id = clientId;
            if (month) params.month = month;
            if (year) params.year = year;
            const response = await getMonthlyVehicleBills(params);
            setBills(response.data.data);
            setLastPage(response.data.last_page);
        } catch {
            toast.error('Failed to load bills');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return;
        try {
            await deleteMonthlyVehicleBill(id);
            toast.success('Bill deleted');
            fetchBills();
        } catch {
            toast.error('Failed to delete bill');
        }
    };

    const formatCurrency = (amount: number) =>
        `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Monthly Vehicle Bills</h2>
                <Link to="/invoices/monthly-vehicle-bill/create" className="btn btn-primary">
                    + Create Bill
                </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <select className="form-select" value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setPage(1); }}>
                    <option value="">All Vehicles</option>
                    {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} {v.registration_number ? `(${v.registration_number})` : ''}</option>
                    ))}
                </select>
                <select className="form-select" value={clientId} onChange={(e) => { setClientId(e.target.value); setPage(1); }}>
                    <option value="">All Clients</option>
                    {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <select className="form-select" value={month} onChange={(e) => { setMonth(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
                    <option value="">All Months</option>
                    {monthNames.map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                    ))}
                </select>
                <select className="form-select" value={year} onChange={(e) => { setYear(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
                    <option value="">All Years</option>
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Period</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Total Hours</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Total Amount</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                        ) : bills.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No bills found</td></tr>
                        ) : (
                            bills.map((bill) => (
                                <tr key={bill.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        {bill.vehicle?.name} {bill.vehicle?.registration_number ? `(${bill.vehicle.registration_number})` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{bill.client?.name}</td>
                                    <td className="px-4 py-3 text-sm">{monthNames[bill.month - 1]} {bill.year}</td>
                                    <td className="px-4 py-3 text-sm text-right">{Number(bill.total_hours_sum).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(bill.total_amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/invoices/monthly-vehicle-bill/${bill.id}/view`} className="btn btn-sm btn-outline-primary" title="View/Print">
                                                View
                                            </Link>
                                            <Link to={`/invoices/monthly-vehicle-bill/${bill.id}/edit`} className="btn btn-sm btn-outline-warning" title="Edit">
                                                Edit
                                            </Link>
                                            <button onClick={() => handleDelete(bill.id)} className="btn btn-sm btn-outline-danger" title="Delete">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button className="btn btn-sm btn-outline-dark" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span className="text-sm">Page {page} of {lastPage}</span>
                    <button className="btn btn-sm btn-outline-dark" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}
        </div>
    );
};

export default MonthlyVehicleBillList;
