import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Vehicle, Client, Worker } from '../../types';
import { createJcbJob, bulkCreateJcbJobs } from '../../services/jcbJobService';
import { createLorryJob, bulkCreateLorryJobs } from '../../services/lorryJobService';
import { getVehicles } from '../../services/vehicleService';
import { getClients } from '../../services/clientService';
import { getWorkers } from '../../services/workerService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// ─── Types ───────────────────────────────────────────────────
type JobType = 'jcb' | 'lorry';

interface AddedJob {
    id: number;
    job_type: JobType;
    vehicle: any;
    worker_id: string;
    worker_name: string;
    // JCB
    jcb_rate_type: 'hourly' | 'daily';
    total_hours: number;
    start_meter: string;
    end_meter: string;
    // Lorry
    lorry_rate_type: 'per_trip' | 'per_km' | 'per_day';
    trips: number;
    distance_km: number;
    days: number;
    // Common
    rate_amount: number;
    location: string;
    notes: string;
    total: number;
}

let nextId = 1;

const JobCreatePOS = () => {
    const navigate = useNavigate();

    // Shared
    const [clientId, setClientId] = useState('');
    const [jobDate, setJobDate] = useState('');

    // Data
    const [jcbVehicles, setJcbVehicles] = useState<any[]>([]);
    const [lorryVehicles, setLorryVehicles] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Vehicle selection
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [selectedJobType, setSelectedJobType] = useState<JobType>('jcb');
    const [vehicleFilter, setVehicleFilter] = useState<'all' | 'jcb' | 'lorry'>('all');

    // Current job form
    const [workerId, setWorkerId] = useState('');
    const [rateAmount, setRateAmount] = useState('');
    const [totalHours, setTotalHours] = useState('');
    const [jcbRateType, setJcbRateType] = useState<'hourly' | 'daily'>('hourly');
    const [startMeter, setStartMeter] = useState('');
    const [endMeter, setEndMeter] = useState('');
    const [lorryRateType, setLorryRateType] = useState<'per_trip' | 'per_km' | 'per_day'>('per_trip');
    const [trips, setTrips] = useState('');
    const [distanceKm, setDistanceKm] = useState('');
    const [daysVal, setDaysVal] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    // Added jobs (receipt)
    const [addedJobs, setAddedJobs] = useState<AddedJob[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const load = async () => {
            try {
                const [jcbRes, lorryRes, clientRes, workerRes] = await Promise.all([
                    getVehicles({ type: 'jcb', per_page: 100 } as any),
                    getVehicles({ type: 'lorry', per_page: 100 } as any),
                    getClients({ per_page: 100 } as any),
                    getWorkers({ per_page: 100 } as any),
                ]);
                setJcbVehicles(jcbRes.data.data as any);
                setLorryVehicles(lorryRes.data.data as any);
                setClients(clientRes.data.data as any);
                setWorkers(workerRes.data.data as any);
            } catch {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredVehicles = useMemo(() => {
        if (vehicleFilter === 'jcb') return jcbVehicles.map(v => ({ ...v, _type: 'jcb' as JobType }));
        if (vehicleFilter === 'lorry') return lorryVehicles.map(v => ({ ...v, _type: 'lorry' as JobType }));
        return [
            ...jcbVehicles.map(v => ({ ...v, _type: 'jcb' as JobType })),
            ...lorryVehicles.map(v => ({ ...v, _type: 'lorry' as JobType })),
        ];
    }, [jcbVehicles, lorryVehicles, vehicleFilter]);

    const currentTotal = useMemo(() => {
        const rate = parseFloat(rateAmount) || 0;
        if (selectedJobType === 'jcb') {
            return rate * (parseFloat(totalHours) || 0);
        }
        if (lorryRateType === 'per_trip') return rate * (parseFloat(trips) || 0);
        if (lorryRateType === 'per_km') return rate * (parseFloat(distanceKm) || 0);
        if (lorryRateType === 'per_day') return rate * (parseFloat(daysVal) || 0);
        return 0;
    }, [selectedJobType, rateAmount, totalHours, lorryRateType, trips, distanceKm, daysVal]);

    const grandTotal = useMemo(() => addedJobs.reduce((s, j) => s + j.total, 0), [addedJobs]);

    const selectVehicle = useCallback((vehicle: any, jobType: JobType) => {
        setSelectedVehicle(vehicle);
        setSelectedJobType(jobType);
        // Reset form
        setWorkerId('');
        setRateAmount('');
        setTotalHours('');
        setJcbRateType('hourly');
        setStartMeter('');
        setEndMeter('');
        setLorryRateType('per_trip');
        setTrips('');
        setDistanceKm('');
        setDaysVal('');
        setLocation('');
        setNotes('');
        setErrors({});
    }, []);

    const validateCurrentJob = (): boolean => {
        const e: Record<string, string> = {};
        if (!rateAmount || parseFloat(rateAmount) <= 0) e.rate_amount = 'Rate is required';

        if (selectedJobType === 'jcb') {
            if (!totalHours || parseFloat(totalHours) <= 0) e.total_hours = 'Hours/Days required';
            if (!startMeter || parseFloat(startMeter) <= 0) e.start_meter = 'Start meter is required';
        } else {
            if (lorryRateType === 'per_trip' && (!trips || parseFloat(trips) <= 0)) e.trips = 'Trips required';
            if (lorryRateType === 'per_km' && (!distanceKm || parseFloat(distanceKm) <= 0)) e.distance_km = 'Distance required';
            if (lorryRateType === 'per_day' && (!daysVal || parseFloat(daysVal) <= 0)) e.days = 'Days required';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const addToList = () => {
        if (!validateCurrentJob()) return;

        const worker = workers.find((w: any) => w.id === workerId);
        const job: AddedJob = {
            id: nextId++,
            job_type: selectedJobType,
            vehicle: selectedVehicle,
            worker_id: workerId,
            worker_name: worker ? worker.name : '',
            jcb_rate_type: jcbRateType,
            total_hours: parseFloat(totalHours) || 0,
            start_meter: startMeter,
            end_meter: endMeter,
            lorry_rate_type: lorryRateType,
            trips: parseFloat(trips) || 0,
            distance_km: parseFloat(distanceKm) || 0,
            days: parseFloat(daysVal) || 0,
            rate_amount: parseFloat(rateAmount) || 0,
            location,
            notes,
            total: currentTotal,
        };

        setAddedJobs(prev => [...prev, job]);
        setSelectedVehicle(null);
        toast.success('Job added to list');
    };

    const removeJob = (id: number) => {
        setAddedJobs(prev => prev.filter(j => j.id !== id));
    };

    const handleSubmit = async () => {
        if (!clientId) { toast.error('Please select a client'); return; }
        if (!jobDate) { toast.error('Please select a job date'); return; }
        if (addedJobs.length === 0) { toast.error('Please add at least one job'); return; }

        setSubmitting(true);
        try {
            const jcbJobs = addedJobs.filter(j => j.job_type === 'jcb');
            const lorryJobs = addedJobs.filter(j => j.job_type === 'lorry');
            const promises: Promise<any>[] = [];

            if (jcbJobs.length === 1) {
                const j = jcbJobs[0];
                promises.push(createJcbJob({
                    vehicle_id: j.vehicle.id, client_id: clientId, worker_id: j.worker_id || null,
                    job_date: jobDate, total_hours: j.total_hours, rate_type: j.jcb_rate_type,
                    rate_amount: j.rate_amount, start_meter: j.start_meter ? parseFloat(j.start_meter) : null,
                    end_meter: j.end_meter ? parseFloat(j.end_meter) : null,
                    total_amount: j.total, location: j.location || null, notes: j.notes || null,
                } as any));
            } else if (jcbJobs.length > 1) {
                promises.push(bulkCreateJcbJobs({
                    client_id: clientId, job_date: jobDate,
                    jobs: jcbJobs.map(j => ({
                        vehicle_id: j.vehicle.id, worker_id: j.worker_id || null,
                        total_hours: j.total_hours, rate_type: j.jcb_rate_type,
                        rate_amount: j.rate_amount, start_meter: j.start_meter ? parseFloat(j.start_meter) : null,
                        end_meter: j.end_meter ? parseFloat(j.end_meter) : null,
                        total_amount: j.total, location: j.location || null, notes: j.notes || null,
                    })),
                }));
            }

            if (lorryJobs.length === 1) {
                const j = lorryJobs[0];
                const p: Record<string, unknown> = {
                    vehicle_id: j.vehicle.id, client_id: clientId, worker_id: j.worker_id || null,
                    job_date: jobDate, rate_type: j.lorry_rate_type, rate_amount: j.rate_amount,
                    total_amount: j.total, location: j.location || null, notes: j.notes || null,
                    trips: null, distance_km: null, days: null,
                };
                if (j.lorry_rate_type === 'per_trip') p.trips = j.trips;
                else if (j.lorry_rate_type === 'per_km') p.distance_km = j.distance_km;
                else if (j.lorry_rate_type === 'per_day') p.days = j.days;
                promises.push(createLorryJob(p as any));
            } else if (lorryJobs.length > 1) {
                promises.push(bulkCreateLorryJobs({
                    client_id: clientId, job_date: jobDate,
                    jobs: lorryJobs.map(j => {
                        const p: Record<string, unknown> = {
                            vehicle_id: j.vehicle.id, worker_id: j.worker_id || null,
                            rate_type: j.lorry_rate_type, rate_amount: j.rate_amount,
                            total_amount: j.total, location: j.location || null, notes: j.notes || null,
                            trips: null, distance_km: null, days: null,
                        };
                        if (j.lorry_rate_type === 'per_trip') p.trips = j.trips;
                        else if (j.lorry_rate_type === 'per_km') p.distance_km = j.distance_km;
                        else if (j.lorry_rate_type === 'per_day') p.days = j.days;
                        return p;
                    }),
                }));
            }

            await Promise.all(promises);
            const parts: string[] = [];
            if (jcbJobs.length > 0) parts.push(`${jcbJobs.length} JCB`);
            if (lorryJobs.length > 0) parts.push(`${lorryJobs.length} Lorry`);
            toast.success(`${parts.join(' + ')} job(s) created!`);
            navigate(lorryJobs.length > jcbJobs.length ? '/lorry-jobs' : '/jcb-jobs');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create jobs');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-60px)] p-4">
            {/* ─── LEFT: Vehicle Selection ─── */}
            <div className="lg:w-[55%] flex flex-col min-h-0">
                {/* Top bar: Client + Date */}
                <div className="flex gap-3 mb-3">
                    <select
                        className="form-select flex-1"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    >
                        <option value="">-- Select Client --</option>
                        {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.company_name ? `- ${c.company_name}` : ''}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        className="form-input w-44"
                        value={jobDate}
                        onChange={(e) => setJobDate(e.target.value)}
                    />
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-3">
                    {(['all', 'jcb', 'lorry'] as const).map(f => (
                        <button
                            key={f}
                            type="button"
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                vehicleFilter === f
                                    ? f === 'jcb' ? 'bg-amber-500 text-white shadow-md' : f === 'lorry' ? 'bg-blue-500 text-white shadow-md' : 'bg-green-500 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md'
                            }`}
                            onClick={() => setVehicleFilter(f)}
                        >
                            {f === 'all' ? 'All' : f.toUpperCase()}
                            <span className="ml-1 text-xs opacity-75">
                                ({f === 'all' ? jcbVehicles.length + lorryVehicles.length : f === 'jcb' ? jcbVehicles.length : lorryVehicles.length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Vehicle Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start pb-2">
                    {filteredVehicles.map((v: any) => (
                        <button
                            key={v.id}
                            type="button"
                            className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:scale-[1.02] ${
                                selectedVehicle?.id === v.id
                                    ? v._type === 'jcb' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 shadow-lg ring-2 ring-amber-300' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg ring-2 ring-blue-300'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }`}
                            onClick={() => selectVehicle(v, v._type)}
                        >
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${v._type === 'jcb' ? 'text-amber-600' : 'text-blue-600'}`}>
                                {v._type}
                            </div>
                            <div className="font-bold text-sm text-gray-800 dark:text-white truncate">{v.name}</div>
                            {v.registration_number && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.registration_number}</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── RIGHT: Details + Receipt ─── */}
            <div className="lg:w-[45%] flex flex-col min-h-0 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                {/* Job Entry Form */}
                {selectedVehicle ? (
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${selectedJobType === 'jcb' ? 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'}`}>
                                    {selectedJobType}
                                </span>
                                <span className="ml-2 font-bold text-gray-800 dark:text-white">{selectedVehicle.name}</span>
                                {selectedVehicle.registration_number && (
                                    <span className="ml-1 text-sm text-gray-500">({selectedVehicle.registration_number})</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedVehicle(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Worker */}
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Worker</label>
                                <select className="form-select text-sm" value={workerId} onChange={e => setWorkerId(e.target.value)}>
                                    <option value="">Optional</option>
                                    {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>

                            {/* Rate Type */}
                            {selectedJobType === 'jcb' ? (
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Rate Type</label>
                                    <select className="form-select text-sm" value={jcbRateType} onChange={e => setJcbRateType(e.target.value as any)}>
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Rate Type</label>
                                    <select className="form-select text-sm" value={lorryRateType} onChange={e => setLorryRateType(e.target.value as any)}>
                                        <option value="per_trip">Per Trip</option>
                                        <option value="per_km">Per KM</option>
                                        <option value="per_day">Per Day</option>
                                    </select>
                                </div>
                            )}

                            {/* Rate Amount */}
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Rate (Rs.) *</label>
                                <input
                                    type="number" className={`form-input text-sm ${errors.rate_amount ? 'border-danger' : ''}`}
                                    value={rateAmount} onChange={e => { setRateAmount(e.target.value); setErrors(p => { const c = {...p}; delete c.rate_amount; return c; }); }}
                                    placeholder="0.00" step="0.01"
                                />
                                {errors.rate_amount && <p className="text-danger text-xs mt-0.5">{errors.rate_amount}</p>}
                            </div>

                            {/* Quantity */}
                            {selectedJobType === 'jcb' ? (
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">{jcbRateType === 'daily' ? 'Days' : 'Hours'} *</label>
                                    <input
                                        type="number" className={`form-input text-sm ${errors.total_hours ? 'border-danger' : ''}`}
                                        value={totalHours} onChange={e => { setTotalHours(e.target.value); setErrors(p => { const c = {...p}; delete c.total_hours; return c; }); }}
                                        placeholder="0" step="0.01"
                                    />
                                    {errors.total_hours && <p className="text-danger text-xs mt-0.5">{errors.total_hours}</p>}
                                </div>
                            ) : (
                                <div>
                                    {lorryRateType === 'per_trip' && (
                                        <>
                                            <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Trips *</label>
                                            <input type="number" className={`form-input text-sm ${errors.trips ? 'border-danger' : ''}`} value={trips} onChange={e => { setTrips(e.target.value); setErrors(p => { const c = {...p}; delete c.trips; return c; }); }} placeholder="0" step="1" />
                                            {errors.trips && <p className="text-danger text-xs mt-0.5">{errors.trips}</p>}
                                        </>
                                    )}
                                    {lorryRateType === 'per_km' && (
                                        <>
                                            <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">KM *</label>
                                            <input type="number" className={`form-input text-sm ${errors.distance_km ? 'border-danger' : ''}`} value={distanceKm} onChange={e => { setDistanceKm(e.target.value); setErrors(p => { const c = {...p}; delete c.distance_km; return c; }); }} placeholder="0.00" step="0.01" />
                                            {errors.distance_km && <p className="text-danger text-xs mt-0.5">{errors.distance_km}</p>}
                                        </>
                                    )}
                                    {lorryRateType === 'per_day' && (
                                        <>
                                            <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Days *</label>
                                            <input type="number" className={`form-input text-sm ${errors.days ? 'border-danger' : ''}`} value={daysVal} onChange={e => { setDaysVal(e.target.value); setErrors(p => { const c = {...p}; delete c.days; return c; }); }} placeholder="0" step="0.5" />
                                            {errors.days && <p className="text-danger text-xs mt-0.5">{errors.days}</p>}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* JCB meters */}
                            {selectedJobType === 'jcb' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Start Meter *</label>
                                        <input type="number" className={`form-input text-sm ${errors.start_meter ? 'border-danger' : ''}`} value={startMeter} onChange={e => { setStartMeter(e.target.value); setErrors(p => { const c = {...p}; delete c.start_meter; return c; }); }} placeholder="Enter start meter" step="0.01" />
                                        {errors.start_meter && <p className="text-danger text-xs mt-0.5">{errors.start_meter}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">End Meter</label>
                                        <input type="number" className="form-input text-sm" value={endMeter} onChange={e => setEndMeter(e.target.value)} placeholder="Optional" step="0.01" />
                                    </div>
                                </>
                            )}

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Location</label>
                                <input type="text" className="form-input text-sm" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Notes</label>
                                <input type="text" className="form-input text-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" />
                            </div>
                        </div>

                        {/* Current total + Add button */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-right">
                                <span className="text-xs text-gray-500">Line Total: </span>
                                <span className={`text-xl font-bold ${selectedJobType === 'jcb' ? 'text-amber-600' : 'text-blue-600'}`}>
                                    Rs. {currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <button
                                type="button"
                                className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all hover:scale-105 ${selectedJobType === 'jcb' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                                onClick={addToList}
                            >
                                + Add Job
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <p className="text-sm">Select a vehicle from the left to add a job</p>
                    </div>
                )}

                {/* Receipt / Added Jobs List */}
                <div className="flex-1 overflow-y-auto p-3">
                    {addedJobs.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No jobs added yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {addedJobs.map((job, idx) => (
                                <div key={job.id} className={`flex items-center gap-3 p-2 rounded-lg border ${job.job_type === 'jcb' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800' : 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800'}`}>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${job.job_type === 'jcb' ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200' : 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200'}`}>
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[10px] uppercase font-bold ${job.job_type === 'jcb' ? 'text-amber-500' : 'text-blue-500'}`}>{job.job_type}</span>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">{job.vehicle.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {job.job_type === 'jcb'
                                                ? `${job.total_hours}${job.jcb_rate_type === 'daily' ? 'd' : 'h'} x Rs.${job.rate_amount}`
                                                : `${job.lorry_rate_type === 'per_trip' ? `${job.trips} trip(s)` : job.lorry_rate_type === 'per_km' ? `${job.distance_km}km` : `${job.days}d`} x Rs.${job.rate_amount}`
                                            }
                                            {job.location && ` | ${job.location}`}
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-gray-800 dark:text-white whitespace-nowrap">
                                        Rs. {job.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeJob(job.id)}
                                        className="text-red-400 hover:text-red-600 shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grand Total + Submit */}
                <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{addedJobs.length} job(s)</span>
                            {addedJobs.filter(j => j.job_type === 'jcb').length > 0 && addedJobs.filter(j => j.job_type === 'lorry').length > 0 && (
                                <span className="text-xs text-gray-400 ml-1">
                                    ({addedJobs.filter(j => j.job_type === 'jcb').length} JCB + {addedJobs.filter(j => j.job_type === 'lorry').length} Lorry)
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Grand Total</p>
                            <p className="text-2xl font-black text-green-600 dark:text-green-400">
                                Rs. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-dark flex-shrink-0"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-success flex-1 font-bold shadow-lg"
                            disabled={submitting || addedJobs.length === 0}
                            onClick={handleSubmit}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4"></span>
                                    Submitting...
                                </span>
                            ) : (
                                `Submit ${addedJobs.length} Job${addedJobs.length !== 1 ? 's' : ''}`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobCreatePOS;
