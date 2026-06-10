/**
 * PublicLayout — Wrapper for public-facing store pages.
 *
 * Used for: home, catalog, product detail, categories.
 * No auth required — any visitor can browse.
 * Renders Navbar (with login/register or profile depending on auth state),
 * page content via Outlet, and Footer.
 */

import { Outlet } from 'react-router-dom';
import { Navbar } from '@/widgets/Navbar';
import { Footer } from '@/widgets/Footer';

export default function PublicLayout() {
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
