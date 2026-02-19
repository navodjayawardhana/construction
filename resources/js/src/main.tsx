import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client'

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

// Redux
import { Provider } from 'react-redux';
import store from './store/index';

// Toast notifications
import { Toaster } from 'react-hot-toast';

// Settings
import { SettingsProvider } from './contexts/SettingsContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense>
            <Provider store={store}>
                <SettingsProvider>
                    <RouterProvider router={router} />
                    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
                </SettingsProvider>
            </Provider>
        </Suspense>
    </React.StrictMode>
);

