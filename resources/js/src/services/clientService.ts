import api from './api';
import { AxiosResponse } from 'axios';

export interface Client {
    id: string;
    name: string;
    [key: string]: unknown;
}

export interface ClientListParams {
    search?: string;
    page?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const getClients = (params?: ClientListParams): Promise<AxiosResponse<PaginatedResponse<Client>>> => {
    return api.get('/clients', { params });
};

export const getClient = (id: string): Promise<AxiosResponse<Client>> => {
    return api.get(`/clients/${id}`);
};

export const createClient = (data: Partial<Client>): Promise<AxiosResponse<Client>> => {
    return api.post('/clients', data);
};

export const updateClient = (id: string, data: Partial<Client>): Promise<AxiosResponse<Client>> => {
    return api.put(`/clients/${id}`, data);
};

export const deleteClient = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/clients/${id}`);
};
