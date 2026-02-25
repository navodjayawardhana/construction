<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_vehicle_bills', function (Blueprint $table) {
            $table->decimal('rate', 10, 2)->default(0)->after('overtime_kms');
            $table->decimal('overtime_amount', 12, 2)->default(0)->after('rate');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_vehicle_bills', function (Blueprint $table) {
            $table->dropColumn(['rate', 'overtime_amount']);
        });
    }
};
