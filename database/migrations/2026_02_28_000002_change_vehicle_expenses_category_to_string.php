<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->string('category', 100)->default('Fuel')->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->enum('category', ['fuel', 'repair', 'maintenance', 'insurance', 'tire', 'other'])->default('fuel')->change();
        });
    }
};
