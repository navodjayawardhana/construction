import api from './api';
import { AxiosResponse } from 'axios';

export interface JcbJob {
    id: string;
    [key: string]: unknown;
}

export interface JcbJobListParams {
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

export const getJcbJobs = (params?: JcbJobListParams): Promise<AxiosResponse<PaginatedResponse<JcbJob>>> => {
    return api.get('/jcb-jobs', { params });
};

export const getJcbJob = (id: string): Promise<AxiosResponse<JcbJob>> => {
    return api.get(`/jcb-jobs/${id}`);
};

export const createJcbJob = (data: Partial<JcbJob>): Promise<AxiosResponse<JcbJob>> => {
    return api.post('/jcb-jobs', data);
};

export const updateJcbJob = (id: string, data: Partial<JcbJob>): Promise<AxiosResponse<JcbJob>> => {
    return api.put(`/jcb-jobs/${id}`, data);
};

export const deleteJcbJob = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/jcb-jobs/${id}`);
};

export const markCompleted = (id: string, data: { end_meter: number }): Promise<AxiosResponse<JcbJob>> => {
    return api.patch(`/jcb-jobs/${id}/complete`, data);
};

export const markPaid = (id: string): Promise<AxiosResponse<JcbJob>> => {
    return api.patch(`/jcb-jobs/${id}/paid`);
};

export const bulkCreateJcbJobs = (data: { client_id: string; job_date: string; jobs: Record<string, unknown>[] }): Promise<AxiosResponse<{ count: number; jobs: JcbJob[] }>> => {
    return api.post('/jcb-jobs/bulk', data);
};
