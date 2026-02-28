<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyVehicleBill;
use App\Models\MonthlyVehicleBillItem;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonthlyVehicleBillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MonthlyVehicleBill::with(['vehicle', 'client']);

        if ($vehicleId = $request->input('vehicle_id')) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        if ($month = $request->input('month')) {
            $query->where('month', $month);
        }

        if ($year = $request->input('year')) {
            $query->where('year', $year);
        }

        $bills = $query->latest()->paginate(15);

        return response()->json($bills);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'client_id' => 'required|uuid|exists:clients,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
            'overtime_kms' => 'nullable|numeric|min:0',
            'rate' => 'nullable|numeric|min:0',
            'per_day_km' => 'nullable|numeric|min:0',
            'overtime_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_date' => 'required|date',
            'items.*.start_meter' => 'nullable|numeric|min:0',
            'items.*.end_meter' => 'nullable|numeric|min:0',
        ]);

        $vehicle = Vehicle::findOrFail($validated['vehicle_id']);
        $isLorry = $vehicle->type === 'lorry';

        $bill = DB::transaction(function () use ($validated, $isLorry) {
            $rate = $validated['rate'] ?? 0;
            $perDayKm = $validated['per_day_km'] ?? 0;
            $overtimeRatePerKm = $validated['overtime_rate'] ?? 0;

            $bill = MonthlyVehicleBill::create([
                'vehicle_id' => $validated['vehicle_id'],
                'client_id' => $validated['client_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
                'rate' => $rate,
                'per_day_km' => $perDayKm,
                'overtime_rate' => $overtimeRatePerKm,
                'notes' => $validated['notes'] ?? null,
                // These will be updated after processing items
                'overtime_kms' => 0,
                'overtime_amount' => 0,
            ]);

            $totalHoursSum = 0;
            $totalAmount = 0;

            foreach ($validated['items'] as $itemData) {
                $startMeter = $itemData['start_meter'] ?? 0;
                $endMeter = $itemData['end_meter'] ?? 0;
                $totalHours = $endMeter - $startMeter;

                if ($isLorry) {
                    // Lorry: total_hours stores total_km, amount = 0 per item
                    $amount = 0;
                } else {
                    // JCB: amount = total_hours × rate
                    $amount = $totalHours * $rate;
                }

                $bill->items()->create([
                    'item_date' => $itemData['item_date'],
                    'start_meter' => $startMeter,
                    'end_meter' => $endMeter,
                    'total_hours' => $totalHours,
                    'rate' => $rate,
                    'amount' => $amount,
                    'is_manual' => true,
                ]);

                $totalHoursSum += $totalHours;
                $totalAmount += $amount;
            }

            if ($isLorry) {
                $days = count($validated['items']);
                $baseAmount = $days * $rate;
                $allowedKm = $days * $perDayKm;
                $overtimeKms = max(0, $totalHoursSum - $allowedKm);
                $overtimeAmount = $overtimeKms * $overtimeRatePerKm;
                $grandTotal = $baseAmount + $overtimeAmount;

                $bill->update([
                    'total_hours_sum' => $totalHoursSum,
                    'overtime_kms' => $overtimeKms,
                    'overtime_amount' => $overtimeAmount,
                    'total_amount' => $grandTotal,
                ]);
            } else {
                // JCB: no overtime
                $bill->update([
                    'total_hours_sum' => $totalHoursSum,
                    'overtime_kms' => 0,
                    'overtime_amount' => 0,
                    'total_amount' => $totalAmount,
                ]);
            }

            return $bill;
        });

        $bill->load(['vehicle', 'client', 'items']);

        return response()->json($bill, 201);
    }

    public function show(string $id): JsonResponse
    {
        $bill = MonthlyVehicleBill::with(['vehicle', 'client', 'items'])->findOrFail($id);

        return response()->json($bill);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $bill = MonthlyVehicleBill::findOrFail($id);

        $validated = $request->validate([
            'vehicle_id' => 'sometimes|required|uuid|exists:vehicles,id',
            'client_id' => 'sometimes|required|uuid|exists:clients,id',
            'month' => 'sometimes|required|integer|min:1|max:12',
            'year' => 'sometimes|required|integer|min:2000',
            'overtime_kms' => 'nullable|numeric|min:0',
            'rate' => 'nullable|numeric|min:0',
            'per_day_km' => 'nullable|numeric|min:0',
            'overtime_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_date' => 'required|date',
            'items.*.start_meter' => 'nullable|numeric|min:0',
            'items.*.end_meter' => 'nullable|numeric|min:0',
        ]);

        $vehicleId = $validated['vehicle_id'] ?? $bill->vehicle_id;
        $vehicle = Vehicle::findOrFail($vehicleId);
        $isLorry = $vehicle->type === 'lorry';

        $bill = DB::transaction(function () use ($bill, $validated, $isLorry) {
            $rate = $validated['rate'] ?? 0;
            $perDayKm = $validated['per_day_km'] ?? 0;
            $overtimeRatePerKm = $validated['overtime_rate'] ?? 0;

            $bill->update([
                'vehicle_id' => $validated['vehicle_id'] ?? $bill->vehicle_id,
                'client_id' => $validated['client_id'] ?? $bill->client_id,
                'month' => $validated['month'] ?? $bill->month,
                'year' => $validated['year'] ?? $bill->year,
                'rate' => $rate,
                'per_day_km' => $perDayKm,
                'overtime_rate' => $overtimeRatePerKm,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Delete old items and recreate
            $bill->items()->delete();

            $totalHoursSum = 0;
            $totalAmount = 0;

            foreach ($validated['items'] as $itemData) {
                $startMeter = $itemData['start_meter'] ?? 0;
                $endMeter = $itemData['end_meter'] ?? 0;
                $totalHours = $endMeter - $startMeter;

                if ($isLorry) {
                    $amount = 0;
                } else {
                    $amount = $totalHours * $rate;
                }

                $bill->items()->create([
                    'item_date' => $itemData['item_date'],
                    'start_meter' => $startMeter,
                    'end_meter' => $endMeter,
                    'total_hours' => $totalHours,
                    'rate' => $rate,
                    'amount' => $amount,
                    'is_manual' => true,
                ]);

                $totalHoursSum += $totalHours;
                $totalAmount += $amount;
            }

            if ($isLorry) {
                $days = count($validated['items']);
                $baseAmount = $days * $rate;
                $allowedKm = $days * $perDayKm;
                $overtimeKms = max(0, $totalHoursSum - $allowedKm);
                $overtimeAmount = $overtimeKms * $overtimeRatePerKm;
                $grandTotal = $baseAmount + $overtimeAmount;

                $bill->update([
                    'total_hours_sum' => $totalHoursSum,
                    'overtime_kms' => $overtimeKms,
                    'overtime_amount' => $overtimeAmount,
                    'total_amount' => $grandTotal,
                ]);
            } else {
                // JCB: no overtime
                $bill->update([
                    'total_hours_sum' => $totalHoursSum,
                    'overtime_kms' => 0,
                    'overtime_amount' => 0,
                    'total_amount' => $totalAmount,
                ]);
            }

            return $bill;
        });

        $bill->load(['vehicle', 'client', 'items']);

        return response()->json($bill);
    }

    public function destroy(string $id): JsonResponse
    {
        $bill = MonthlyVehicleBill::findOrFail($id);
        $bill->delete();

        return response()->json(['message' => 'Bill deleted successfully.']);
    }
}
