export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    name: string;
    company_name?: string;
    address?: string;
    phone?: string;
    email?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Vehicle {
    id: string;
    name: string;
    registration_number?: string;
    type: 'jcb' | 'lorry' | 'excavator' | 'roller' | 'other';
    color?: string;
    status: 'active' | 'inactive' | 'maintenance';
    make?: string;
    model?: string;
    year?: number;
    workers?: Worker[];
    created_at: string;
    updated_at: string;
}

export interface Worker {
    id: string;
    name: string;
    phone?: string;
    nic?: string;
    address?: string;
    role?: string;
    salary_type: 'daily' | 'monthly';
    daily_rate?: number;
    monthly_salary?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Job {
    id: string;
    job_type: 'jcb' | 'lorry';
    vehicle_id: string;
    client_id: string;
    worker_id?: string;
    job_date: string;
    rate_type: 'hourly' | 'daily' | 'per_trip' | 'per_km' | 'per_day';
    rate_amount: number;
    total_amount: number;
    status: 'pending' | 'completed' | 'paid';
    location?: string;
    notes?: string;
    // JCB-specific
    start_meter?: number;
    end_meter?: number;
    total_hours?: number;
    // Lorry-specific
    trips?: number;
    distance_km?: number;
    days?: number;
    vehicle?: Vehicle;
    client?: Client;
    worker?: Worker;
    created_at: string;
    updated_at: string;
}

export interface VehicleExpense {
    id: string;
    vehicle_id: string;
    category: 'fuel' | 'repair' | 'maintenance' | 'insurance' | 'tire' | 'other';
    amount: number;
    expense_date: string;
    date_to?: string;
    description?: string;
    vehicle?: Vehicle;
    created_at: string;
    updated_at: string;
}

export interface WorkerAttendance {
    id: string;
    worker_id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'half_day';
    worker?: Worker;
    created_at: string;
    updated_at: string;
}

export interface SalaryPayment {
    id: string;
    worker_id: string;
    amount: number;
    payment_date: string;
    period_from: string;
    period_to: string;
    worked_days: number;
    worker?: Worker;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    client_id: string;
    payable_type?: string;
    payable_id?: string;
    amount: number;
    payment_date: string;
    payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'other';
    notes?: string;
    client?: Client;
    payable?: Job;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface MonthlyVehicleBillItem {
    id: string;
    bill_id: string;
    item_date: string;
    start_meter: number;
    end_meter: number;
    total_hours: number;
    rate: number;
    amount: number;
    created_at: string;
    updated_at: string;
}

export interface MonthlyVehicleBill {
    id: string;
    vehicle_id: string;
    client_id: string;
    month: number;
    year: number;
    overtime_kms: number;
    rate: number;
    overtime_amount: number;
    total_hours_sum: number;
    total_amount: number;
    notes?: string;
    vehicle?: Vehicle;
    client?: Client;
    items?: MonthlyVehicleBillItem[];
    created_at: string;
    updated_at: string;
}

export interface DashboardStats {
    total_revenue: number;
    total_expenses: number;
    active_vehicles: number;
    active_workers: number;
    pending_jobs: number;
    monthly_revenue: { month: string; total: number }[];
    monthly_expenses: { month: string; total: number }[];
    recent_jobs: Job[];
}
