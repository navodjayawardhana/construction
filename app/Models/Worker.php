<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Worker extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'phone',
        'nic',
        'address',
        'role',
        'salary_type',
        'daily_rate',
        'monthly_salary',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'daily_rate' => 'decimal:2',
        'monthly_salary' => 'decimal:2',
    ];

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(WorkerAttendance::class);
    }

    public function salaryPayments(): HasMany
    {
        return $this->hasMany(SalaryPayment::class);
    }

    public function vehicles(): BelongsToMany
    {
        return $this->belongsToMany(Vehicle::class)->withTimestamps();
    }
}
