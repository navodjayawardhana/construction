<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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

    public function jcbJobs(): HasMany
    {
        return $this->hasMany(JcbJob::class);
    }

    public function lorryJobs(): HasMany
    {
        return $this->hasMany(LorryJob::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(WorkerAttendance::class);
    }

    public function salaryPayments(): HasMany
    {
        return $this->hasMany(SalaryPayment::class);
    }
}
