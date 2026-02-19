import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Worker } from '../../types';
import { getWorkers } from '../../services/workerService';
import { getAttendances, bulkAttendance } from '../../services/attendanceService';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface AttendanceRecord {
    worker_id: string;
    status: 'present' | 'absent' | 'half_day';
}

const AttendanceManager = () => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchActiveWorkers = useCallback(async () => {
        try {
            const response = await getWorkers({ is_active: 1, per_page: 200 } as any);
            setWorkers(response.data.data as unknown as Worker[]);
        } catch (error) {
            toast.error('Failed to fetch workers');
        }
    }, []);

    const fetchExistingAttendance = useCallback(async (date: string) => {
        try {
            const response = await getAttendances({ date, per_page: 200 } as any);
            const records = response.data.data;
            const map: Record<string, string> = {};
            records.forEach((record: any) => {
                map[String(record.worker_id)] = record.status;
            });
            setAttendanceMap(map);
        } catch (error) {
            toast.error('Failed to fetch attendance records');
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchActiveWorkers();
            await fetchExistingAttendance(selectedDate);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        fetchExistingAttendance(selectedDate);
    }, [selectedDate, fetchExistingAttendance]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const handleStatusChange = (workerId: string, status: string) => {
        setAttendanceMap((prev) => ({
            ...prev,
            [workerId]: status,
        }));
    };

    const markAllPresent = () => {
        const newMap: Record<string, string> = {};
        workers.forEach((worker) => {
            newMap[worker.id] = 'present';
        });
        setAttendanceMap(newMap);
    };

    const markAllAbsent = () => {
        const newMap: Record<string, string> = {};
        workers.forEach((worker) => {
            newMap[worker.id] = 'absent';
        });
        setAttendanceMap(newMap);
    };

    const handleSaveAll = async () => {
        const attendances: AttendanceRecord[] = workers
            .filter((worker) => attendanceMap[worker.id])
            .map((worker) => ({
                worker_id: worker.id,
                status: attendanceMap[worker.id] as 'present' | 'absent' | 'half_day',
            }));

        if (attendances.length === 0) {
            toast.error('Please mark attendance for at least one worker');
            return;
        }

        setSaving(true);
        try {
            await bulkAttendance({
                date: selectedDate,
                attendances,
            });
            toast.success('Attendance saved successfully!');
            await fetchExistingAttendance(selectedDate);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to save attendance';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    // Count stats
    const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
    const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
    const halfDayCount = Object.values(attendanceMap).filter((s) => s === 'half_day').length;
    const unmarkedCount = workers.length - presentCount - absentCount - halfDayCount;

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <PageHeader
                title="Attendance Manager"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Workers', path: '/workers' },
                    { label: 'Attendance' },
                ]}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="panel bg-gradient-to-r from-green-500 to-green-400 text-white !p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{presentCount}</div>
                            <div className="text-sm opacity-80">Present</div>
                        </div>
                        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <div className="panel bg-gradient-to-r from-red-500 to-red-400 text-white !p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{absentCount}</div>
                            <div className="text-sm opacity-80">Absent</div>
                        </div>
                        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>
                <div className="panel bg-gradient-to-r from-yellow-500 to-yellow-400 text-white !p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{halfDayCount}</div>
                            <div className="text-sm opacity-80">Half Day</div>
                        </div>
                        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="panel bg-gradient-to-r from-gray-500 to-gray-400 text-white !p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{unmarkedCount}</div>
                            <div className="text-sm opacity-80">Unmarked</div>
                        </div>
                        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="panel">
                {/* Controls */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <div>
                        <label htmlFor="attendance-date" className="label mr-2 font-semibold">
                            Date
                        </label>
                        <input
                            id="attendance-date"
                            type="date"
                            className="form-input w-auto"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={markAllPresent}
                        >
                            All Present
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={markAllAbsent}
                        >
                            All Absent
                        </button>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={saving}
                            onClick={handleSaveAll}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Attendance
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th className="w-10">#</th>
                                <th>Worker Name</th>
                                <th>Role</th>
                                <th className="text-center">Present</th>
                                <th className="text-center">Absent</th>
                                <th className="text-center">Half Day</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">
                                        No active workers found. Please add workers first.
                                    </td>
                                </tr>
                            ) : (
                                workers.map((worker, index) => {
                                    const status = attendanceMap[worker.id];
                                    return (
                                        <tr key={worker.id} className={status ? '' : 'bg-gray-50 dark:bg-gray-800/20'}>
                                            <td className="text-gray-400">{index + 1}</td>
                                            <td className="font-semibold">{worker.name}</td>
                                            <td className="text-gray-500">{worker.role || '-'}</td>
                                            <td className="text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${worker.id}`}
                                                        className="form-radio text-success cursor-pointer"
                                                        checked={status === 'present'}
                                                        onChange={() => handleStatusChange(worker.id, 'present')}
                                                    />
                                                </label>
                                            </td>
                                            <td className="text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${worker.id}`}
                                                        className="form-radio text-danger cursor-pointer"
                                                        checked={status === 'absent'}
                                                        onChange={() => handleStatusChange(worker.id, 'absent')}
                                                    />
                                                </label>
                                            </td>
                                            <td className="text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${worker.id}`}
                                                        className="form-radio text-warning cursor-pointer"
                                                        checked={status === 'half_day'}
                                                        onChange={() => handleStatusChange(worker.id, 'half_day')}
                                                    />
                                                </label>
                                            </td>
                                            <td className="text-center">
                                                {status === 'present' && (
                                                    <span className="badge bg-success/20 text-success rounded-full px-3 py-1">Present</span>
                                                )}
                                                {status === 'absent' && (
                                                    <span className="badge bg-danger/20 text-danger rounded-full px-3 py-1">Absent</span>
                                                )}
                                                {status === 'half_day' && (
                                                    <span className="badge bg-warning/20 text-warning rounded-full px-3 py-1">Half Day</span>
                                                )}
                                                {!status && (
                                                    <span className="badge bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-full px-3 py-1">Not Marked</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceManager;