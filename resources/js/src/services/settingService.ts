import api from './api';

export interface Settings {
    business_name: string;
    business_address: string;
    business_contact: string;
    business_logo: string;
    developer_company: string;
    developer_phone: string;
}

export const getSettings = () => {
    return api.get<Settings>('/settings');
};

export const verifyDeveloperPassword = (password: string) => {
    return api.post('/settings/verify-password', { password });
};

export const updateSettings = (data: Partial<Settings> & { developer_password?: string }) => {
    return api.put('/settings', data);
};

export const uploadLogo = (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteLogo = () => {
    return api.delete('/settings/logo');
};
