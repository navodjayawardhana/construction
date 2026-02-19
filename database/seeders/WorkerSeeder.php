<?php

namespace Database\Seeders;

use App\Models\Worker;
use Illuminate\Database\Seeder;

class WorkerSeeder extends Seeder
{
    public function run(): void
    {
        $workers = [
            ['name' => 'Saman Kumara', 'phone' => '0761112233', 'nic' => '901234567V', 'role' => 'JCB Operator', 'salary_type' => 'daily', 'daily_rate' => 3500.00, 'monthly_salary' => null, 'address' => 'Kaduwela', 'is_active' => true],
            ['name' => 'Pradeep Bandara', 'phone' => '0772223344', 'nic' => '881234568V', 'role' => 'JCB Operator', 'salary_type' => 'daily', 'daily_rate' => 3500.00, 'monthly_salary' => null, 'address' => 'Piliyandala', 'is_active' => true],
            ['name' => 'Ajith Kumara', 'phone' => '0713334455', 'nic' => '921234569V', 'role' => 'Lorry Driver', 'salary_type' => 'daily', 'daily_rate' => 3000.00, 'monthly_salary' => null, 'address' => 'Homagama', 'is_active' => true],
            ['name' => 'Rohan Silva', 'phone' => '0754445566', 'nic' => '871234560V', 'role' => 'Lorry Driver', 'salary_type' => 'daily', 'daily_rate' => 3000.00, 'monthly_salary' => null, 'address' => 'Maharagama', 'is_active' => true],
            ['name' => 'Nuwan Perera', 'phone' => '0705556677', 'nic' => '951234561V', 'role' => 'Helper', 'salary_type' => 'daily', 'daily_rate' => 2500.00, 'monthly_salary' => null, 'address' => 'Kottawa', 'is_active' => true],
            ['name' => 'Kasun Jayawardena', 'phone' => '0726667788', 'nic' => '931234562V', 'role' => 'Lorry Driver', 'salary_type' => 'monthly', 'daily_rate' => null, 'monthly_salary' => 75000.00, 'address' => 'Pannipitiya', 'is_active' => true],
            ['name' => 'Lakshan Fernando', 'phone' => '0767778899', 'nic' => '891234563V', 'role' => 'JCB Operator', 'salary_type' => 'monthly', 'daily_rate' => null, 'monthly_salary' => 85000.00, 'address' => 'Nugegoda', 'is_active' => true],
            ['name' => 'Chamara Dissanayake', 'phone' => '0718889900', 'nic' => '941234564V', 'role' => 'Helper', 'salary_type' => 'daily', 'daily_rate' => 2500.00, 'monthly_salary' => null, 'address' => 'Boralesgamuwa', 'is_active' => false],
            ['name' => 'Frendy Widihata', 'phone' => '0789990011', 'nic' => '961234565V', 'role' => 'Helper', 'salary_type' => 'daily', 'daily_rate' => 2500.00, 'monthly_salary' => null, 'address' => '', 'is_active' => true],
        ];

        foreach ($workers as $worker) {
            Worker::firstOrCreate(
                ['nic' => $worker['nic']],
                $worker
            );
        }
    }
}