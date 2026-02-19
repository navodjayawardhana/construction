<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            ['name' => 'Nimal Perera', 'company_name' => 'Perera Constructions', 'phone' => '0771234567', 'email' => 'nimal@pereraconstruction.lk', 'address' => 'No. 45, Galle Road, Colombo 03', 'is_active' => true],
            ['name' => 'Kamal Silva', 'company_name' => 'Silva Builders', 'phone' => '0712345678', 'email' => 'kamal@silvabuilders.lk', 'address' => 'No. 12, Kandy Road, Kadawatha', 'is_active' => true],
            ['name' => 'Sunil Fernando', 'company_name' => null, 'phone' => '0763456789', 'email' => null, 'address' => 'Horana Road, Piliyandala', 'is_active' => true],
            ['name' => 'Ruwan Jayasinghe', 'company_name' => 'RJ Developers', 'phone' => '0774567890', 'email' => 'ruwan@rjdev.lk', 'address' => 'No. 78, High Level Road, Maharagama', 'is_active' => true],
            ['name' => 'Chaminda Bandara', 'company_name' => 'Bandara & Sons', 'phone' => '0705678901', 'email' => null, 'address' => 'Peradeniya Road, Kandy', 'is_active' => true],
            ['name' => 'Asanka Kumara', 'company_name' => null, 'phone' => '0726789012', 'email' => null, 'address' => 'Negombo Road, Wattala', 'is_active' => true],
            ['name' => 'Prasanna Wickrama', 'company_name' => 'PW Construction', 'phone' => '0757890123', 'email' => 'prasanna@pwcon.lk', 'address' => 'No. 23, Baseline Road, Colombo 09', 'is_active' => true],
            ['name' => 'Dinesh Rajapaksa', 'company_name' => null, 'phone' => '0718901234', 'email' => null, 'address' => 'Matara Road, Galle', 'is_active' => false],
        ];

        foreach ($clients as $client) {
            Client::firstOrCreate(
                ['phone' => $client['phone']],
                $client
            );
        }
    }
}