<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JcbJob;
use App\Models\LorryJob;
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
    /**
     * Client Statement: jobs + payments + balance for a client in date range
     */
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

        // Get ALL data for summary calculations
        $allJcbJobs = JcbJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $allLorryJobs = LorryJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $allPayments = Payment::where('client_id', $clientId)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date')
            ->get();

        $totalJcb = $allJcbJobs->sum('total_amount');
        $totalLorry = $allLorryJobs->sum('total_amount');
        $totalJobsAmount = $totalJcb + $totalLorry;
        $totalPayments = $allPayments->sum('amount');
        $outstandingBalance = $totalJobsAmount - $totalPayments;

        // Paginate each collection independently
        $jcbJobs = JcbJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->paginate(15, ['*'], 'jcb_page');

        $lorryJobs = LorryJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->paginate(15, ['*'], 'lorry_page');

        $payments = Payment::where('client_id', $clientId)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date')
            ->paginate(15, ['*'], 'payment_page');

        return response()->json([
            'jcb_jobs' => $jcbJobs,
            'lorry_jobs' => $lorryJobs,
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

    /**
     * Monthly Revenue & Expense: P&L for a given month/year
     */
    public function monthlyRevenueExpense(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        $month = $request->input('month');
        $year = $request->input('year');

        // Revenue
        $jcbJobs = JcbJob::whereMonth('job_date', $month)
            ->whereYear('job_date', $year)
            ->get();

        $lorryJobs = LorryJob::whereMonth('job_date', $month)
            ->whereYear('job_date', $year)
            ->get();

        $jcbRevenue = $jcbJobs->sum('total_amount');
        $lorryRevenue = $lorryJobs->sum('total_amount');

        // Lorry breakdown by rate_type
        $lorryByType = $lorryJobs->groupBy('rate_type')->map(function ($group) {
            return $group->sum('total_amount');
        });

        // Expenses
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
                'jcb_count' => $jcbJobs->count(),
                'lorry_total' => $lorryRevenue,
                'lorry_count' => $lorryJobs->count(),
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

    /**
     * Vehicle Report: jobs, expenses, net income for a vehicle in date range
     */
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

        // Get ALL data for summary calculations
        $allJcbJobs = JcbJob::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $allLorryJobs = LorryJob::with(['client', 'worker'])
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

        $totalRevenue = $allJcbJobs->sum('total_amount') + $allLorryJobs->sum('total_amount');
        $totalExpenses = $allExpenses->sum('amount');
        $netIncome = $totalRevenue - $totalExpenses;

        // Paginate each collection independently
        $jcbJobs = JcbJob::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->paginate(15, ['*'], 'jcb_page');

        $lorryJobs = LorryJob::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->paginate(15, ['*'], 'lorry_page');

        $expenses = VehicleExpense::where('vehicle_id', $vehicleId)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->orderBy('expense_date')
            ->paginate(15, ['*'], 'expense_page');

        return response()->json([
            'jcb_jobs' => $jcbJobs,
            'lorry_jobs' => $lorryJobs,
            'expenses' => $expenses,
            'summary' => [
                'total_jcb_revenue' => $allJcbJobs->sum('total_amount'),
                'total_lorry_revenue' => $allLorryJobs->sum('total_amount'),
                'total_revenue' => $totalRevenue,
                'expenses_by_category' => $expensesByCategory,
                'total_expenses' => $totalExpenses,
                'net_income' => $netIncome,
            ],
        ]);
    }

    /**
     * Daily Job Summary: all jobs grouped by date with daily totals
     */
    public function dailyJobSummary(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $jcbJobs = JcbJob::with(['vehicle', 'client', 'worker'])
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $lorryJobs = LorryJob::with(['vehicle', 'client', 'worker'])
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        // Group by date
        $jcbByDate = $jcbJobs->groupBy(function ($job) {
            return $job->job_date->format('Y-m-d');
        });

        $lorryByDate = $lorryJobs->groupBy(function ($job) {
            return $job->job_date->format('Y-m-d');
        });

        // Merge all dates
        $allDates = $jcbByDate->keys()->merge($lorryByDate->keys())->unique()->sort()->values();

        $allDailySummary = $allDates->map(function ($date) use ($jcbByDate, $lorryByDate) {
            $dayJcb = $jcbByDate->get($date, collect());
            $dayLorry = $lorryByDate->get($date, collect());

            return [
                'date' => $date,
                'jcb_jobs' => $dayJcb->values(),
                'lorry_jobs' => $dayLorry->values(),
                'jcb_total' => $dayJcb->sum('total_amount'),
                'lorry_total' => $dayLorry->sum('total_amount'),
                'daily_total' => $dayJcb->sum('total_amount') + $dayLorry->sum('total_amount'),
                'jcb_count' => $dayJcb->count(),
                'lorry_count' => $dayLorry->count(),
            ];
        });

        // Paginate dates
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
                'total_jcb' => $jcbJobs->sum('total_amount'),
                'total_lorry' => $lorryJobs->sum('total_amount'),
                'total' => $jcbJobs->sum('total_amount') + $lorryJobs->sum('total_amount'),
                'total_jcb_count' => $jcbJobs->count(),
                'total_lorry_count' => $lorryJobs->count(),
            ],
        ]);
    }

    /**
     * Export Client Statement as PDF or Excel
     */
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

        $jcbJobs = JcbJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $lorryJobs = LorryJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

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

    /**
     * Export Vehicle Report as PDF or Excel
     */
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

        $jcbJobs = JcbJob::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $lorryJobs = LorryJob::with(['client', 'worker'])
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $expenses = VehicleExpense::where('vehicle_id', $vehicleId)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->orderBy('expense_date')
            ->get();

        $expensesByCategory = $expenses->groupBy('category')->map(fn($g) => $g->sum('amount'));
        $totalRevenue = $jcbJobs->sum('total_amount') + $lorryJobs->sum('total_amount');
        $totalExpenses = $expenses->sum('amount');
        $netIncome = $totalRevenue - $totalExpenses;

        $data = compact('vehicle', 'jcbJobs', 'lorryJobs', 'expenses', 'expensesByCategory', 'totalRevenue', 'totalExpenses', 'netIncome', 'dateFrom', 'dateTo');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.vehicle-report', $data)->setPaper('a4', 'landscape');
            return $pdf->download("vehicle-report-{$vehicle->name}-{$dateFrom}-to-{$dateTo}.pdf");
        }

        return Excel::download(new VehicleReportExport($data), "vehicle-report-{$vehicle->name}-{$dateFrom}-to-{$dateTo}.xlsx");
    }

    /**
     * Export Daily Job Summary as PDF or Excel
     */
    public function exportDailyJobSummary(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'format' => 'required|in:pdf,excel',
        ]);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $jcbJobs = JcbJob::with(['vehicle', 'client', 'worker'])
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $lorryJobs = LorryJob::with(['vehicle', 'client', 'worker'])
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $jcbByDate = $jcbJobs->groupBy(fn($job) => $job->job_date->format('Y-m-d'));
        $lorryByDate = $lorryJobs->groupBy(fn($job) => $job->job_date->format('Y-m-d'));
        $allDates = $jcbByDate->keys()->merge($lorryByDate->keys())->unique()->sort()->values();

        $dailySummary = $allDates->map(function ($date) use ($jcbByDate, $lorryByDate) {
            $dayJcb = $jcbByDate->get($date, collect());
            $dayLorry = $lorryByDate->get($date, collect());
            return [
                'date' => $date,
                'jcb_jobs' => $dayJcb->values(),
                'lorry_jobs' => $dayLorry->values(),
                'jcb_total' => $dayJcb->sum('total_amount'),
                'lorry_total' => $dayLorry->sum('total_amount'),
                'daily_total' => $dayJcb->sum('total_amount') + $dayLorry->sum('total_amount'),
                'jcb_count' => $dayJcb->count(),
                'lorry_count' => $dayLorry->count(),
            ];
        });

        $grandTotal = [
            'total_jcb' => $jcbJobs->sum('total_amount'),
            'total_lorry' => $lorryJobs->sum('total_amount'),
            'total' => $jcbJobs->sum('total_amount') + $lorryJobs->sum('total_amount'),
        ];

        $data = compact('dailySummary', 'grandTotal', 'dateFrom', 'dateTo');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.daily-job-summary', $data)->setPaper('a4', 'landscape');
            return $pdf->download("daily-job-summary-{$dateFrom}-to-{$dateTo}.pdf");
        }

        return Excel::download(new DailyJobSummaryExport($data), "daily-job-summary-{$dateFrom}-to-{$dateTo}.xlsx");
    }

    /**
     * Export Monthly Revenue & Expense as PDF or Excel
     */
    public function exportMonthlyRevenueExpense(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
            'format' => 'required|in:pdf,excel',
        ]);

        $month = $request->input('month');
        $year = $request->input('year');

        $jcbJobs = JcbJob::whereMonth('job_date', $month)->whereYear('job_date', $year)->get();
        $lorryJobs = LorryJob::whereMonth('job_date', $month)->whereYear('job_date', $year)->get();

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

    /**
     * Single JCB Job Invoice data
     */
    public function jcbJobInvoice(string $id): JsonResponse
    {
        $job = JcbJob::with(['vehicle', 'client', 'worker'])->findOrFail($id);

        return response()->json($job);
    }

    /**
     * Single Lorry Job Invoice data
     */
    public function lorryJobInvoice(string $id): JsonResponse
    {
        $job = LorryJob::with(['vehicle', 'client', 'worker'])->findOrFail($id);

        return response()->json($job);
    }

    /**
     * Combined client invoice for multiple jobs in date range
     */
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

        $jcbJobs = JcbJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $lorryJobs = LorryJob::with(['vehicle', 'worker'])
            ->where('client_id', $clientId)
            ->whereBetween('job_date', [$dateFrom, $dateTo])
            ->orderBy('job_date')
            ->get();

        $client = Client::findOrFail($clientId);

        $totalJcb = $jcbJobs->sum('total_amount');
        $totalLorry = $lorryJobs->sum('total_amount');

        return response()->json([
            'client' => $client,
            'jcb_jobs' => $jcbJobs,
            'lorry_jobs' => $lorryJobs,
            'total_jcb' => $totalJcb,
            'total_lorry' => $totalLorry,
            'grand_total' => $totalJcb + $totalLorry,
        ]);
    }

    /**
     * Individual worker payslip for a period
     */
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

        // Calculate salary
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

    /**
     * Monthly paysheet: all workers summary for a month
     */
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
