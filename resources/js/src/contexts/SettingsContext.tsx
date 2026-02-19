import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings, getSettings } from '../services/settingService';

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
    business_name: 'CONSTRUCTION COMPANY',
    business_address: '',
    business_contact: '',
    business_logo: '',
    developer_company: '',
    developer_phone: '',
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    loading: true,
    refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const response = await getSettings();
            setSettings({ ...defaultSettings, ...response.data });
        } catch {
            // Use defaults on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
