import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { loginUser, clearError } from '../../store/authSlice';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state: IRootState) => state.auth);
    const { settings } = useSettings();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginUser({ email, password }));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[url('/assets/images/map.svg')] bg-cover bg-center dark:bg-[url('/assets/images/map-dark.svg')]">
            <div className="panel m-6 w-full max-w-lg sm:w-[480px]">
                <div className="flex flex-col items-center mb-10">
                    {settings.business_logo ? (
                        <img src={settings.business_logo} alt={settings.business_name} className="w-20 h-20 object-contain mb-4" />
                    ) : (
                        <div className="w-16 h-16 bg-construction rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-construction">{settings.business_name || 'Construction Manager'}</h2>
                    <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="dark:text-white">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="dark:text-white">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full !bg-construction border-construction hover:!bg-construction-dark" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
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
            </div>
        </div>
    );
};

export default Login;
