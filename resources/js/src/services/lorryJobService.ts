import api from './api';
import { AxiosResponse } from 'axios';

export interface LorryJob {
    id: string;
    [key: string]: unknown;
}

export interface LorryJobListParams {
    search?: string;
    status?: string;
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

export const getLorryJobs = (params?: LorryJobListParams): Promise<AxiosResponse<PaginatedResponse<LorryJob>>> => {
    return api.get('/lorry-jobs', { params });
};

export const getLorryJob = (id: string): Promise<AxiosResponse<LorryJob>> => {
    return api.get(`/lorry-jobs/${id}`);
};

export const createLorryJob = (data: Partial<LorryJob>): Promise<AxiosResponse<LorryJob>> => {
    return api.post('/lorry-jobs', data);
};

export const updateLorryJob = (id: string, data: Partial<LorryJob>): Promise<AxiosResponse<LorryJob>> => {
    return api.put(`/lorry-jobs/${id}`, data);
};

export const deleteLorryJob = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/lorry-jobs/${id}`);
};

export const markCompleted = (id: string): Promise<AxiosResponse<LorryJob>> => {
    return api.patch(`/lorry-jobs/${id}/complete`);
};

export const markPaid = (id: string): Promise<AxiosResponse<LorryJob>> => {
    return api.patch(`/lorry-jobs/${id}/paid`);
};

export const bulkCreateLorryJobs = (data: { client_id: string; job_date: string; jobs: Record<string, unknown>[] }): Promise<AxiosResponse<{ count: number; jobs: LorryJob[] }>> => {
    return api.post('/lorry-jobs/bulk', data);
};
