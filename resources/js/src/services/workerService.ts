import api from './api';
import { AxiosResponse } from 'axios';

export interface Worker {
    id: string;
    name?: string;
    [key: string]: unknown;
}

export interface WorkerListParams {
    search?: string;
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

export const getWorkers = (params?: WorkerListParams): Promise<AxiosResponse<PaginatedResponse<Worker>>> => {
    return api.get('/workers', { params });
};

export const getWorker = (id: string): Promise<AxiosResponse<Worker>> => {
    return api.get(`/workers/${id}`);
};

export const createWorker = (data: Partial<Worker>): Promise<AxiosResponse<Worker>> => {
    return api.post('/workers', data);
};

export const updateWorker = (id: string, data: Partial<Worker>): Promise<AxiosResponse<Worker>> => {
    return api.put(`/workers/${id}`, data);
};

export const deleteWorker = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/workers/${id}`);
};
