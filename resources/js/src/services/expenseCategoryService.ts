import api from './api';
import { AxiosResponse } from 'axios';

export interface ExpenseCategory {
    id: string;
    name: string;
    color: string;
    created_at: string;
    updated_at: string;
}

export const getExpenseCategories = (): Promise<AxiosResponse<ExpenseCategory[]>> => {
    return api.get('/expense-categories');
};

export const createExpenseCategory = (data: { name: string; color?: string }): Promise<AxiosResponse<ExpenseCategory>> => {
    return api.post('/expense-categories', data);
};

export const updateExpenseCategory = (id: string, data: { name: string; color?: string }): Promise<AxiosResponse<ExpenseCategory>> => {
    return api.put(`/expense-categories/${id}`, data);
};

export const deleteExpenseCategory = (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/expense-categories/${id}`);
};
