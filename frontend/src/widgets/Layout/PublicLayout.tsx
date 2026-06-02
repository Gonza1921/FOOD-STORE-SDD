/**
 * PublicLayout — Minimal wrapper for public-facing pages.
 *
 * Used for: home, catalog, product detail.
 * No auth required, no sidebar, no navbar (navbar will come in CH-027).
 */

import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <main className="min-h-screen bg-surface">
      <Outlet />
    </main>
  );
}
