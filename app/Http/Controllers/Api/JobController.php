<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Job::with(['vehicle', 'client', 'worker']);

        if ($jobType = $request->input('job_type')) {
            $query->where('job_type', $jobType);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('location', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('client', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($vehicleId = $request->input('vehicle_id')) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        $jobs = $query->latest('job_date')->paginate(15);

        return response()->json($jobs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_type' => 'required|in:jcb,lorry',
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'client_id' => 'required|uuid|exists:clients,id',
            'worker_id' => 'nullable|uuid|exists:workers,id',
            'job_date' => 'required|date',
            'rate_type' => 'required|string|max:50',
            'rate_amount' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'start_meter' => 'nullable|numeric|min:0',
            'end_meter' => 'nullable|numeric|min:0',
            'total_hours' => 'nullable|numeric|min:0',
            'trips' => 'nullable|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'days' => 'nullable|numeric|min:0',
        ]);

        $job = Job::create($validated);
        $job->load(['vehicle', 'client', 'worker']);

        return response()->json($job, 201);
    }

    public function show(string $id): JsonResponse
    {
        $job = Job::with(['vehicle', 'client', 'worker', 'payments'])->findOrFail($id);

        return response()->json($job);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $job = Job::findOrFail($id);

        $validated = $request->validate([
            'job_type' => 'sometimes|required|in:jcb,lorry',
            'vehicle_id' => 'sometimes|required|uuid|exists:vehicles,id',
            'client_id' => 'sometimes|required|uuid|exists:clients,id',
            'worker_id' => 'nullable|uuid|exists:workers,id',
            'job_date' => 'sometimes|required|date',
            'rate_type' => 'sometimes|required|string|max:50',
            'rate_amount' => 'sometimes|required|numeric|min:0',
            'status' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'start_meter' => 'nullable|numeric|min:0',
            'end_meter' => 'nullable|numeric|min:0',
            'total_hours' => 'nullable|numeric|min:0',
            'trips' => 'nullable|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'days' => 'nullable|numeric|min:0',
        ]);

        $job->update($validated);
        $job->load(['vehicle', 'client', 'worker']);

        return response()->json($job);
    }

    public function destroy(string $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        $job->delete();

        return response()->json(['message' => 'Job deleted successfully.']);
    }

    public function markCompleted(Request $request, string $id): JsonResponse
    {
        $job = Job::findOrFail($id);

        $updateData = ['status' => 'completed'];

        if ($job->job_type === 'jcb' && $request->has('end_meter')) {
            $request->validate(['end_meter' => 'required|numeric|min:0']);
            $updateData['end_meter'] = $request->input('end_meter');
        }

        $job->update($updateData);

        return response()->json($job);
    }

    public function markPaid(string $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        $job->update(['status' => 'paid']);

        return response()->json($job);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|uuid|exists:clients,id',
            'job_date' => 'required|date',
            'jobs' => 'required|array|min:1',
            'jobs.*.job_type' => 'required|in:jcb,lorry',
            'jobs.*.vehicle_id' => 'required|uuid|exists:vehicles,id',
            'jobs.*.worker_id' => 'nullable|uuid|exists:workers,id',
            'jobs.*.rate_type' => 'required|string|max:50',
            'jobs.*.rate_amount' => 'required|numeric|min:0',
            'jobs.*.total_hours' => 'nullable|numeric|min:0',
            'jobs.*.start_meter' => 'nullable|numeric|min:0',
            'jobs.*.end_meter' => 'nullable|numeric|min:0',
            'jobs.*.trips' => 'nullable|numeric|min:0',
            'jobs.*.distance_km' => 'nullable|numeric|min:0',
            'jobs.*.days' => 'nullable|numeric|min:0',
            'jobs.*.location' => 'nullable|string|max:255',
            'jobs.*.notes' => 'nullable|string',
            'jobs.*.total_amount' => 'nullable|numeric|min:0',
        ]);

        $created = [];

        foreach ($request->input('jobs') as $jobData) {
            $job = Job::create([
                'job_type' => $jobData['job_type'],
                'client_id' => $request->input('client_id'),
                'job_date' => $request->input('job_date'),
                'vehicle_id' => $jobData['vehicle_id'],
                'worker_id' => $jobData['worker_id'] ?? null,
                'rate_type' => $jobData['rate_type'],
                'rate_amount' => $jobData['rate_amount'],
                'total_hours' => $jobData['total_hours'] ?? null,
                'start_meter' => $jobData['start_meter'] ?? null,
                'end_meter' => $jobData['end_meter'] ?? null,
                'trips' => $jobData['trips'] ?? null,
                'distance_km' => $jobData['distance_km'] ?? null,
                'days' => $jobData['days'] ?? null,
                'location' => $jobData['location'] ?? null,
                'notes' => $jobData['notes'] ?? null,
                'total_amount' => $jobData['total_amount'] ?? null,
            ]);
            $job->load(['vehicle', 'client', 'worker']);
            $created[] = $job;
        }

        return response()->json([
            'count' => count($created),
            'jobs' => $created,
        ], 201);
    }
}
