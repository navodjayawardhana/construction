<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\WorkerController;
use App\Http\Controllers\Api\JcbJobController;
use App\Http\Controllers\Api\LorryJobController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\WorkerAttendanceController;
use App\Http\Controllers\Api\SalaryPaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/settings', [SettingController::class, 'index']);
Route::post('/settings/verify-password', [SettingController::class, 'verifyPassword']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Vehicles
    Route::apiResource('vehicles', VehicleController::class);

    // Workers
    Route::apiResource('workers', WorkerController::class);

    // JCB Jobs
    Route::post('/jcb-jobs/bulk', [JcbJobController::class, 'bulkStore']);
    Route::patch('/jcb-jobs/{id}/complete', [JcbJobController::class, 'markCompleted']);
    Route::patch('/jcb-jobs/{id}/paid', [JcbJobController::class, 'markPaid']);
    Route::apiResource('jcb-jobs', JcbJobController::class);

    // Lorry Jobs
    Route::post('/lorry-jobs/bulk', [LorryJobController::class, 'bulkStore']);
    Route::patch('/lorry-jobs/{id}/complete', [LorryJobController::class, 'markCompleted']);
    Route::patch('/lorry-jobs/{id}/paid', [LorryJobController::class, 'markPaid']);
    Route::apiResource('lorry-jobs', LorryJobController::class);

    // Vehicle Expenses
    Route::apiResource('vehicle-expenses', VehicleExpenseController::class);

    // Worker Attendances
    Route::post('/worker-attendances/bulk', [WorkerAttendanceController::class, 'bulk']);
    Route::apiResource('worker-attendances', WorkerAttendanceController::class)->except(['show']);

    // Salary Payments
    Route::post('/salary-payments/calculate', [SalaryPaymentController::class, 'calculate']);
    Route::apiResource('salary-payments', SalaryPaymentController::class);

    // Reports
    Route::get('/reports/client-statement', [ReportController::class, 'clientStatement']);
    Route::get('/reports/monthly-revenue-expense', [ReportController::class, 'monthlyRevenueExpense']);
    Route::get('/reports/vehicle', [ReportController::class, 'vehicleReport']);
    Route::get('/reports/daily-job-summary', [ReportController::class, 'dailyJobSummary']);

    // Report Exports
    Route::get('/reports/client-statement/export', [ReportController::class, 'exportClientStatement']);
    Route::get('/reports/vehicle/export', [ReportController::class, 'exportVehicleReport']);
    Route::get('/reports/daily-job-summary/export', [ReportController::class, 'exportDailyJobSummary']);
    Route::get('/reports/monthly-revenue-expense/export', [ReportController::class, 'exportMonthlyRevenueExpense']);

    // Invoices
    Route::get('/invoices/jcb-job/{id}', [ReportController::class, 'jcbJobInvoice']);
    Route::get('/invoices/lorry-job/{id}', [ReportController::class, 'lorryJobInvoice']);
    Route::get('/invoices/client-combined', [ReportController::class, 'clientCombinedInvoice']);

    // Paysheets
    Route::get('/paysheets/worker/{id}', [ReportController::class, 'workerPayslip']);
    Route::get('/paysheets/monthly', [ReportController::class, 'monthlyPaysheet']);

    // Settings (protected)
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);
    Route::delete('/settings/logo', [SettingController::class, 'deleteLogo']);
});
