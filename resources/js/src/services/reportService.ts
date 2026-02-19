import api from './api';
import { AxiosResponse } from 'axios';
import {
    ClientStatementData,
    MonthlyRevenueExpenseData,
    VehicleReportData,
    DailyJobSummaryData,
    CombinedInvoiceData,
    PayslipData,
    MonthlyPaysheetData,
} from '../types/reports';
import { JcbJob, LorryJob } from '../types';

// Reports
export const getClientStatement = (params: {
    client_id: string;
    date_from: string;
    date_to: string;
    jcb_page?: number;
    lorry_page?: number;
    payment_page?: number;
}): Promise<AxiosResponse<ClientStatementData>> => {
    return api.get('/reports/client-statement', { params });
};

export const getMonthlyRevenueExpense = (params: {
    month: number;
    year: number;
}): Promise<AxiosResponse<MonthlyRevenueExpenseData>> => {
    return api.get('/reports/monthly-revenue-expense', { params });
};

export const getVehicleReport = (params: {
    vehicle_id: string;
    date_from: string;
    date_to: string;
    jcb_page?: number;
    lorry_page?: number;
    expense_page?: number;
}): Promise<AxiosResponse<VehicleReportData>> => {
    return api.get('/reports/vehicle', { params });
};

export const getDailyJobSummary = (params: {
    date_from: string;
    date_to: string;
    page?: number;
}): Promise<AxiosResponse<DailyJobSummaryData>> => {
    return api.get('/reports/daily-job-summary', { params });
};

// Export helper - downloads file via authenticated axios request
const downloadExport = async (path: string, params: Record<string, string | number>, filename: string) => {
    const response = await api.get(path, {
        params,
        responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const exportClientStatement = (params: {
    client_id: string;
    date_from: string;
    date_to: string;
    format: 'pdf' | 'excel';
}) => {
    const ext = params.format === 'pdf' ? 'pdf' : 'xlsx';
    return downloadExport('/reports/client-statement/export', params, `client-statement.${ext}`);
};

export const exportVehicleReport = (params: {
    vehicle_id: string;
    date_from: string;
    date_to: string;
    format: 'pdf' | 'excel';
}) => {
    const ext = params.format === 'pdf' ? 'pdf' : 'xlsx';
    return downloadExport('/reports/vehicle/export', params, `vehicle-report.${ext}`);
};

export const exportDailyJobSummary = (params: {
    date_from: string;
    date_to: string;
    format: 'pdf' | 'excel';
}) => {
    const ext = params.format === 'pdf' ? 'pdf' : 'xlsx';
    return downloadExport('/reports/daily-job-summary/export', params, `daily-job-summary.${ext}`);
};

export const exportMonthlyRevenueExpense = (params: {
    month: number;
    year: number;
    format: 'pdf' | 'excel';
}) => {
    const ext = params.format === 'pdf' ? 'pdf' : 'xlsx';
    return downloadExport('/reports/monthly-revenue-expense/export', params, `monthly-revenue-expense.${ext}`);
};

// Invoices
export const getJcbJobInvoice = (id: string): Promise<AxiosResponse<JcbJob>> => {
    return api.get(`/invoices/jcb-job/${id}`);
};

export const getLorryJobInvoice = (id: string): Promise<AxiosResponse<LorryJob>> => {
    return api.get(`/invoices/lorry-job/${id}`);
};

export const getClientCombinedInvoice = (params: {
    client_id: string;
    date_from: string;
    date_to: string;
}): Promise<AxiosResponse<CombinedInvoiceData>> => {
    return api.get('/invoices/client-combined', { params });
};

// Paysheets
export const getWorkerPayslip = (
    id: string,
    params: { period_from: string; period_to: string }
): Promise<AxiosResponse<PayslipData>> => {
    return api.get(`/paysheets/worker/${id}`, { params });
};

export const getMonthlyPaysheet = (params: {
    month: number;
    year: number;
}): Promise<AxiosResponse<MonthlyPaysheetData>> => {
    return api.get('/paysheets/monthly', { params });
};
