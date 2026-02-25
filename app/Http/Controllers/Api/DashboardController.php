<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
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
        $totalRevenue = Job::whereIn('status', ['completed', 'paid'])->sum('total_amount');
        $totalExpenses = VehicleExpense::sum('amount');

        $activeVehicles = Vehicle::where('status', 'active')->count();
        $activeWorkers = Worker::where('is_active', true)->count();

        $pendingJobs = Job::where('status', 'pending')->count();

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();

        $monthlyRevenueData = Job::whereIn('status', ['completed', 'paid'])
            ->where('job_date', '>=', $sixMonthsAgo)
            ->select(
                DB::raw("DATE_FORMAT(job_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('month')
            ->pluck('total', 'month');

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
            $monthlyRevenue[] = [
                'month' => $month,
                'total' => (float) ($monthlyRevenueData[$month] ?? 0),
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
