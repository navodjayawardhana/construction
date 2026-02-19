import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../services/dashboardService';
import { DashboardStats } from '../../types';
import StatCard from '../../components/shared/StatCard';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ReactApexChart from 'react-apexcharts';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    if (loading) return <LoadingSpinner />;

    const revenueExpenseChart: any = {
        series: [
            {
                name: 'Revenue',
                data: stats?.monthly_revenue?.map((m) => m.total) || [],
            },
            {
                name: 'Expenses',
                data: stats?.monthly_expenses?.map((m) => m.total) || [],
            },
        ],
        options: {
            chart: {
                type: 'area',
                height: 325,
                fontFamily: 'Nunito, sans-serif',
                toolbar: { show: false },
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            colors: ['#F59E0B', '#e7515a'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.05,
                },
            },
            xaxis: {
                categories: stats?.monthly_revenue?.map((m) => m.month) || [],
                axisBorder: { color: isDark ? '#191e3a' : '#e0e6ed' },
                labels: { style: { colors: isDark ? '#888ea8' : undefined } },
            },
            yaxis: {
                labels: {
                    formatter: (val: number) => `Rs. ${(val / 1000).toFixed(0)}k`,
                    style: { colors: isDark ? '#888ea8' : undefined },
                },
            },
            grid: { borderColor: isDark ? '#191e3a' : '#e0e6ed' },
            tooltip: {
                y: { formatter: (val: number) => formatCurrency(val) },
                theme: isDark ? 'dark' : 'light',
            },
            legend: { labels: { colors: isDark ? '#888ea8' : undefined } },
        },
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark dark:text-white-light">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome to Construction Management System</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.total_revenue || 0)}
                    color="construction"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Total Expenses"
                    value={formatCurrency(stats?.total_expenses || 0)}
                    color="danger"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Active Vehicles"
                    value={stats?.active_vehicles || 0}
                    color="info"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    }
                />
                <StatCard
                    title="Active Workers"
                    value={stats?.active_workers || 0}
                    color="success"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                />
            </div>

            {/* Revenue vs Expenses Chart */}
            <div className="panel mb-6">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Revenue vs Expenses</h5>
                    <span className="badge bg-construction-dark-light text-construction">Last 6 Months</span>
                </div>
                <ReactApexChart options={revenueExpenseChart.options} series={revenueExpenseChart.series} type="area" height={325} />
            </div>

            {/* Recent Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent JCB Jobs */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Recent JCB Jobs</h5>
                        <Link to="/jcb-jobs" className="text-construction hover:underline text-sm">View All</Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Hours</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recent_jcb_jobs?.length ? (
                                    stats.recent_jcb_jobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>{new Date(job.job_date).toLocaleDateString()}</td>
                                            <td>{job.client?.name}</td>
                                            <td>{job.total_hours}</td>
                                            <td>{formatCurrency(job.total_amount)}</td>
                                            <td><StatusBadge status={job.status} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center text-gray-500">No recent jobs</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Lorry Jobs */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Recent Lorry Jobs</h5>
                        <Link to="/lorry-jobs" className="text-construction hover:underline text-sm">View All</Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recent_lorry_jobs?.length ? (
                                    stats.recent_lorry_jobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>{new Date(job.job_date).toLocaleDateString()}</td>
                                            <td>{job.client?.name}</td>
                                            <td className="capitalize">{job.rate_type.replace('_', ' ')}</td>
                                            <td>{formatCurrency(job.total_amount)}</td>
                                            <td><StatusBadge status={job.status} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center text-gray-500">No recent jobs</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
