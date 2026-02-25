import api from './api';
import { AxiosResponse } from 'axios';

export interface Job {
    id: string;
    [key: string]: unknown;
}

export interface JobListParams {
    search?: string;
    status?: string;
    job_type?: string;
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

export const getJobs = (params?: JobListParams): Promise<AxiosResponse<PaginatedResponse<Job>>> => {
    return api.get('/jobs', { params });
};

export const getJob = (id: string): Promise<AxiosResponse<Job>> => {
    return api.get(`/jobs/${id}`);
};

export const createJob = (data: Partial<Job>): Promise<AxiosResponse<Job>> => {
    return api.post('/jobs', data);
};

export const updateJob = (id: string, data: Partial<Job>): Promise<AxiosResponse<Job>> => {
    return api.put(`/jobs/${id}`, data);
};

export const deleteJob = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/jobs/${id}`);
};

export const markCompleted = (id: string, data?: { end_meter: number }): Promise<AxiosResponse<Job>> => {
    return api.patch(`/jobs/${id}/complete`, data || {});
};

export const markPaid = (id: string): Promise<AxiosResponse<Job>> => {
    return api.patch(`/jobs/${id}/paid`);
};

export const bulkCreateJobs = (data: { client_id: string; job_date: string; jobs: Record<string, unknown>[] }): Promise<AxiosResponse<{ count: number; jobs: Job[] }>> => {
    return api.post('/jobs/bulk', data);
};
