import api from './api';
import { AxiosResponse } from 'axios';

export interface SalaryPayment {
    id: string;
    [key: string]: unknown;
}

export interface SalaryPaymentListParams {
    worker_id?: string;
    month?: string;
    page?: number;
    [key: string]: unknown;
}

export interface SalaryCalculationData {
    worker_id: string;
    month: string;
    [key: string]: unknown;
}

export interface SalaryCalculationResult {
    total_days: number;
    present_days: number;
    absent_days: number;
    total_salary: number;
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const getSalaryPayments = (params?: SalaryPaymentListParams): Promise<AxiosResponse<PaginatedResponse<SalaryPayment>>> => {
    return api.get('/salary-payments', { params });
};

export const getSalaryPayment = (id: string): Promise<AxiosResponse<SalaryPayment>> => {
    return api.get(`/salary-payments/${id}`);
};

export const createSalaryPayment = (data: Partial<SalaryPayment>): Promise<AxiosResponse<SalaryPayment>> => {
    return api.post('/salary-payments', data);
};

export const updateSalaryPayment = (id: string, data: Partial<SalaryPayment>): Promise<AxiosResponse<SalaryPayment>> => {
    return api.put(`/salary-payments/${id}`, data);
};

export const deleteSalaryPayment = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/salary-payments/${id}`);
};

export const calculateSalary = (data: SalaryCalculationData): Promise<AxiosResponse<SalaryCalculationResult>> => {
    return api.post('/salary-payments/calculate', data);
};
