<?php

/**
 * Deploy migration webhook
 * First run: creates .env, generates key, migrates, seeds
 * Subsequent runs: migrates, seeds production, caches
 */

$basePath = dirname(__DIR__);
$envFile = $basePath . '/.env';
$firstRun = false;

// First run: create .env if missing
if (!file_exists($envFile)) {
    $firstRun = true;
    $envContent = 'APP_NAME="Samantha Constructions"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://admin.samanthaconstructions.lk

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=candeadi_samcons
DB_USERNAME=candeadi_samcons
DB_PASSWORD="Co#Sn65!jkQ"

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

DEPLOY_TOKEN=SC2026-DEPLOY-X9K2M
ADMIN_KEY=dev@1234';
    file_put_contents($envFile, $envContent);

    // Ensure storage directories exist
    $dirs = [
        $basePath . '/storage/app/public',
        $basePath . '/storage/framework/cache/data',
        $basePath . '/storage/framework/sessions',
        $basePath . '/storage/framework/views',
        $basePath . '/storage/logs',
    ];
    foreach ($dirs as $d) {
        if (!is_dir($d)) mkdir($d, 0755, true);
    }
}

// Bootstrap Laravel
require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Verify token (from .env or hardcoded for first run)
$token = $_GET['token'] ?? '';
$expectedToken = '';
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    $line = trim($line);
    if (strpos($line, 'DEPLOY_TOKEN=') === 0) {
        $expectedToken = trim(substr($line, strlen('DEPLOY_TOKEN=')));
        break;
    }
}

if (empty($expectedToken) || $token !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');
$results = [];

try {
    // Generate APP_KEY on first run
    if ($firstRun) {
        Illuminate\Support\Facades\Artisan::call('key:generate', ['--force' => true]);
        $results['key_generated'] = true;
    }

    // Run migrations
    $exitCode = Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $results['migration_output'] = trim(Illuminate\Support\Facades\Artisan::output());

    // Run seeders
    if ($firstRun) {
        // First run: full DatabaseSeeder
        Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $results['seeder'] = 'DatabaseSeeder (first run)';
    } else {
        // Subsequent: only ProductionSeeder
        Illuminate\Support\Facades\Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\ProductionSeeder',
            '--force' => true
        ]);
        $results['seeder'] = 'ProductionSeeder';
    }
    $results['seed_output'] = trim(Illuminate\Support\Facades\Artisan::output());

    // Storage symlink
    Illuminate\Support\Facades\Artisan::call('storage:link', ['--force' => true]);
    $results['storage_link'] = trim(Illuminate\Support\Facades\Artisan::output());

    // Cache for production
    Illuminate\Support\Facades\Artisan::call('config:cache');
    Illuminate\Support\Facades\Artisan::call('route:cache');
    Illuminate\Support\Facades\Artisan::call('view:cache');

    $results['success'] = $exitCode === 0;
    $results['first_run'] = $firstRun;
    $results['message'] = $firstRun
        ? 'First-time setup complete: .env created, key generated, migrated, seeded, cached'
        : 'Deploy complete: migrated, seeded, cached';

    echo json_encode($results, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'first_run' => $firstRun,
        'error' => $e->getMessage()
    ]);
}
