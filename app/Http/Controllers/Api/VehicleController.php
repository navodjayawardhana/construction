<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $query->with('workers');
        $vehicles = $query->latest()->paginate(15);

        return response()->json($vehicles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'registration_number' => 'required|string|max:255|unique:vehicles',
            'type' => 'required|string|max:50',
            'color' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
            'make' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'year' => 'nullable|integer',
            'worker_ids' => 'nullable|array',
            'worker_ids.*' => 'exists:workers,id',
        ]);

        $workerIds = $validated['worker_ids'] ?? [];
        unset($validated['worker_ids']);

        $vehicle = Vehicle::create($validated);

        if (!empty($workerIds)) {
            $vehicle->workers()->sync($workerIds);
        }

        $vehicle->load('workers');

        return response()->json($vehicle, 201);
    }

    public function show(string $id): JsonResponse
    {
        $vehicle = Vehicle::with('workers')->findOrFail($id);

        return response()->json($vehicle);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'registration_number' => 'sometimes|required|string|max:255|unique:vehicles,registration_number,' . $id,
            'type' => 'sometimes|required|string|max:50',
            'color' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
            'make' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'year' => 'nullable|integer',
            'worker_ids' => 'nullable|array',
            'worker_ids.*' => 'exists:workers,id',
        ]);

        $workerIds = $validated['worker_ids'] ?? null;
        unset($validated['worker_ids']);

        $vehicle->update($validated);

        if ($workerIds !== null) {
            $vehicle->workers()->sync($workerIds);
        }

        $vehicle->load('workers');

        return response()->json($vehicle);
    }

    public function destroy(string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted successfully.']);
    }
}
