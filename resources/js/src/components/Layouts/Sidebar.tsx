import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const { settings } = useSettings();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            {settings.business_logo ? (
                                <img src={settings.business_logo} alt="Logo" className="w-8 h-8 object-contain rounded mr-2" />
                            ) : (
                                <div className="w-8 h-8 bg-construction rounded-lg flex items-center justify-center mr-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xl font-bold text-construction align-middle ltr:ml-1.5 rtl:mr-1.5 dark:text-white-light lg:inline truncate max-w-[160px]">
                                {settings.business_name || 'Construction'}
                            </span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <svg className="w-5 h-5 m-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* Dashboard */}
                            <li className="nav-item">
                                <NavLink to="/" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path opacity="0.5" d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M12 15L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Dashboard</span>
                                    </div>
                                </NavLink>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 16 40" fill="none"><path d="M15.5 0H0V40H15.5" stroke="currentColor" /></svg>
                                <span>Jobs & Operations</span>
                            </h2>

                            {/* Create Job (POS) */}
                            <li className="nav-item">
                                <NavLink to="/jobs/create" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark font-bold">Create Job</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* JCB Jobs */}
                            <li className="nav-item">
                                <NavLink to="/jcb-jobs" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 16H22M2 16V20H22V16M2 16L4 4H20L22 16M7 20V22M17 20V22M6 8H18M7 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">JCB Jobs</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Lorry Jobs */}
                            <li className="nav-item">
                                <NavLink to="/lorry-jobs" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 14H15V4H9L1 14ZM1 14V18H3M15 18H7M15 4H19L23 10V18H21M3 18C3 19.1046 3.89543 20 5 20C6.10457 20 7 19.1046 7 18M3 18C3 16.8954 3.89543 16 5 16C6.10457 16 7 16.8954 7 18M21 18C21 19.1046 20.1046 20 19 20C17.8954 20 17 19.1046 17 18C17 16.8954 17.8954 16 19 16C20.1046 16 21 16.8954 21 18ZM15 10H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Lorry Jobs</span>
                                    </div>
                                </NavLink>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 16 40" fill="none"><path d="M15.5 0H0V40H15.5" stroke="currentColor" /></svg>
                                <span>Management</span>
                            </h2>

                            {/* Vehicles */}
                            <li className="nav-item">
                                <NavLink to="/vehicles" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.5 18H15.5M3.5 18V11L5.5 5H18.5L20.5 11V18C20.5 19.1046 19.6046 20 18.5 20H5.5C4.39543 20 3.5 19.1046 3.5 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Vehicles</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Clients */}
                            <li className="nav-item">
                                <NavLink to="/clients" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                                            <path opacity="0.5" d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Clients</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Workers */}
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'workers' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('workers')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 12C17.2091 12 19 10.2091 19 8C19 5.79086 17.2091 4 15 4M15 22C15 22 16 22 16 21C16 20 15 17 11 17C7 17 6 20 6 21C6 22 7 22 7 22H15ZM11 14C13.2091 14 15 12.2091 15 10C15 7.79086 13.2091 6 11 6C8.79086 6 7 7.79086 7 10C7 12.2091 8.79086 14 11 14ZM19 17C21.2091 17 22 15.6569 22 15C22 14.3431 21.2091 12 19 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Workers</span>
                                    </div>
                                    <div className={currentMenu !== 'workers' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 9L12 15L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'workers' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li><NavLink to="/workers">All Workers</NavLink></li>
                                        <li><NavLink to="/attendance">Mark Attendance</NavLink></li>
                                        <li><NavLink to="/attendance-report">Attendance Report</NavLink></li>
                                        <li><NavLink to="/salary-payments">Salary Payments</NavLink></li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 16 40" fill="none"><path d="M15.5 0H0V40H15.5" stroke="currentColor" /></svg>
                                <span>Finance</span>
                            </h2>

                            {/* Reports */}
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'reports' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('reports')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Reports</span>
                                    </div>
                                    <div className={currentMenu !== 'reports' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 9L12 15L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'reports' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li><NavLink to="/reports/client-statement">Client Statement</NavLink></li>
                                        <li><NavLink to="/reports/monthly-revenue-expense">Monthly Revenue</NavLink></li>
                                        <li><NavLink to="/reports/vehicle">Vehicle Report</NavLink></li>
                                        <li><NavLink to="/reports/daily-job-summary">Daily Summary</NavLink></li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* Paysheets */}
                            <li className="nav-item">
                                <NavLink to="/paysheets/monthly" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Paysheets</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Expenses */}
                            <li className="nav-item">
                                <NavLink to="/expenses" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M12 8V16M9 11L12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Expenses</span>
                                    </div>
                                </NavLink>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 16 40" fill="none"><path d="M15.5 0H0V40H15.5" stroke="currentColor" /></svg>
                                <span>System</span>
                            </h2>

                            {/* Settings */}
                            <li className="nav-item">
                                <NavLink to="/settings" className="group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-construction shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Settings</span>
                                    </div>
                                </NavLink>
                            </li>

                        </ul>

                        {/* Developer Footer */}
                        {(settings.developer_company || settings.developer_phone) && (
                            <div className="px-4 py-3 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
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
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
