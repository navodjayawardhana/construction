<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    /**
     * Get all settings (public - no auth required).
     * Returns settings for sidebar/invoices usage.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        // Never expose the hashed password
        $settings->forget('developer_password');

        // Convert logo path to full URL
        if (!empty($settings['business_logo'])) {
            $settings['business_logo'] = asset('storage/' . $settings['business_logo']);
        }

        return response()->json($settings);
    }

    /**
     * Verify developer password.
     */
    public function verifyPassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $hashedPassword = Setting::getValue('developer_password');

        if (!$hashedPassword || !Hash::check($request->password, $hashedPassword)) {
            return response()->json(['message' => 'Invalid password'], 401);
        }

        return response()->json(['message' => 'Password verified']);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'business_name' => 'nullable|string|max:255',
            'business_address' => 'nullable|string|max:500',
            'business_contact' => 'nullable|string|max:100',
            'developer_company' => 'nullable|string|max:255',
            'developer_phone' => 'nullable|string|max:100',
            'developer_password' => 'nullable|string|min:6',
        ]);

        $fields = ['business_name', 'business_address', 'business_contact', 'developer_company', 'developer_phone'];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::setValue($field, $request->input($field));
            }
        }

        // Handle password change
        if ($request->filled('developer_password')) {
            Setting::setValue('developer_password', Hash::make($request->developer_password), 'password');
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Upload business logo.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Delete old logo if exists
        $oldLogo = Setting::getValue('business_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $path = $request->file('logo')->store('logos', 'public');
        Setting::setValue('business_logo', $path, 'image');

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Delete business logo.
     */
    public function deleteLogo(): JsonResponse
    {
        $logo = Setting::getValue('business_logo');
        if ($logo && Storage::disk('public')->exists($logo)) {
            Storage::disk('public')->delete($logo);
        }

        Setting::setValue('business_logo', '', 'image');

        return response()->json(['message' => 'Logo deleted successfully']);
    }
}
