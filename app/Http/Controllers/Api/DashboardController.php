<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\MonthlyVehicleBill;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use App\Models\Worker;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $jobRevenue = Job::whereIn('status', ['completed', 'paid'])->sum('total_amount');
        $monthlyBillRevenue = MonthlyVehicleBill::sum('total_amount');
        $totalRevenue = $jobRevenue + $monthlyBillRevenue;
        $totalExpenses = VehicleExpense::sum('amount');

        $activeVehicles = Vehicle::where('status', 'active')->count();
        $activeWorkers = Worker::where('is_active', true)->count();

        $pendingJobs = Job::where('status', 'pending')->count();

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();

        $monthlyJobRevenue = Job::whereIn('status', ['completed', 'paid'])
            ->where('job_date', '>=', $sixMonthsAgo)
            ->select(
                DB::raw("DATE_FORMAT(job_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('month')
            ->pluck('total', 'month');

        $monthlyBillRevenueData = MonthlyVehicleBill::whereRaw(
                "(year * 100 + month) >= ?", [$sixMonthsAgo->year * 100 + $sixMonthsAgo->month]
            )
            ->select(
                'year', 'month',
                DB::raw("CONCAT(year, '-', LPAD(month, 2, '0')) as bill_month"),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('year', 'month')
            ->pluck('total', 'bill_month');

        $monthlyExpenses = VehicleExpense::where('expense_date', '>=', $sixMonthsAgo)
            ->select(
                DB::raw("DATE_FORMAT(expense_date, '%Y-%m') as month"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->pluck('total', 'month');

        $monthlyRevenue = [];
        $monthlyExpensesData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->format('Y-m');
            $jobTotal = (float) ($monthlyJobRevenue[$month] ?? 0);
            $billTotal = (float) ($monthlyBillRevenueData[$month] ?? 0);
            $monthlyRevenue[] = [
                'month' => $month,
                'total' => $jobTotal + $billTotal,
            ];
            $monthlyExpensesData[] = [
                'month' => $month,
                'total' => (float) ($monthlyExpenses[$month] ?? 0),
            ];
        }

        $recentJobs = Job::with(['vehicle', 'client', 'worker'])
            ->latest('job_date')
            ->take(10)
            ->get();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'active_vehicles' => $activeVehicles,
            'active_workers' => $activeWorkers,
            'pending_jobs' => $pendingJobs,
            'monthly_revenue' => $monthlyRevenue,
            'monthly_expenses' => $monthlyExpensesData,
            'recent_jobs' => $recentJobs,
        ]);
    }
}
