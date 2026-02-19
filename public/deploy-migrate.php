<?php

/**
 * Deploy migration webhook
 * Triggers: php artisan migrate --force
 * Protected by a secret token
 */

// Verify secret token
$token = $_GET['token'] ?? '';
$expectedToken = env('DEPLOY_TOKEN', '');

if (empty($expectedToken) || $token !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Run migrations
try {
    $exitCode = Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $output = Illuminate\Support\Facades\Artisan::output();

    // Clear caches
    Illuminate\Support\Facades\Artisan::call('config:cache');
    Illuminate\Support\Facades\Artisan::call('route:cache');
    Illuminate\Support\Facades\Artisan::call('view:cache');

    echo json_encode([
        'success' => $exitCode === 0,
        'migration_output' => $output,
        'message' => 'Migrations and cache clearing completed'
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
