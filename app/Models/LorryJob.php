<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class LorryJob extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vehicle_id',
        'client_id',
        'worker_id',
        'job_date',
        'rate_type',
        'rate_amount',
        'trips',
        'distance_km',
        'days',
        'total_amount',
        'status',
        'location',
        'notes',
    ];

    protected $casts = [
        'job_date' => 'date',
        'rate_amount' => 'decimal:2',
        'trips' => 'decimal:2',
        'distance_km' => 'decimal:2',
        'days' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();

        $calculateTotal = function ($model) {
            $model->total_amount = match ($model->rate_type) {
                'per_trip' => $model->rate_amount * $model->trips,
                'per_km' => $model->rate_amount * $model->distance_km,
                'per_day' => $model->rate_amount * $model->days,
                default => $model->total_amount,
            };
        };

        static::creating($calculateTotal);
        static::updating($calculateTotal);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }
}
