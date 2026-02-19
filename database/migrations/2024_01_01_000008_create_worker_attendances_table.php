<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('worker_id');
            $table->date('attendance_date');
            $table->enum('status', ['present', 'absent', 'half_day'])->default('present');
            $table->timestamps();

            $table->foreign('worker_id')->references('id')->on('workers')->onDelete('cascade');
            $table->unique(['worker_id', 'attendance_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_attendances');
    }
};
