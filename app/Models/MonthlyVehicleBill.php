<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonthlyVehicleBill extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vehicle_id',
        'client_id',
        'month',
        'year',
        'overtime_kms',
        'rate',
        'per_day_km',
        'overtime_rate',
        'overtime_amount',
        'total_hours_sum',
        'total_amount',
        'notes',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'overtime_kms' => 'decimal:2',
        'rate' => 'decimal:2',
        'per_day_km' => 'decimal:2',
        'overtime_rate' => 'decimal:2',
        'overtime_amount' => 'decimal:2',
        'total_hours_sum' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(MonthlyVehicleBillItem::class, 'bill_id');
    }
}
