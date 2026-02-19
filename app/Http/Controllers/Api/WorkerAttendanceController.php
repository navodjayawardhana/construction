<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkerAttendance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerAttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkerAttendance::with('worker');

        if ($workerId = $request->input('worker_id')) {
            $query->where('worker_id', $workerId);
        }

        // Support single date filter
        if ($date = $request->input('date')) {
            $query->where('attendance_date', Carbon::parse($date)->toDateString());
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->where('attendance_date', '>=', Carbon::parse($dateFrom)->toDateString());
        }

        if ($dateTo = $request->input('date_to')) {
            $query->where('attendance_date', '<=', Carbon::parse($dateTo)->toDateString());
        }

        $perPage = $request->input('per_page', 15);
        $attendances = $query->latest('attendance_date')->paginate($perPage);

        return response()->json($attendances);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'worker_id' => 'required|uuid|exists:workers,id',
            'attendance_date' => 'required|date',
            'status' => 'required|in:present,absent,half_day',
        ]);

        $attendance = WorkerAttendance::create($validated);
        $attendance->load('worker');

        return response()->json($attendance, 201);
    }

    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'sometimes|date',
            'attendances' => 'required|array',
            'attendances.*.worker_id' => 'required|uuid|exists:workers,id',
            'attendances.*.attendance_date' => 'sometimes|date',
            'attendances.*.status' => 'required|in:present,absent,half_day',
        ]);

        $topLevelDate = $validated['date'] ?? null;

        $records = [];
        foreach ($validated['attendances'] as $entry) {
            $attendanceDate = $entry['attendance_date'] ?? $topLevelDate;
            if (!$attendanceDate) {
                return response()->json(['message' => 'Attendance date is required.'], 422);
            }

            $records[] = WorkerAttendance::updateOrCreate(
                [
                    'worker_id' => $entry['worker_id'],
                    'attendance_date' => $attendanceDate,
                ],
                [
                    'status' => $entry['status'],
                ]
            );
        }

        return response()->json([
            'message' => 'Attendance records saved successfully.',
            'count' => count($records),
            'records' => $records,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $attendance = WorkerAttendance::findOrFail($id);

        $validated = $request->validate([
            'worker_id' => 'sometimes|required|uuid|exists:workers,id',
            'attendance_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:present,absent,half_day',
        ]);

        $attendance->update($validated);
        $attendance->load('worker');

        return response()->json($attendance);
    }

    public function destroy(string $id): JsonResponse
    {
        $attendance = WorkerAttendance::findOrFail($id);
        $attendance->delete();

        return response()->json(['message' => 'Attendance record deleted successfully.']);
    }
}
