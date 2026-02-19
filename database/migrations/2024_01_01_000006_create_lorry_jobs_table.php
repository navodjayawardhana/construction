<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lorry_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vehicle_id');
            $table->uuid('client_id');
            $table->uuid('worker_id')->nullable();
            $table->date('job_date');
            $table->enum('rate_type', ['per_trip', 'per_km', 'per_day'])->default('per_trip');
            $table->decimal('rate_amount', 10, 2);
            $table->integer('trips')->nullable();
            $table->decimal('distance_km', 10, 2)->nullable();
            $table->integer('days')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'completed', 'paid'])->default('pending');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('worker_id')->references('id')->on('workers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lorry_jobs');
    }
};
