<?php

/**
 * PHP Code Obfuscator for CI/CD
 * Strips comments/whitespace and encodes PHP files
 */

$dirs = ['app', 'config', 'database/seeders', 'database/factories', 'routes'];
$total = 0;

foreach ($dirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    if (!is_dir($path)) continue;

    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS)
    );

    foreach ($it as $file) {
        if (!$file->isFile() || strtolower($file->getExtension()) !== 'php') continue;

        $filePath = $file->getPathname();
        $code = file_get_contents($filePath);
        if (strlen($code) < 50) continue;

        $stripped = php_strip_whitespace($filePath);
        if (empty($stripped) || strlen(trim($stripped)) < 10) continue;

        // Remove opening PHP tag for encoding
        $phpCode = $stripped;
        if (str_starts_with($phpCode, '<?php')) {
            $phpCode = substr($phpCode, 5);
        }
        $phpCode = trim($phpCode);

        // Compress and encode
        $encoded = base64_encode(gzdeflate($phpCode, 9));
        $result = "<?php\n/* (c) Candea Digital - Protected */\n";
        $result .= "eval(gzinflate(base64_decode('" . $encoded . "')));\n";

        file_put_contents($filePath, $result);
        $total++;
    }
}

// Obfuscate artisan
$artisan = __DIR__ . '/artisan';
if (file_exists($artisan)) {
    $code = file_get_contents($artisan);
    if (strlen($code) >= 50) {
        $stripped = php_strip_whitespace($artisan);
        if (!empty($stripped) && strlen(trim($stripped)) >= 10) {
            $phpCode = trim(str_starts_with($stripped, '<?php') ? substr($stripped, 5) : $stripped);
            $encoded = base64_encode(gzdeflate($phpCode, 9));
            file_put_contents($artisan, "<?php\n/* (c) Candea Digital - Protected */\neval(gzinflate(base64_decode('" . $encoded . "')));\n");
            $total++;
        }
    }
}

echo "Obfuscated $total PHP files\n";
