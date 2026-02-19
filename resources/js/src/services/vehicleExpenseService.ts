import api from './api';
import { AxiosResponse } from 'axios';

export interface VehicleExpense {
    id: string;
    [key: string]: unknown;
}

export interface VehicleExpenseListParams {
    search?: string;
    vehicle_id?: string;
    page?: number;
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const getExpenses = (params?: VehicleExpenseListParams): Promise<AxiosResponse<PaginatedResponse<VehicleExpense>>> => {
    return api.get('/vehicle-expenses', { params });
};

export const getExpense = (id: string): Promise<AxiosResponse<VehicleExpense>> => {
    return api.get(`/vehicle-expenses/${id}`);
};

export const createExpense = (data: Partial<VehicleExpense>): Promise<AxiosResponse<VehicleExpense>> => {
    return api.post('/vehicle-expenses', data);
};

export const updateExpense = (id: string, data: Partial<VehicleExpense>): Promise<AxiosResponse<VehicleExpense>> => {
    return api.put(`/vehicle-expenses/${id}`, data);
};

export const deleteExpense = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/vehicle-expenses/${id}`);
};
