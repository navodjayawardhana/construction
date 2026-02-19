<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryPayment;
use App\Models\Worker;
use App\Models\WorkerAttendance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SalaryPayment::with('worker');

        if ($workerId = $request->input('worker_id')) {
            $query->where('worker_id', $workerId);
        }

        $payments = $query->latest('payment_date')->paginate(15);

        return response()->json($payments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'worker_id' => 'required|uuid|exists:workers,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'period_from' => 'required|date',
            'period_to' => 'required|date|after_or_equal:period_from',
            'worked_days' => 'nullable|numeric|min:0',
        ]);

        $payment = SalaryPayment::create($validated);
        $payment->load('worker');

        return response()->json($payment, 201);
    }

    public function show(string $id): JsonResponse
    {
        $payment = SalaryPayment::with('worker')->findOrFail($id);

        return response()->json($payment);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $payment = SalaryPayment::findOrFail($id);

        $validated = $request->validate([
            'worker_id' => 'sometimes|required|uuid|exists:workers,id',
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_date' => 'sometimes|required|date',
            'period_from' => 'sometimes|required|date',
            'period_to' => 'sometimes|required|date',
            'worked_days' => 'nullable|numeric|min:0',
        ]);

        $payment->update($validated);
        $payment->load('worker');

        return response()->json($payment);
    }

    public function destroy(string $id): JsonResponse
    {
        $payment = SalaryPayment::findOrFail($id);
        $payment->delete();

        return response()->json(['message' => 'Salary payment deleted successfully.']);
    }

    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'worker_id' => 'required|uuid|exists:workers,id',
            'period_from' => 'required|date',
            'period_to' => 'required|date|after_or_equal:period_from',
        ]);

        $worker = Worker::findOrFail($validated['worker_id']);

        $periodFrom = Carbon::parse($validated['period_from']);
        $periodTo = Carbon::parse($validated['period_to']);

        $attendances = WorkerAttendance::where('worker_id', $worker->id)
            ->whereBetween('attendance_date', [$periodFrom->toDateString(), $periodTo->toDateString()])
            ->get();

        $presentDays = $attendances->where('status', 'present')->count();
        $halfDays = $attendances->where('status', 'half_day')->count();
        $absentDays = $attendances->where('status', 'absent')->count();

        $workedDays = $presentDays + ($halfDays * 0.5);

        if ($worker->salary_type === 'daily') {
            $amount = $workedDays * (float) $worker->daily_rate;
        } else {
            // Monthly salary - calculate proportional amount
            $totalDaysInPeriod = $periodFrom->diffInDays($periodTo) + 1;
            $amount = ((float) $worker->monthly_salary / $totalDaysInPeriod) * $workedDays;
        }

        $amount = round($amount, 2);

        return response()->json([
            'worker_id' => $worker->id,
            'worker_name' => $worker->name,
            'salary_type' => $worker->salary_type,
            'daily_rate' => $worker->daily_rate,
            'monthly_salary' => $worker->monthly_salary,
            'period_from' => $periodFrom->toDateString(),
            'period_to' => $periodTo->toDateString(),
            'present_days' => $presentDays,
            'half_days' => $halfDays,
            'absent_days' => $absentDays,
            'worked_days' => $workedDays,
            'calculated_amount' => $amount,
        ]);
    }
}
