import { lazy } from 'react';

// Dashboard
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));

// Auth
const Login = lazy(() => import('../pages/auth/Login'));

// Vehicles
const VehicleList = lazy(() => import('../pages/vehicles/VehicleList'));
const VehicleForm = lazy(() => import('../pages/vehicles/VehicleForm'));
const VehicleView = lazy(() => import('../pages/vehicles/VehicleView'));

// Clients
const ClientList = lazy(() => import('../pages/clients/ClientList'));
const ClientForm = lazy(() => import('../pages/clients/ClientForm'));
const ClientView = lazy(() => import('../pages/clients/ClientView'));

// Jobs (unified)
const JobList = lazy(() => import('../pages/jobs/JobList'));
const JobForm = lazy(() => import('../pages/jobs/JobForm'));
const JobView = lazy(() => import('../pages/jobs/JobView'));
const JobCreatePOS = lazy(() => import('../pages/jobs/JobCreatePOS'));

// Workers
const WorkerList = lazy(() => import('../pages/workers/WorkerList'));
const WorkerForm = lazy(() => import('../pages/workers/WorkerForm'));
const WorkerView = lazy(() => import('../pages/workers/WorkerView'));
const AttendanceManager = lazy(() => import('../pages/workers/AttendanceManager'));
const AttendanceReport = lazy(() => import('../pages/workers/AttendanceReport'));
const SalaryPaymentList = lazy(() => import('../pages/workers/SalaryPaymentList'));

// Expenses
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList'));
const VehicleExpenses = lazy(() => import('../pages/expenses/VehicleExpenses'));
const ExpenseForm = lazy(() => import('../pages/expenses/ExpenseForm'));

// Reports
const ReportIndex = lazy(() => import('../pages/reports/ReportIndex'));
const ClientStatement = lazy(() => import('../pages/reports/ClientStatement'));
const MonthlyRevenueExpense = lazy(() => import('../pages/reports/MonthlyRevenueExpense'));
const VehicleReport = lazy(() => import('../pages/reports/VehicleReport'));
const DailyJobSummary = lazy(() => import('../pages/reports/DailyJobSummary'));

// Invoices
const JobInvoice = lazy(() => import('../pages/invoices/JobInvoice'));
const ClientCombinedInvoice = lazy(() => import('../pages/invoices/ClientCombinedInvoice'));
const MonthlyVehicleBillList = lazy(() => import('../pages/invoices/MonthlyVehicleBillList'));
const MonthlyVehicleBillForm = lazy(() => import('../pages/invoices/MonthlyVehicleBillForm'));
const MonthlyVehicleBillView = lazy(() => import('../pages/invoices/MonthlyVehicleBillView'));

// Paysheets
const WorkerPayslip = lazy(() => import('../pages/paysheets/WorkerPayslip'));
const MonthlyPaysheet = lazy(() => import('../pages/paysheets/MonthlyPaysheet'));

// Settings
const Settings = lazy(() => import('../pages/settings/Settings'));

const routes = [
    // Dashboard
    {
        path: '/',
        element: <Dashboard />,
        layout: 'default',
    },
    // Auth
    {
        path: '/login',
        element: <Login />,
        layout: 'blank',
    },
    // Vehicles
    {
        path: '/vehicles',
        element: <VehicleList />,
        layout: 'default',
    },
    {
        path: '/vehicles/create',
        element: <VehicleForm />,
        layout: 'default',
    },
    {
        path: '/vehicles/:id/edit',
        element: <VehicleForm />,
        layout: 'default',
    },
    {
        path: '/vehicles/:id',
        element: <VehicleView />,
        layout: 'default',
    },
    // Clients
    {
        path: '/clients',
        element: <ClientList />,
        layout: 'default',
    },
    {
        path: '/clients/create',
        element: <ClientForm />,
        layout: 'default',
    },
    {
        path: '/clients/:id/edit',
        element: <ClientForm />,
        layout: 'default',
    },
    {
        path: '/clients/:id',
        element: <ClientView />,
        layout: 'default',
    },
    // Jobs (unified)
    {
        path: '/jobs/create',
        element: <JobCreatePOS />,
        layout: 'default',
    },
    {
        path: '/jobs',
        element: <JobList />,
        layout: 'default',
    },
    {
        path: '/jobs/:id/edit',
        element: <JobForm />,
        layout: 'default',
    },
    {
        path: '/jobs/:id',
        element: <JobView />,
        layout: 'default',
    },
    // Workers
    {
        path: '/workers',
        element: <WorkerList />,
        layout: 'default',
    },
    {
        path: '/workers/create',
        element: <WorkerForm />,
        layout: 'default',
    },
    {
        path: '/workers/:id/edit',
        element: <WorkerForm />,
        layout: 'default',
    },
    {
        path: '/workers/:id',
        element: <WorkerView />,
        layout: 'default',
    },
    {
        path: '/attendance',
        element: <AttendanceManager />,
        layout: 'default',
    },
    {
        path: '/attendance-report',
        element: <AttendanceReport />,
        layout: 'default',
    },
    {
        path: '/salary-payments',
        element: <SalaryPaymentList />,
        layout: 'default',
    },
    // Expenses
    {
        path: '/expenses',
        element: <ExpenseList />,
        layout: 'default',
    },
    {
        path: '/expenses/vehicle/:vehicleId',
        element: <VehicleExpenses />,
        layout: 'default',
    },
    {
        path: '/expenses/create',
        element: <ExpenseForm />,
        layout: 'default',
    },
    {
        path: '/expenses/:id/edit',
        element: <ExpenseForm />,
        layout: 'default',
    },
    // Reports
    {
        path: '/reports',
        element: <ReportIndex />,
        layout: 'default',
    },
    {
        path: '/reports/client-statement',
        element: <ClientStatement />,
        layout: 'default',
    },
    {
        path: '/reports/monthly-revenue-expense',
        element: <MonthlyRevenueExpense />,
        layout: 'default',
    },
    {
        path: '/reports/vehicle',
        element: <VehicleReport />,
        layout: 'default',
    },
    {
        path: '/reports/daily-job-summary',
        element: <DailyJobSummary />,
        layout: 'default',
    },
    // Invoices
    {
        path: '/invoices/job/:id',
        element: <JobInvoice />,
        layout: 'blank',
    },
    {
        path: '/invoices/client-combined',
        element: <ClientCombinedInvoice />,
        layout: 'blank',
    },
    {
        path: '/invoices/monthly-vehicle-bill',
        element: <MonthlyVehicleBillList />,
        layout: 'default',
    },
    {
        path: '/invoices/monthly-vehicle-bill/create',
        element: <MonthlyVehicleBillForm />,
        layout: 'default',
    },
    {
        path: '/invoices/monthly-vehicle-bill/:id/edit',
        element: <MonthlyVehicleBillForm />,
        layout: 'default',
    },
    {
        path: '/invoices/monthly-vehicle-bill/:id/view',
        element: <MonthlyVehicleBillView />,
        layout: 'blank',
    },
    // Paysheets
    {
        path: '/paysheets/worker/:id',
        element: <WorkerPayslip />,
        layout: 'blank',
    },
    {
        path: '/paysheets/monthly',
        element: <MonthlyPaysheet />,
        layout: 'default',
    },
    // Settings
    {
        path: '/settings',
        element: <Settings />,
        layout: 'default',
    },
];

export { routes };
