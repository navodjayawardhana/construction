import api from './api';
import { AxiosResponse } from 'axios';
import { MonthlyVehicleBill, PaginatedResponse } from '../types';

export interface MonthlyVehicleBillListParams {
    vehicle_id?: string;
    client_id?: string;
    month?: number;
    year?: number;
    page?: number;
}

export interface MonthlyVehicleBillPayload {
    vehicle_id: string;
    client_id: string;
    month: number;
    year: number;
    overtime_kms?: number;
    rate?: number;
    notes?: string;
    items: {
        item_date: string;
        start_meter?: number;
        end_meter?: number;
    }[];
}

export const getMonthlyVehicleBills = (
    params?: MonthlyVehicleBillListParams
): Promise<AxiosResponse<PaginatedResponse<MonthlyVehicleBill>>> => {
    return api.get('/monthly-vehicle-bills', { params });
};

export const getMonthlyVehicleBill = (id: string): Promise<AxiosResponse<MonthlyVehicleBill>> => {
    return api.get(`/monthly-vehicle-bills/${id}`);
};

export const createMonthlyVehicleBill = (
    data: MonthlyVehicleBillPayload
): Promise<AxiosResponse<MonthlyVehicleBill>> => {
    return api.post('/monthly-vehicle-bills', data);
};

export const updateMonthlyVehicleBill = (
    id: string,
    data: MonthlyVehicleBillPayload
): Promise<AxiosResponse<MonthlyVehicleBill>> => {
    return api.put(`/monthly-vehicle-bills/${id}`, data);
};

export const deleteMonthlyVehicleBill = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/monthly-vehicle-bills/${id}`);
};
