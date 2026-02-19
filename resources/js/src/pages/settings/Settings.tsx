import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsContext';
import { verifyDeveloperPassword, updateSettings, uploadLogo, deleteLogo } from '../../services/settingService';

const Settings = () => {
    const { settings, refreshSettings } = useSettings();
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Form state
    const [businessName, setBusinessName] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [businessContact, setBusinessContact] = useState('');
    const [developerCompany, setDeveloperCompany] = useState('');
    const [developerPhone, setDeveloperPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (authenticated) {
            setBusinessName(settings.business_name || '');
            setBusinessAddress(settings.business_address || '');
            setBusinessContact(settings.business_contact || '');
            setDeveloperCompany(settings.developer_company || '');
            setDeveloperPhone(settings.developer_phone || '');
            setLogoPreview(settings.business_logo || '');
        }
    }, [authenticated, settings]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        setVerifying(true);
        try {
            await verifyDeveloperPassword(password);
            setAuthenticated(true);
            setPassword('');
            toast.success('Access granted');
        } catch {
            toast.error('Invalid password');
        } finally {
            setVerifying(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword && newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword && newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setSaving(true);
        try {
            const data: Record<string, string> = {
                business_name: businessName,
                business_address: businessAddress,
                business_contact: businessContact,
                developer_company: developerCompany,
                developer_phone: developerPhone,
            };
            if (newPassword) {
                data.developer_password = newPassword;
            }
            await updateSettings(data);
            await refreshSettings();
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Settings saved successfully');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const response = await uploadLogo(file);
            setLogoPreview(response.data.logo_url);
            await refreshSettings();
            toast.success('Logo uploaded successfully');
        } catch {
            toast.error('Failed to upload logo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLogoDelete = async () => {
        if (!confirm('Are you sure you want to delete the logo?')) return;
        try {
            await deleteLogo();
            setLogoPreview('');
            await refreshSettings();
            toast.success('Logo deleted');
        } catch {
            toast.error('Failed to delete logo');
        }
    };

    // Password Gate
    if (!authenticated) {
        return (
            <div className="panel max-w-md mx-auto mt-20">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-construction/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-construction" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold">Developer Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter developer password to access settings</p>
                </div>
                <form onSubmit={handleVerify}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter developer password"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={verifying || !password}>
                        {verifying ? 'Verifying...' : 'Unlock Settings'}
                    </button>
                </form>
            </div>
        );
    }

    // Settings Form
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">Settings</h5>
            </div>

            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Business Settings */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="font-semibold text-base mb-1">Business Information</h5>
                            <p className="text-gray-500 text-xs">These details appear on invoices and the sidebar</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Business Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="e.g. ABC Construction"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    value={businessAddress}
                                    onChange={(e) => setBusinessAddress(e.target.value)}
                                    placeholder="Business address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={businessContact}
                                    onChange={(e) => setBusinessContact(e.target.value)}
                                    placeholder="e.g. 077 123 4567"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Business Logo</label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain border rounded p-1" />
                                            <button
                                                type="button"
                                                onClick={handleLogoDelete}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                            >
                                                x
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                                            No Logo
                                        </div>
                                    )}
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn btn-outline-primary btn-sm"
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload Logo'}
                                        </button>
                                        <p className="text-xs text-gray-400 mt-1">Max 2MB (JPG, PNG, SVG)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer Settings */}
                    <div className="space-y-5">
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="font-semibold text-base mb-1">Developer Information</h5>
                                <p className="text-gray-500 text-xs">Shown in the sidebar footer</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={developerCompany}
                                        onChange={(e) => setDeveloperCompany(e.target.value)}
                                        placeholder="Developer company name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={developerPhone}
                                        onChange={(e) => setDeveloperPhone(e.target.value)}
                                        placeholder="Developer contact number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="font-semibold text-base mb-1">Change Developer Password</h5>
                                <p className="text-gray-500 text-xs">Leave blank to keep current password</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">New Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-5">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
