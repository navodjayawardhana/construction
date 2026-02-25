<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyVehicleBillItem extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'bill_id',
        'job_id',
        'item_date',
        'start_meter',
        'end_meter',
        'total_hours',
        'rate',
        'amount',
        'is_manual',
    ];

    protected $casts = [
        'item_date' => 'date',
        'start_meter' => 'decimal:2',
        'end_meter' => 'decimal:2',
        'total_hours' => 'decimal:2',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'is_manual' => 'boolean',
    ];

    public function bill(): BelongsTo
    {
        return $this->belongsTo(MonthlyVehicleBill::class, 'bill_id');
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }
}
