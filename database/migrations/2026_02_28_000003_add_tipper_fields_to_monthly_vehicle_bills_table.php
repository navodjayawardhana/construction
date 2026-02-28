<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_vehicle_bills', function (Blueprint $table) {
            $table->decimal('per_day_km', 10, 2)->default(0)->after('rate');
            $table->decimal('overtime_rate', 10, 2)->default(0)->after('per_day_km');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_vehicle_bills', function (Blueprint $table) {
            $table->dropColumn(['per_day_km', 'overtime_rate']);
        });
    }
};
