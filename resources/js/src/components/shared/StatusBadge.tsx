interface StatusBadgeProps {
    status: string;
    type?: 'job' | 'vehicle' | 'attendance' | 'default';
}

const statusColors: Record<string, string> = {
    pending: 'bg-warning-dark-light text-warning',
    completed: 'bg-info-dark-light text-info',
    paid: 'bg-success-dark-light text-success',
    active: 'bg-success-dark-light text-success',
    inactive: 'bg-danger-dark-light text-danger',
    maintenance: 'bg-warning-dark-light text-warning',
    present: 'bg-success-dark-light text-success',
    absent: 'bg-danger-dark-light text-danger',
    half_day: 'bg-warning-dark-light text-warning',
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-600';
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
