<?php

namespace Database\Seeders;

use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $vehicles = [

            // ===== JCB / Excavators (10) =====
            ['name' => 'JCB 3DX', 'registration_number' => 'WP-KA-1001', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'active', 'make' => 'JCB', 'model' => '3DX', 'year' => 2020],
            ['name' => 'JCB 4DX', 'registration_number' => 'WP-KA-1002', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'active', 'make' => 'JCB', 'model' => '4DX', 'year' => 2021],
            ['name' => 'JCB 3DX Super', 'registration_number' => 'WP-KA-1003', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'active', 'make' => 'JCB', 'model' => '3DX Super', 'year' => 2022],
            ['name' => 'CAT 320', 'registration_number' => 'WP-KA-1004', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'active', 'make' => 'Caterpillar', 'model' => '320', 'year' => 2019],
            ['name' => 'Komatsu PC200', 'registration_number' => 'WP-KA-1005', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'maintenance', 'make' => 'Komatsu', 'model' => 'PC200', 'year' => 2018],
            ['name' => 'Hitachi ZX200', 'registration_number' => 'WP-KA-1006', 'type' => 'jcb', 'color' => 'Orange', 'status' => 'active', 'make' => 'Hitachi', 'model' => 'ZX200', 'year' => 2020],
            ['name' => 'Hyundai R210', 'registration_number' => 'WP-KA-1007', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'active', 'make' => 'Hyundai', 'model' => 'R210', 'year' => 2021],
            ['name' => 'Doosan DX140', 'registration_number' => 'WP-KA-1008', 'type' => 'jcb', 'color' => 'Orange', 'status' => 'inactive', 'make' => 'Doosan', 'model' => 'DX140', 'year' => 2017],
            ['name' => 'Sany SY215', 'registration_number' => 'WP-KA-1009', 'type' => 'jcb', 'color' => 'Yellow', 'status' => 'active', 'make' => 'Sany', 'model' => 'SY215', 'year' => 2022],
            ['name' => 'Kubota KX080', 'registration_number' => 'WP-KA-1010', 'type' => 'jcb', 'color' => 'Orange', 'status' => 'maintenance', 'make' => 'Kubota', 'model' => 'KX080', 'year' => 2019],

            // ===== Lorries (10) =====
            ['name' => 'Tata Tipper 01', 'registration_number' => 'WP-LR-2001', 'type' => 'lorry', 'color' => 'Blue', 'status' => 'active', 'make' => 'Tata', 'model' => 'LPK 1615', 'year' => 2020],
            ['name' => 'Tata Tipper 02', 'registration_number' => 'WP-LR-2002', 'type' => 'lorry', 'color' => 'White', 'status' => 'active', 'make' => 'Tata', 'model' => 'LPK 1615', 'year' => 2021],
            ['name' => 'Ashok Leyland 2518', 'registration_number' => 'WP-LR-2003', 'type' => 'lorry', 'color' => 'Red', 'status' => 'active', 'make' => 'Ashok Leyland', 'model' => '2518', 'year' => 2019],
            ['name' => 'Mitsubishi Canter', 'registration_number' => 'WP-LR-2004', 'type' => 'lorry', 'color' => 'White', 'status' => 'active', 'make' => 'Mitsubishi', 'model' => 'Canter', 'year' => 2022],
            ['name' => 'ISUZU Forward', 'registration_number' => 'WP-LR-2005', 'type' => 'lorry', 'color' => 'Blue', 'status' => 'inactive', 'make' => 'ISUZU', 'model' => 'Forward', 'year' => 2017],
            ['name' => 'Mahindra Blazo X', 'registration_number' => 'WP-LR-2006', 'type' => 'lorry', 'color' => 'White', 'status' => 'active', 'make' => 'Mahindra', 'model' => 'Blazo X', 'year' => 2021],
            ['name' => 'Eicher Pro 3015', 'registration_number' => 'WP-LR-2007', 'type' => 'lorry', 'color' => 'Blue', 'status' => 'maintenance', 'make' => 'Eicher', 'model' => 'Pro 3015', 'year' => 2018],
            ['name' => 'Volvo FMX 440', 'registration_number' => 'WP-LR-2008', 'type' => 'lorry', 'color' => 'Yellow', 'status' => 'active', 'make' => 'Volvo', 'model' => 'FMX 440', 'year' => 2022],
            ['name' => 'Scania P410', 'registration_number' => 'WP-LR-2009', 'type' => 'lorry', 'color' => 'Red', 'status' => 'active', 'make' => 'Scania', 'model' => 'P410', 'year' => 2020],
            ['name' => 'Hino 500 Series', 'registration_number' => 'WP-LR-2010', 'type' => 'lorry', 'color' => 'White', 'status' => 'inactive', 'make' => 'Hino', 'model' => '500 Series', 'year' => 2019],

        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::firstOrCreate(
                ['registration_number' => $vehicle['registration_number']],
                $vehicle
            );
        }
    }
}
