<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class JcbJob extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vehicle_id',
        'client_id',
        'worker_id',
        'job_date',
        'start_meter',
        'end_meter',
        'total_hours',
        'rate_type',
        'rate_amount',
        'total_amount',
        'status',
        'location',
        'notes',
    ];

    protected $casts = [
        'job_date' => 'date',
        'start_meter' => 'decimal:2',
        'end_meter' => 'decimal:2',
        'total_hours' => 'decimal:2',
        'rate_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            $model->total_amount = $model->total_hours * $model->rate_amount;
        });

        static::updating(function ($model) {
            $model->total_amount = $model->total_hours * $model->rate_amount;
        });
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
