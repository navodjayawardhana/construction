<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VehicleExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VehicleExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VehicleExpense::with('vehicle');

        if ($vehicleId = $request->input('vehicle_id')) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        $expenses = $query->latest('expense_date')->paginate(15);

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $rules = [
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ];

        if ($request->has('date_from') && $request->has('date_to')) {
            $rules['date_from'] = 'required|date';
            $rules['date_to'] = 'required|date|after_or_equal:date_from';
        } else {
            $rules['expense_date'] = 'required|date';
        }

        $validated = $request->validate($rules);

        if (isset($validated['date_from'], $validated['date_to'])) {
            $expense = VehicleExpense::create([
                'vehicle_id' => $validated['vehicle_id'],
                'category' => $validated['category'],
                'amount' => $validated['amount'],
                'expense_date' => $validated['date_from'],
                'date_to' => $validated['date_to'],
                'description' => $validated['description'] ?? null,
            ]);
            $expense->load('vehicle');

            return response()->json($expense, 201);
        }

        $expense = VehicleExpense::create($validated);
        $expense->load('vehicle');

        return response()->json($expense, 201);
    }

    public function vehicleSummary(Request $request): JsonResponse
    {
        $paginated = VehicleExpense::with('vehicle')
            ->select('vehicle_id', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as expense_count'))
            ->groupBy('vehicle_id')
            ->orderByDesc('total_amount')
            ->paginate($request->input('per_page', 12));

        $paginated->getCollection()->transform(function ($item) {
            return [
                'vehicle_id' => $item->vehicle_id,
                'vehicle' => $item->vehicle,
                'total_amount' => $item->total_amount,
                'expense_count' => $item->expense_count,
            ];
        });

        return response()->json($paginated);
    }

    public function summary(Request $request): JsonResponse
    {
        $query = VehicleExpense::query();

        if ($vehicleId = $request->input('vehicle_id')) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        $summary = $query->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        return response()->json($summary);
    }

    public function show(string $id): JsonResponse
    {
        $expense = VehicleExpense::with('vehicle')->findOrFail($id);

        return response()->json($expense);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $expense = VehicleExpense::findOrFail($id);

        $validated = $request->validate([
            'vehicle_id' => 'sometimes|required|uuid|exists:vehicles,id',
            'category' => 'sometimes|required|string|max:100',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|required|date',
            'description' => 'nullable|string',
        ]);

        $expense->update($validated);
        $expense->load('vehicle');

        return response()->json($expense);
    }

    public function destroy(string $id): JsonResponse
    {
        $expense = VehicleExpense::findOrFail($id);
        $expense->delete();

        return response()->json(['message' => 'Vehicle expense deleted successfully.']);
    }
}
