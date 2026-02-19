import api from './api';
import { AxiosResponse } from 'axios';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    [key: string]: unknown;
}

export interface AuthResponse {
    user: User;
    token?: string;
}

export const login = (email: string, password: string): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/login', { email, password });
};

export const register = (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/register', { name, email, password, password_confirmation });
};

export const logout = (): Promise<AxiosResponse<void>> => {
    return api.post('/logout');
};

export const getUser = (): Promise<AxiosResponse<User>> => {
    return api.get('/user');
};
