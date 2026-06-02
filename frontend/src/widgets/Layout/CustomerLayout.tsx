/**
 * CustomerLayout — Clean wrapper for authenticated CLIENT users.
 *
 * Renders customer Navbar at top, page content via Outlet, and Footer at bottom.
 * No sidebar, no admin topbar.
 */

import { Outlet } from 'react-router-dom';
import { Navbar } from '@/widgets/Navbar';
import { Footer } from '@/widgets/Footer';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
