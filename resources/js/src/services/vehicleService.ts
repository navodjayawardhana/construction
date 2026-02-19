import api from './api';
import { AxiosResponse } from 'axios';

export interface Vehicle {
    id: string;
    name?: string;
    type?: string;
    status?: string;
    [key: string]: unknown;
}

export interface VehicleListParams {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const getVehicles = (params?: VehicleListParams): Promise<AxiosResponse<PaginatedResponse<Vehicle>>> => {
    return api.get('/vehicles', { params });
};

export const getVehicle = (id: string): Promise<AxiosResponse<Vehicle>> => {
    return api.get(`/vehicles/${id}`);
};

export const createVehicle = (data: Partial<Vehicle>): Promise<AxiosResponse<Vehicle>> => {
    return api.post('/vehicles', data);
};

export const updateVehicle = (id: string, data: Partial<Vehicle>): Promise<AxiosResponse<Vehicle>> => {
    return api.put(`/vehicles/${id}`, data);
};

export const deleteVehicle = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/vehicles/${id}`);
};
