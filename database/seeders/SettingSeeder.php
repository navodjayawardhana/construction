<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'business_name', 'value' => 'CONSTRUCTION COMPANY', 'type' => 'text'],
            ['key' => 'business_address', 'value' => '', 'type' => 'text'],
            ['key' => 'business_contact', 'value' => '', 'type' => 'text'],
            ['key' => 'business_logo', 'value' => '', 'type' => 'image'],
            ['key' => 'developer_company', 'value' => '', 'type' => 'text'],
            ['key' => 'developer_phone', 'value' => '', 'type' => 'text'],
            ['key' => 'developer_password', 'value' => Hash::make('dev@1234'), 'type' => 'password'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'type' => $setting['type']]
            );
        }
    }
}
