<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JcbJob;
use App\Models\LorryJob;
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
        $totalRevenueJcb = JcbJob::where('status', 'paid')->sum('total_amount');
        $totalRevenueLorry = LorryJob::where('status', 'paid')->sum('total_amount');
        $totalRevenue = $totalRevenueJcb + $totalRevenueLorry;

        $totalExpenses = VehicleExpense::sum('amount');

        $activeVehicles = Vehicle::where('status', 'active')->count();
        $activeWorkers = Worker::where('is_active', true)->count();

        $pendingJcb = JcbJob::where('status', 'pending')->count();
        $pendingLorry = LorryJob::where('status', 'pending')->count();
        $pendingJobs = $pendingJcb + $pendingLorry;

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();

        $monthlyRevenueJcb = JcbJob::where('status', 'paid')
            ->where('job_date', '>=', $sixMonthsAgo)
            ->select(
                DB::raw("DATE_FORMAT(job_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('month')
            ->pluck('total', 'month');

        $monthlyRevenueLorry = LorryJob::where('status', 'paid')
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

        // Build last 6 months arrays
        $monthlyRevenue = [];
        $monthlyExpensesData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->format('Y-m');
            $jcbRev = (float) ($monthlyRevenueJcb[$month] ?? 0);
            $lorryRev = (float) ($monthlyRevenueLorry[$month] ?? 0);
            $monthlyRevenue[] = [
                'month' => $month,
                'total' => $jcbRev + $lorryRev,
            ];
            $monthlyExpensesData[] = [
                'month' => $month,
                'total' => (float) ($monthlyExpenses[$month] ?? 0),
            ];
        }

        $recentJcbJobs = JcbJob::with(['vehicle', 'client', 'worker'])
            ->latest('job_date')
            ->take(5)
            ->get();

        $recentLorryJobs = LorryJob::with(['vehicle', 'client', 'worker'])
            ->latest('job_date')
            ->take(5)
            ->get();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'active_vehicles' => $activeVehicles,
            'active_workers' => $activeWorkers,
            'pending_jobs' => $pendingJobs,
            'monthly_revenue' => $monthlyRevenue,
            'monthly_expenses' => $monthlyExpensesData,
            'recent_jcb_jobs' => $recentJcbJobs,
            'recent_lorry_jobs' => $recentLorryJobs,
        ]);
    }
}
