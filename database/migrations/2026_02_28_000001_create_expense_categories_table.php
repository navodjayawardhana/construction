<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('color', 7)->default('#6b7280');
            $table->timestamps();
        });

        // Seed default categories
        $categories = [
            ['name' => 'Fuel', 'color' => '#f59e0b'],
            ['name' => 'Repair', 'color' => '#ef4444'],
            ['name' => 'Maintenance', 'color' => '#3b82f6'],
            ['name' => 'Insurance', 'color' => '#8b5cf6'],
            ['name' => 'Tire', 'color' => '#10b981'],
            ['name' => 'Other', 'color' => '#6b7280'],
        ];

        foreach ($categories as $category) {
            DB::table('expense_categories')->insert([
                'id' => Str::uuid()->toString(),
                'name' => $category['name'],
                'color' => $category['color'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
