<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VehicleExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $validated = $request->validate([
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $expense = VehicleExpense::create($validated);
        $expense->load('vehicle');

        return response()->json($expense, 201);
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
