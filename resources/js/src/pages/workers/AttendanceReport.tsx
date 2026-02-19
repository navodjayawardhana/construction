import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Worker } from '../../types';
import { getWorkers } from '../../services/workerService';
import { getAttendances } from '../../services/attendanceService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface AttendanceRecord {
    id: string;
    worker_id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'half_day';
    worker?: Worker;
}

const AttendanceReport = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState(firstOfMonth);
    const [dateTo, setDateTo] = useState(todayStr);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);

    const fetchWorkers = useCallback(async () => {
        try {
            const response = await getWorkers({ per_page: 200 } as any);
            setWorkers(response.data.data as unknown as Worker[]);
        } catch {
            toast.error('Failed to fetch workers');
        }
    }, []);

    const fetchAttendance = useCallback(async () => {
        setFetching(true);
        try {
            const params: any = { date_from: dateFrom, date_to: dateTo, per_page: 200 };
            if (selectedWorkerId) {
                params.worker_id = selectedWorkerId;
            }
            const response = await getAttendances(params);
            setRecords(response.data.data as unknown as AttendanceRecord[]);
        } catch {
            toast.error('Failed to fetch attendance records');
        } finally {
            setFetching(false);
        }
    }, [dateFrom, dateTo, selectedWorkerId]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchWorkers();
            await fetchAttendance();
            setLoading(false);
        };
        init();
    }, []);

    const handleSearch = () => {
        fetchAttendance();
    };

    // Calculate summary
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const halfDayCount = records.filter((r) => r.status === 'half_day').length;
    const totalDays = presentCount + halfDayCount * 0.5;

    // Group by worker for summary view
    const workerSummary = records.reduce<Record<string, { name: string; role: string; present: number; absent: number; half_day: number }>>((acc, record) => {
        const wid = record.worker_id;
        if (!acc[wid]) {
            acc[wid] = {
                name: record.worker?.name || 'Unknown',
                role: (record.worker as any)?.role || '-',
                present: 0,
                absent: 0,
                half_day: 0,
            };
        }
        acc[wid][record.status]++;
        return acc;
    }, {});

    const statusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="badge bg-success/20 text-success rounded-full px-3 py-1">Present</span>;
            case 'absent':
                return <span className="badge bg-danger/20 text-danger rounded-full px-3 py-1">Absent</span>;
            case 'half_day':
                return <span className="badge bg-warning/20 text-warning rounded-full px-3 py-1">Half Day</span>;
            default:
                return <span className="badge bg-gray-200 text-gray-500 rounded-full px-3 py-1">{status}</span>;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <PageHeader
                title="Attendance Report"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Workers', path: '/workers' },
                    { label: 'Attendance Report' },
                ]}
                action={
                    <Link to="/attendance" className="btn btn-primary">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Mark Attendance
                    </Link>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="panel bg-gradient-to-r from-green-500 to-green-400 text-white !p-4">
                    <div className="text-2xl font-bold">{presentCount}</div>
                    <div className="text-sm opacity-80">Present Records</div>
                </div>
                <div className="panel bg-gradient-to-r from-red-500 to-red-400 text-white !p-4">
                    <div className="text-2xl font-bold">{absentCount}</div>
                    <div className="text-sm opacity-80">Absent Records</div>
                </div>
                <div className="panel bg-gradient-to-r from-yellow-500 to-yellow-400 text-white !p-4">
                    <div className="text-2xl font-bold">{halfDayCount}</div>
                    <div className="text-sm opacity-80">Half Day Records</div>
                </div>
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-400 text-white !p-4">
                    <div className="text-2xl font-bold">{totalDays}</div>
                    <div className="text-sm opacity-80">Total Working Days</div>
                </div>
            </div>

            {/* Filters */}
            <div className="panel mb-6">
                <div className="flex items-end gap-4 flex-wrap">
                    <div>
                        <label className="label font-semibold">From Date</label>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label font-semibold">To Date</label>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label font-semibold">Worker</label>
                        <select
                            className="form-select w-auto min-w-[200px]"
                            value={selectedWorkerId}
                            onChange={(e) => setSelectedWorkerId(e.target.value)}
                        >
                            <option value="">All Workers</option>
                            {workers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={fetching}
                    >
                        {fetching ? 'Loading...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Worker Summary Table */}
            {Object.keys(workerSummary).length > 0 && !selectedWorkerId && (
                <div className="panel mb-6">
                    <h3 className="text-lg font-bold mb-4">Worker Summary</h3>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Worker Name</th>
                                    <th>Role</th>
                                    <th className="text-center">Present</th>
                                    <th className="text-center">Absent</th>
                                    <th className="text-center">Half Day</th>
                                    <th className="text-center">Total Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(workerSummary).map(([wid, summary], index) => (
                                    <tr key={wid}>
                                        <td className="text-gray-400">{index + 1}</td>
                                        <td className="font-semibold">{summary.name}</td>
                                        <td className="text-gray-500">{summary.role}</td>
                                        <td className="text-center">
                                            <span className="text-success font-bold">{summary.present}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-danger font-bold">{summary.absent}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-warning font-bold">{summary.half_day}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="font-bold text-primary">{summary.present + summary.half_day * 0.5}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detailed Records Table */}
            <div className="panel">
                <h3 className="text-lg font-bold mb-4">Detailed Records ({records.length})</h3>
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Worker Name</th>
                                <th>Role</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        No attendance records found for the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record, index) => (
                                    <tr key={record.id}>
                                        <td className="text-gray-400">{index + 1}</td>
                                        <td>{new Date(record.attendance_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="font-semibold">{record.worker?.name || 'Unknown'}</td>
                                        <td className="text-gray-500">{(record.worker as any)?.role || '-'}</td>
                                        <td className="text-center">{statusBadge(record.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReport;