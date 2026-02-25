import { Job, Payment, Worker, Client } from './index';

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ClientStatementData {
    jobs: PaginatedResponse<Job>;
    payments: PaginatedResponse<Payment>;
    summary: {
        total_jcb_amount: number;
        total_lorry_amount: number;
        total_jobs_amount: number;
        total_payments: number;
        outstanding_balance: number;
    };
}

export interface MonthlyRevenueExpenseData {
    revenue: {
        jcb_total: number;
        jcb_count: number;
        lorry_total: number;
        lorry_count: number;
        lorry_by_type: Record<string, number>;
        total: number;
    };
    expenses: {
        vehicle_expenses_by_category: Record<string, number>;
        total_vehicle_expenses: number;
        total_salary_payments: number;
        salary_payments_count: number;
        total: number;
    };
    profit_loss: number;
}

export interface VehicleReportData {
    jobs: PaginatedResponse<Job>;
    expenses: PaginatedResponse<{
        id: string;
        vehicle_id: string;
        category: string;
        amount: number;
        expense_date: string;
        description?: string;
    }>;
    summary: {
        total_jcb_revenue: number;
        total_lorry_revenue: number;
        total_revenue: number;
        expenses_by_category: Record<string, number>;
        total_expenses: number;
        net_income: number;
    };
}

export interface DailyJobSummaryItem {
    date: string;
    jobs: Job[];
    jcb_total: number;
    lorry_total: number;
    daily_total: number;
    jcb_count: number;
    lorry_count: number;
}

export interface DailyJobSummaryData {
    daily_summary: PaginatedResponse<DailyJobSummaryItem>;
    grand_total: {
        total_jcb: number;
        total_lorry: number;
        total: number;
        total_jcb_count: number;
        total_lorry_count: number;
    };
}

export interface CombinedInvoiceData {
    client: Client;
    jobs: Job[];
    total_jcb: number;
    total_lorry: number;
    grand_total: number;
}

export interface AttendanceBreakdown {
    records: {
        id: string;
        worker_id: string;
        attendance_date: string;
        status: string;
    }[];
    present_days: number;
    half_days: number;
    absent_days: number;
    worked_days: number;
}

export interface PayslipData {
    worker: Worker;
    period_from: string;
    period_to: string;
    attendance: AttendanceBreakdown;
    salary: {
        calculated_salary: number;
        total_paid: number;
        balance: number;
    };
    salary_payments: {
        id: string;
        amount: number;
        payment_date: string;
    }[];
}

export interface WorkerPaysheetItem {
    worker: Worker;
    present_days: number;
    half_days: number;
    absent_days: number;
    worked_days: number;
    calculated_salary: number;
    total_paid: number;
    balance: number;
}

export interface MonthlyPaysheetData {
    month: number;
    year: number;
    workers: WorkerPaysheetItem[];
    grand_total: {
        total_calculated: number;
        total_paid: number;
        total_balance: number;
    };
}
