interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'construction';
    change?: string;
}

const colorClasses: Record<string, string> = {
    primary: 'bg-primary-dark-light text-primary',
    success: 'bg-success-dark-light text-success',
    warning: 'bg-warning-dark-light text-warning',
    danger: 'bg-danger-dark-light text-danger',
    info: 'bg-info-dark-light text-info',
    construction: 'bg-construction-dark-light text-construction',
};

const StatCard = ({ title, value, icon, color, change }: StatCardProps) => {
    return (
        <div className="panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-dark dark:text-white-light">{value}</h3>
                    {change && <p className="text-xs text-success mt-1">{change}</p>}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
