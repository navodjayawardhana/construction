<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ExpenseCategory::orderBy('name')->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:expense_categories,name',
            'color' => 'nullable|string|max:7',
        ]);

        $category = ExpenseCategory::create($validated);

        return response()->json($category, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:expense_categories,name,' . $id,
            'color' => 'nullable|string|max:7',
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy(string $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
