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

// JCB Jobs
const JcbJobList = lazy(() => import('../pages/jcb-jobs/JcbJobList'));
const JcbJobForm = lazy(() => import('../pages/jcb-jobs/JcbJobForm'));
const JcbJobView = lazy(() => import('../pages/jcb-jobs/JcbJobView'));
const JobCreatePOS = lazy(() => import('../pages/jcb-jobs/JobCreatePOS'));

// Lorry Jobs
const LorryJobList = lazy(() => import('../pages/lorry-jobs/LorryJobList'));
const LorryJobForm = lazy(() => import('../pages/lorry-jobs/LorryJobForm'));
const LorryJobView = lazy(() => import('../pages/lorry-jobs/LorryJobView'));

// Workers
const WorkerList = lazy(() => import('../pages/workers/WorkerList'));
const WorkerForm = lazy(() => import('../pages/workers/WorkerForm'));
const WorkerView = lazy(() => import('../pages/workers/WorkerView'));
const AttendanceManager = lazy(() => import('../pages/workers/AttendanceManager'));
const AttendanceReport = lazy(() => import('../pages/workers/AttendanceReport'));
const SalaryPaymentList = lazy(() => import('../pages/workers/SalaryPaymentList'));

// Expenses
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList'));
const ExpenseForm = lazy(() => import('../pages/expenses/ExpenseForm'));

// Reports
const ReportIndex = lazy(() => import('../pages/reports/ReportIndex'));
const ClientStatement = lazy(() => import('../pages/reports/ClientStatement'));
const MonthlyRevenueExpense = lazy(() => import('../pages/reports/MonthlyRevenueExpense'));
const VehicleReport = lazy(() => import('../pages/reports/VehicleReport'));
const DailyJobSummary = lazy(() => import('../pages/reports/DailyJobSummary'));

// Invoices
const JcbJobInvoice = lazy(() => import('../pages/invoices/JcbJobInvoice'));
const LorryJobInvoice = lazy(() => import('../pages/invoices/LorryJobInvoice'));
const ClientCombinedInvoice = lazy(() => import('../pages/invoices/ClientCombinedInvoice'));

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
    // Create Job (POS)
    {
        path: '/jobs/create',
        element: <JobCreatePOS />,
        layout: 'default',
    },
    // JCB Jobs
    {
        path: '/jcb-jobs',
        element: <JcbJobList />,
        layout: 'default',
    },
    {
        path: '/jcb-jobs/create',
        element: <JobCreatePOS />,
        layout: 'default',
    },
    {
        path: '/jcb-jobs/:id/edit',
        element: <JcbJobForm />,
        layout: 'default',
    },
    {
        path: '/jcb-jobs/:id',
        element: <JcbJobView />,
        layout: 'default',
    },
    // Lorry Jobs
    {
        path: '/lorry-jobs',
        element: <LorryJobList />,
        layout: 'default',
    },
    {
        path: '/lorry-jobs/create',
        element: <JobCreatePOS />,
        layout: 'default',
    },
    {
        path: '/lorry-jobs/:id/edit',
        element: <LorryJobForm />,
        layout: 'default',
    },
    {
        path: '/lorry-jobs/:id',
        element: <LorryJobView />,
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
        path: '/invoices/jcb-job/:id',
        element: <JcbJobInvoice />,
        layout: 'blank',
    },
    {
        path: '/invoices/lorry-job/:id',
        element: <LorryJobInvoice />,
        layout: 'blank',
    },
    {
        path: '/invoices/client-combined',
        element: <ClientCombinedInvoice />,
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
