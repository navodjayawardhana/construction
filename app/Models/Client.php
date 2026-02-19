<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, HasUuid;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'company_name',
        'address',
        'phone',
        'email',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function jcbJobs(): HasMany
    {
        return $this->hasMany(JcbJob::class);
    }

    public function lorryJobs(): HasMany
    {
        return $this->hasMany(LorryJob::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
