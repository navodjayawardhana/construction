import { Link } from 'react-router-dom';

interface Breadcrumb {
    label: string;
    path?: string;
}

interface PageHeaderProps {
    title: string;
    breadcrumbs: Breadcrumb[];
    action?: React.ReactNode;
}

const PageHeader = ({ title, breadcrumbs, action }: PageHeaderProps) => {
    return (
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-dark dark:text-white-light">{title}</h1>
                <ul className="flex space-x-2 rtl:space-x-reverse text-sm mt-1">
                    {breadcrumbs.map((crumb, index) => (
                        <li key={index} className="flex items-center">
                            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                            {crumb.path ? (
                                <Link to={crumb.path} className="text-primary hover:underline">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400">{crumb.label}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};

export default PageHeader;
