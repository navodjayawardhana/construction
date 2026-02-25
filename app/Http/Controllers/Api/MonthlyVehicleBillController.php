<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyVehicleBill;
use App\Models\MonthlyVehicleBillItem;
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
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_date' => 'required|date',
            'items.*.start_meter' => 'nullable|numeric|min:0',
            'items.*.end_meter' => 'nullable|numeric|min:0',
        ]);

        $bill = DB::transaction(function () use ($validated) {
            $rate = $validated['rate'] ?? 0;
            $overtimeKms = $validated['overtime_kms'] ?? 0;
            $overtimeAmount = $overtimeKms * $rate;

            $bill = MonthlyVehicleBill::create([
                'vehicle_id' => $validated['vehicle_id'],
                'client_id' => $validated['client_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
                'overtime_kms' => $overtimeKms,
                'rate' => $rate,
                'overtime_amount' => $overtimeAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            $totalHoursSum = 0;
            $totalAmount = 0;

            foreach ($validated['items'] as $itemData) {
                $startMeter = $itemData['start_meter'] ?? 0;
                $endMeter = $itemData['end_meter'] ?? 0;
                $totalHours = $endMeter - $startMeter;
                $amount = $totalHours * $rate;

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

            $bill->update([
                'total_hours_sum' => $totalHoursSum,
                'total_amount' => $totalAmount + $overtimeAmount,
            ]);

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
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_date' => 'required|date',
            'items.*.start_meter' => 'nullable|numeric|min:0',
            'items.*.end_meter' => 'nullable|numeric|min:0',
        ]);

        $bill = DB::transaction(function () use ($bill, $validated) {
            $rate = $validated['rate'] ?? 0;
            $overtimeKms = $validated['overtime_kms'] ?? 0;
            $overtimeAmount = $overtimeKms * $rate;

            $bill->update([
                'vehicle_id' => $validated['vehicle_id'] ?? $bill->vehicle_id,
                'client_id' => $validated['client_id'] ?? $bill->client_id,
                'month' => $validated['month'] ?? $bill->month,
                'year' => $validated['year'] ?? $bill->year,
                'overtime_kms' => $overtimeKms,
                'rate' => $rate,
                'overtime_amount' => $overtimeAmount,
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
                $amount = $totalHours * $rate;

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

            $bill->update([
                'total_hours_sum' => $totalHoursSum,
                'total_amount' => $totalAmount + $overtimeAmount,
            ]);

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
