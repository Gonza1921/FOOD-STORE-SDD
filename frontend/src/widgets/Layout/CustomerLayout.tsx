/**
 * CustomerLayout — Clean wrapper for authenticated CLIENT users.
 *
 * Renders customer Navbar at top, page content via Outlet, and Footer at bottom.
 * No sidebar, no admin topbar.
 */

import { Outlet } from 'react-router-dom';
import { Navbar } from '@/widgets/Navbar';
import { Footer } from '@/widgets/Footer';
import { ToastContainer } from '@/shared/components/Toast';
import { useToastStore } from '@/shared/hooks/useToast';

export default function CustomerLayout() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
