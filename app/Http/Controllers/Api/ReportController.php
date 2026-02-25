<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\Payment;
use App\Models\VehicleExpense;
use App\Models\SalaryPayment;
use App\Models\WorkerAttendance;
use App\Models\Worker;
use App\Models\Client;
use App\Exports\ClientStatementExport;
use App\Exports\VehicleReportExport;
use App\Exports\DailyJobSummaryExport;
use App\Exports\MonthlyRevenueExpenseExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function clientStatement(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $clientId = $request->input('client_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $allJobs = Job::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $allPayments = Payment::where('client_id', $clientId)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date')
            ->get();

        $totalJcb = $allJobs->where('job_type', 'jcb')->sum('total_amount');
        $totalLorry = $allJobs->where('job_type', 'lorry')->sum('total_amount');
        $totalJobsAmount = $totalJcb + $totalLorry;
        $totalPayments = $allPayments->sum('amount');
        $outstandingBalance = $totalJobsAmount - $totalPayments;

        $jobs = Job::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->paginate(15, ['*'], 'job_page');

        $payments = Payment::where('client_id', $clientId)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date')
            ->paginate(15, ['*'], 'payment_page');

        return response()->json([
            'jobs' => $jobs,
            'payments' => $payments,
            'summary' => [
                'total_jcb_amount' => $totalJcb,
                'total_lorry_amount' => $totalLorry,
                'total_jobs_amount' => $totalJobsAmount,
                'total_payments' => $totalPayments,
                'outstanding_balance' => $outstandingBalance,
            ],
        ]);
    }

    public function monthlyRevenueExpense(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        $month = $request->input('month');
        $year = $request->input('year');

        $jobs = Job::whereMonth('job_date', $month)
            ->whereYear('job_date', $year)
            ->get();

        $jcbRevenue = $jobs->where('job_type', 'jcb')->sum('total_amount');
        $lorryRevenue = $jobs->where('job_type', 'lorry')->sum('total_amount');

        $lorryByType = $jobs->where('job_type', 'lorry')->groupBy('rate_type')->map(function ($group) {
            return $group->sum('total_amount');
        });

        $vehicleExpenses = VehicleExpense::whereMonth('expense_date', $month)
            ->whereYear('expense_date', $year)
            ->get();

        $expensesByCategory = $vehicleExpenses->groupBy('category')->map(function ($group) {
            return $group->sum('amount');
        });

        $totalVehicleExpenses = $vehicleExpenses->sum('amount');

        $salaryPayments = SalaryPayment::whereMonth('payment_date', $month)
            ->whereYear('payment_date', $year)
            ->get();

        $totalSalaryPayments = $salaryPayments->sum('amount');

        $totalRevenue = $jcbRevenue + $lorryRevenue;
        $totalExpenses = $totalVehicleExpenses + $totalSalaryPayments;
        $profitLoss = $totalRevenue - $totalExpenses;

        return response()->json([
            'revenue' => [
                'jcb_total' => $jcbRevenue,
                'jcb_count' => $jobs->where('job_type', 'jcb')->count(),
                'lorry_total' => $lorryRevenue,
                'lorry_count' => $jobs->where('job_type', 'lorry')->count(),
                'lorry_by_type' => $lorryByType,
                'total' => $totalRevenue,
            ],
            'expenses' => [
                'vehicle_expenses_by_category' => $expensesByCategory,
                'total_vehicle_expenses' => $totalVehicleExpenses,
                'total_salary_payments' => $totalSalaryPayments,
                'salary_payments_count' => $salaryPayments->count(),
                'total' => $totalExpenses,
            ],
            'profit_loss' => $profitLoss,
        ]);
    }

    public function vehicleReport(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $vehicleId = $request->input('vehicle_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $allJobs = Job::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $allExpenses = VehicleExpense::where('vehicle_id', $vehicleId)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->orderBy('expense_date')
            ->get();

        $expensesByCategory = $allExpenses->groupBy('category')->map(function ($group) {
            return $group->sum('amount');
        });

        $totalJcbRevenue = $allJobs->where('job_type', 'jcb')->sum('total_amount');
        $totalLorryRevenue = $allJobs->where('job_type', 'lorry')->sum('total_amount');
        $totalRevenue = $totalJcbRevenue + $totalLorryRevenue;
        $totalExpenses = $allExpenses->sum('amount');
        $netIncome = $totalRevenue - $totalExpenses;

        $jobs = Job::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->paginate(15, ['*'], 'job_page');

        $expenses = VehicleExpense::where('vehicle_id', $vehicleId)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->orderBy('expense_date')
            ->paginate(15, ['*'], 'expense_page');

        return response()->json([
            'jobs' => $jobs,
            'expenses' => $expenses,
            'summary' => [
                'total_jcb_revenue' => $totalJcbRevenue,
                'total_lorry_revenue' => $totalLorryRevenue,
                'total_revenue' => $totalRevenue,
                'expenses_by_category' => $expensesByCategory,
                'total_expenses' => $totalExpenses,
                'net_income' => $netIncome,
            ],
        ]);
    }

    public function dailyJobSummary(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $allJobs = Job::with(['vehicle', 'client', 'worker'])
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $jobsByDate = $allJobs->groupBy(function ($job) {
            return $job->job_date->format('Y-m-d');
        });

        $allDailySummary = $jobsByDate->keys()->sort()->values()->map(function ($date) use ($jobsByDate) {
            $dayJobs = $jobsByDate->get($date, collect());
            $jcbJobs = $dayJobs->where('job_type', 'jcb');
            $lorryJobs = $dayJobs->where('job_type', 'lorry');

            return [
                'date' => $date,
                'jobs' => $dayJobs->values(),
                'jcb_total' => $jcbJobs->sum('total_amount'),
                'lorry_total' => $lorryJobs->sum('total_amount'),
                'daily_total' => $dayJobs->sum('total_amount'),
                'jcb_count' => $jcbJobs->count(),
                'lorry_count' => $lorryJobs->count(),
            ];
        });

        $page = $request->input('page', 1);
        $perPage = 15;
        $total = $allDailySummary->count();
        $paginatedSummary = $allDailySummary->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'daily_summary' => [
                'data' => $paginatedSummary,
                'current_page' => (int) $page,
                'last_page' => (int) ceil($total / $perPage),
                'per_page' => $perPage,
                'total' => $total,
            ],
            'grand_total' => [
                'total_jcb' => $allJobs->where('job_type', 'jcb')->sum('total_amount'),
                'total_lorry' => $allJobs->where('job_type', 'lorry')->sum('total_amount'),
                'total' => $allJobs->sum('total_amount'),
                'total_jcb_count' => $allJobs->where('job_type', 'jcb')->count(),
                'total_lorry_count' => $allJobs->where('job_type', 'lorry')->count(),
            ],
        ]);
    }

    public function exportClientStatement(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'format' => 'required|in:pdf,excel',
        ]);

        $clientId = $request->input('client_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $client = Client::findOrFail($clientId);

        $allJobs = Job::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $jcbJobs = $allJobs->where('job_type', 'jcb')->values();
        $lorryJobs = $allJobs->where('job_type', 'lorry')->values();

        $payments = Payment::where('client_id', $clientId)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date')
            ->get();

        $totalJcb = $jcbJobs->sum('total_amount');
        $totalLorry = $lorryJobs->sum('total_amount');
        $totalJobsAmount = $totalJcb + $totalLorry;
        $totalPayments = $payments->sum('amount');
        $outstandingBalance = $totalJobsAmount - $totalPayments;

        $data = compact('client', 'jcbJobs', 'lorryJobs', 'payments', 'totalJcb', 'totalLorry', 'totalJobsAmount', 'totalPayments', 'outstandingBalance', 'dateFrom', 'dateTo');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.client-statement', $data)->setPaper('a4', 'landscape');
            return $pdf->download("client-statement-{$client->name}-{$dateFrom}-to-{$dateTo}.pdf");
        }

        return Excel::download(new ClientStatementExport($data), "client-statement-{$client->name}-{$dateFrom}-to-{$dateTo}.xlsx");
    }

    public function exportVehicleReport(Request $request)
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'format' => 'required|in:pdf,excel',
        ]);

        $vehicleId = $request->input('vehicle_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $vehicle = \App\Models\Vehicle::findOrFail($vehicleId);

        $allJobs = Job::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $jcbJobs = $allJobs->where('job_type', 'jcb')->values();
        $lorryJobs = $allJobs->where('job_type', 'lorry')->values();

        $expenses = VehicleExpense::where('vehicle_id', $vehicleId)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->orderBy('expense_date')
            ->get();

        $expensesByCategory = $expenses->groupBy('category')->map(fn($g) => $g->sum('amount'));
        $totalRevenue = $allJobs->sum('total_amount');
        $totalExpenses = $expenses->sum('amount');
        $netIncome = $totalRevenue - $totalExpenses;

        $data = compact('vehicle', 'jcbJobs', 'lorryJobs', 'expenses', 'expensesByCategory', 'totalRevenue', 'totalExpenses', 'netIncome', 'dateFrom', 'dateTo');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.vehicle-report', $data)->setPaper('a4', 'landscape');
            return $pdf->download("vehicle-report-{$vehicle->name}-{$dateFrom}-to-{$dateTo}.pdf");
        }

        return Excel::download(new VehicleReportExport($data), "vehicle-report-{$vehicle->name}-{$dateFrom}-to-{$dateTo}.xlsx");
    }

    public function exportDailyJobSummary(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'format' => 'required|in:pdf,excel',
        ]);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $allJobs = Job::with(['vehicle', 'client', 'worker'])
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $jobsByDate = $allJobs->groupBy(fn($job) => $job->job_date->format('Y-m-d'));

        $dailySummary = $jobsByDate->keys()->sort()->values()->map(function ($date) use ($jobsByDate) {
            $dayJobs = $jobsByDate->get($date, collect());
            return [
                'date' => $date,
                'jobs' => $dayJobs->values(),
                'jcb_total' => $dayJobs->where('job_type', 'jcb')->sum('total_amount'),
                'lorry_total' => $dayJobs->where('job_type', 'lorry')->sum('total_amount'),
                'daily_total' => $dayJobs->sum('total_amount'),
                'jcb_count' => $dayJobs->where('job_type', 'jcb')->count(),
                'lorry_count' => $dayJobs->where('job_type', 'lorry')->count(),
            ];
        });

        $grandTotal = [
            'total_jcb' => $allJobs->where('job_type', 'jcb')->sum('total_amount'),
            'total_lorry' => $allJobs->where('job_type', 'lorry')->sum('total_amount'),
            'total' => $allJobs->sum('total_amount'),
        ];

        $data = compact('dailySummary', 'grandTotal', 'dateFrom', 'dateTo');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.daily-job-summary', $data)->setPaper('a4', 'landscape');
            return $pdf->download("daily-job-summary-{$dateFrom}-to-{$dateTo}.pdf");
        }

        return Excel::download(new DailyJobSummaryExport($data), "daily-job-summary-{$dateFrom}-to-{$dateTo}.xlsx");
    }

    public function exportMonthlyRevenueExpense(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
            'format' => 'required|in:pdf,excel',
        ]);

        $month = $request->input('month');
        $year = $request->input('year');

        $jobs = Job::whereMonth('job_date', $month)->whereYear('job_date', $year)->get();
        $jcbJobs = $jobs->where('job_type', 'jcb');
        $lorryJobs = $jobs->where('job_type', 'lorry');

        $jcbRevenue = $jcbJobs->sum('total_amount');
        $lorryRevenue = $lorryJobs->sum('total_amount');
        $lorryByType = $lorryJobs->groupBy('rate_type')->map(fn($g) => $g->sum('total_amount'));

        $vehicleExpenses = VehicleExpense::whereMonth('expense_date', $month)->whereYear('expense_date', $year)->get();
        $expensesByCategory = $vehicleExpenses->groupBy('category')->map(fn($g) => $g->sum('amount'));
        $totalVehicleExpenses = $vehicleExpenses->sum('amount');

        $salaryPayments = SalaryPayment::whereMonth('payment_date', $month)->whereYear('payment_date', $year)->get();
        $totalSalaryPayments = $salaryPayments->sum('amount');

        $totalRevenue = $jcbRevenue + $lorryRevenue;
        $totalExpenses = $totalVehicleExpenses + $totalSalaryPayments;
        $profitLoss = $totalRevenue - $totalExpenses;

        $months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        $monthName = $months[$month - 1];

        $data = compact('jcbRevenue', 'lorryRevenue', 'lorryByType', 'jcbJobs', 'lorryJobs', 'expensesByCategory', 'totalVehicleExpenses', 'totalSalaryPayments', 'salaryPayments', 'totalRevenue', 'totalExpenses', 'profitLoss', 'month', 'year', 'monthName');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.monthly-revenue-expense', $data)->setPaper('a4', 'portrait');
            return $pdf->download("monthly-revenue-expense-{$monthName}-{$year}.pdf");
        }

        return Excel::download(new MonthlyRevenueExpenseExport($data), "monthly-revenue-expense-{$monthName}-{$year}.xlsx");
    }

    public function jobInvoice(string $id): JsonResponse
    {
        $job = Job::with(['vehicle', 'client', 'worker'])->findOrFail($id);

        return response()->json($job);
    }

    public function clientCombinedInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $clientId = $request->input('client_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $jobs = Job::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $client = Client::findOrFail($clientId);

        $totalJcb = $jobs->where('job_type', 'jcb')->sum('total_amount');
        $totalLorry = $jobs->where('job_type', 'lorry')->sum('total_amount');

        return response()->json([
            'client' => $client,
            'jobs' => $jobs,
            'total_jcb' => $totalJcb,
            'total_lorry' => $totalLorry,
            'grand_total' => $totalJcb + $totalLorry,
        ]);
    }

    public function workerPayslip(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'period_from' => 'required|date',
            'period_to' => 'required|date|after_or_equal:period_from',
        ]);

        $periodFrom = $request->input('period_from');
        $periodTo = $request->input('period_to');

        $worker = Worker::findOrFail($id);

        $attendance = WorkerAttendance::where('worker_id', $id)
            ->whereBetween('attendance_date', [$periodFrom, $periodTo])
            ->orderBy('attendance_date')
            ->get();

        $presentDays = $attendance->where('status', 'present')->count();
        $halfDays = $attendance->where('status', 'half_day')->count();
        $absentDays = $attendance->where('status', 'absent')->count();
        $workedDays = $presentDays + ($halfDays * 0.5);

        if ($worker->salary_type === 'daily') {
            $calculatedSalary = $workedDays * $worker->daily_rate;
        } else {
            $calculatedSalary = $worker->monthly_salary;
        }

        $salaryPayments = SalaryPayment::where('worker_id', $id)
            ->whereBetween('payment_date', [$periodFrom, $periodTo])
            ->orderBy('payment_date')
            ->get();

        $totalPaid = $salaryPayments->sum('amount');

        return response()->json([
            'worker' => $worker,
            'period_from' => $periodFrom,
            'period_to' => $periodTo,
            'attendance' => [
                'records' => $attendance,
                'present_days' => $presentDays,
                'half_days' => $halfDays,
                'absent_days' => $absentDays,
                'worked_days' => $workedDays,
            ],
            'salary' => [
                'calculated_salary' => $calculatedSalary,
                'total_paid' => $totalPaid,
                'balance' => $calculatedSalary - $totalPaid,
            ],
            'salary_payments' => $salaryPayments,
        ]);
    }

    public function monthlyPaysheet(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        $month = $request->input('month');
        $year = $request->input('year');

        $startDate = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
        $endDate = date('Y-m-t', strtotime($startDate));

        $workers = Worker::where('is_active', true)->orderBy('name')->get();

        $workerSummaries = $workers->map(function ($worker) use ($startDate, $endDate) {
            $attendance = WorkerAttendance::where('worker_id', $worker->id)
                ->whereBetween('attendance_date', [$startDate, $endDate])
                ->get();

            $presentDays = $attendance->where('status', 'present')->count();
            $halfDays = $attendance->where('status', 'half_day')->count();
            $absentDays = $attendance->where('status', 'absent')->count();
            $workedDays = $presentDays + ($halfDays * 0.5);

            if ($worker->salary_type === 'daily') {
                $calculatedSalary = $workedDays * $worker->daily_rate;
            } else {
                $calculatedSalary = $worker->monthly_salary;
            }

            $totalPaid = SalaryPayment::where('worker_id', $worker->id)
                ->whereBetween('payment_date', [$startDate, $endDate])
                ->sum('amount');

            return [
                'worker' => $worker,
                'present_days' => $presentDays,
                'half_days' => $halfDays,
                'absent_days' => $absentDays,
                'worked_days' => $workedDays,
                'calculated_salary' => $calculatedSalary,
                'total_paid' => $totalPaid,
                'balance' => $calculatedSalary - $totalPaid,
            ];
        });

        return response()->json([
            'month' => $month,
            'year' => $year,
            'workers' => $workerSummaries,
            'grand_total' => [
                'total_calculated' => $workerSummaries->sum('calculated_salary'),
                'total_paid' => $workerSummaries->sum('total_paid'),
                'total_balance' => $workerSummaries->sum('balance'),
            ],
        ]);
    }
}
