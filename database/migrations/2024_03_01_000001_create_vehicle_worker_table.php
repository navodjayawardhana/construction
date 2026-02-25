<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_worker', function (Blueprint $table) {
            $table->id();
            $table->uuid('vehicle_id');
            $table->uuid('worker_id');
            $table->timestamps();

            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');
            $table->foreign('worker_id')->references('id')->on('workers')->onDelete('cascade');
            $table->unique(['vehicle_id', 'worker_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_worker');
    }
};
