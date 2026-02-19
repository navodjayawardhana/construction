<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Worker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Worker::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($salaryType = $request->input('salary_type')) {
            $query->where('salary_type', $salaryType);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $workers = $query->latest()->paginate(15);

        return response()->json($workers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'nic' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'role' => 'nullable|string|max:100',
            'salary_type' => 'required|string|max:50',
            'daily_rate' => 'nullable|numeric|min:0',
            'monthly_salary' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $worker = Worker::create($validated);

        return response()->json($worker, 201);
    }

    public function show(string $id): JsonResponse
    {
        $worker = Worker::with(['attendances' => function ($query) {
            $query->latest('attendance_date')->take(30);
        }])->findOrFail($id);

        return response()->json($worker);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $worker = Worker::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'nic' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'role' => 'nullable|string|max:100',
            'salary_type' => 'sometimes|required|string|max:50',
            'daily_rate' => 'nullable|numeric|min:0',
            'monthly_salary' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $worker->update($validated);

        return response()->json($worker);
    }

    public function destroy(string $id): JsonResponse
    {
        $worker = Worker::findOrFail($id);
        $worker->delete();

        return response()->json(['message' => 'Worker deleted successfully.']);
    }
}
