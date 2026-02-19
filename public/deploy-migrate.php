<?php

/**
 * Deploy migration webhook
 * Triggers: php artisan migrate --force
 * Protected by a secret token
 */

// Bootstrap Laravel first
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Verify secret token - read directly from .env file to avoid cache issues
$token = $_GET['token'] ?? '';
$envFile = __DIR__ . '/../.env';
$expectedToken = '';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, 'DEPLOY_TOKEN=') === 0) {
            $expectedToken = trim(substr($line, strlen('DEPLOY_TOKEN=')));
            break;
        }
    }
}

if (empty($expectedToken) || $token !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

try {
    // Run migrations
    $exitCode = Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $output = Illuminate\Support\Facades\Artisan::output();

    // Create storage symlink
    Illuminate\Support\Facades\Artisan::call('storage:link', ['--force' => true]);
    $storageOutput = Illuminate\Support\Facades\Artisan::output();

    // Clear and rebuild caches
    Illuminate\Support\Facades\Artisan::call('config:cache');
    Illuminate\Support\Facades\Artisan::call('route:cache');
    Illuminate\Support\Facades\Artisan::call('view:cache');

    echo json_encode([
        'success' => $exitCode === 0,
        'migration_output' => trim($output),
        'storage_link' => trim($storageOutput),
        'message' => 'Migrations, storage link and cache clearing completed'
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
