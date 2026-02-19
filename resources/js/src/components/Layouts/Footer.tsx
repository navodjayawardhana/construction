import { useSettings } from '../../contexts/SettingsContext';

const Footer = () => {
    const { settings } = useSettings();

    return (
        <div className="dark:text-white-dark text-center ltr:sm:text-left rtl:sm:text-right p-6 mt-auto">
            {(settings.developer_company || settings.developer_phone) && (
                <div className="px-4 py-3 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                        © {new Date().getFullYear()} |
                        {settings.developer_company && (
                            <span>
                                Developed by{' '}
                                <a
                                    href="https://nexgensolutionsl.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {settings.developer_company}
                                </a>
                            </span>
                        )}
                        {settings.developer_company && settings.developer_phone && <br />}
                        {settings.developer_phone && <span>Tel: {settings.developer_phone}</span>}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Footer;
