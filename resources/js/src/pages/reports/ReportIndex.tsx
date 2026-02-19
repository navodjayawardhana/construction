import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';

const reports = [
    {
        title: 'Client Statement',
        description: 'View all jobs, payments and outstanding balance for a client within a date range.',
        path: '/reports/client-statement',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
        title: 'Monthly Revenue & Expense',
        description: 'Revenue breakdown, expense categories, salary payments and profit/loss for a given month.',
        path: '/reports/monthly-revenue-expense',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
        title: 'Vehicle Report',
        description: 'Jobs performed, expenses incurred and net income for a specific vehicle.',
        path: '/reports/vehicle',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.5 18H15.5M3.5 18V11L5.5 5H18.5L20.5 11V18C20.5 19.1046 19.6046 20 18.5 20H5.5C4.39543 20 3.5 19.1046 3.5 18Z" />
            </svg>
        ),
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
        title: 'Daily Job Summary',
        description: 'All JCB and lorry jobs grouped by date with daily and grand totals.',
        path: '/reports/daily-job-summary',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
        title: 'Monthly Paysheet',
        description: 'All workers attendance summary, salary calculations and payment status for a month.',
        path: '/paysheets/monthly',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
    },
];

const ReportIndex = () => {
    const navigate = useNavigate();

    return (
        <div>
            <PageHeader
                title="Reports"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Reports' },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <div
                        key={report.path}
                        className="panel cursor-pointer hover:shadow-lg transition-shadow duration-200"
                        onClick={() => navigate(report.path)}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${report.bg} ${report.color}`}>
                                {report.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-dark dark:text-white-light mb-2">
                                    {report.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {report.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportIndex;
