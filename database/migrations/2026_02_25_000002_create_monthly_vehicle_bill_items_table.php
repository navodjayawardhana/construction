<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_vehicle_bill_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bill_id');
            $table->uuid('job_id')->nullable();
            $table->date('item_date');
            $table->decimal('start_meter', 10, 2)->default(0);
            $table->decimal('end_meter', 10, 2)->default(0);
            $table->decimal('total_hours', 10, 2)->default(0);
            $table->decimal('rate', 10, 2)->default(0);
            $table->decimal('amount', 12, 2)->default(0);
            $table->boolean('is_manual')->default(false);
            $table->timestamps();

            $table->foreign('bill_id')->references('id')->on('monthly_vehicle_bills')->onDelete('cascade');
            $table->foreign('job_id')->references('id')->on('jobs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_vehicle_bill_items');
    }
};
