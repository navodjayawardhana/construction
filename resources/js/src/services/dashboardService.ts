import api from './api';
import { AxiosResponse } from 'axios';

export interface DashboardStats {
    [key: string]: unknown;
}

export const getDashboardStats = (): Promise<AxiosResponse<DashboardStats>> => {
    return api.get('/dashboard');
};
