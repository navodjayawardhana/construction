import api from './api';
import { AxiosResponse } from 'axios';

export interface Attendance {
    id: string;
    [key: string]: unknown;
}

export interface AttendanceListParams {
    worker_id?: string;
    date?: string;
    page?: number;
    [key: string]: unknown;
}

export interface BulkAttendanceData {
    date: string;
    attendances: Array<{
        worker_id: string;
        status: string;
        [key: string]: unknown;
    }>;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const getAttendances = (params?: AttendanceListParams): Promise<AxiosResponse<PaginatedResponse<Attendance>>> => {
    return api.get('/worker-attendances', { params });
};

export const createAttendance = (data: Partial<Attendance>): Promise<AxiosResponse<Attendance>> => {
    return api.post('/worker-attendances', data);
};

export const bulkAttendance = (data: BulkAttendanceData): Promise<AxiosResponse<Attendance[]>> => {
    return api.post('/worker-attendances/bulk', data);
};

export const updateAttendance = (id: string, data: Partial<Attendance>): Promise<AxiosResponse<Attendance>> => {
    return api.put(`/worker-attendances/${id}`, data);
};

export const deleteAttendance = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/worker-attendances/${id}`);
};
