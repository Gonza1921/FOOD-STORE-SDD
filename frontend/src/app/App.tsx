import { BrowserRouter } from 'react-router-dom';
import Providers from './providers';
import AuthProvider from '@/features/auth/components/AuthProvider';
import Router from './Router';

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </Providers>
    </BrowserRouter>
  );
}
