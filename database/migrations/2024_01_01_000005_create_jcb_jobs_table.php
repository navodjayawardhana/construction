<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jcb_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vehicle_id');
            $table->uuid('client_id');
            $table->uuid('worker_id')->nullable();
            $table->date('job_date');
            $table->decimal('start_meter', 10, 2)->nullable();
            $table->decimal('end_meter', 10, 2)->nullable();
            $table->decimal('total_hours', 10, 2)->default(0);
            $table->enum('rate_type', ['hourly', 'daily'])->default('hourly');
            $table->decimal('rate_amount', 10, 2);
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
        Schema::dropIfExists('jcb_jobs');
    }
};
