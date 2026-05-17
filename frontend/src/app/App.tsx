import { BrowserRouter } from 'react-router-dom';
import Providers from './providers';
import AuthProvider from '@/features/auth/components/AuthProvider';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import ToastContainer from '@/shared/ui/ToastContainer';
import Router from './Router';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Providers>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </Providers>
        <ToastContainer />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
