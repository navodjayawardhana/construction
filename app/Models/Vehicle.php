<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'registration_number',
        'type',
        'color',
        'status',
        'make',
        'model',
        'year',
    ];

    public function jcbJobs(): HasMany
    {
        return $this->hasMany(JcbJob::class);
    }

    public function lorryJobs(): HasMany
    {
        return $this->hasMany(LorryJob::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(VehicleExpense::class);
    }
}
