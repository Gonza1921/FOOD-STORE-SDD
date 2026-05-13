/**
 * Tests for ProtectedRoute component.
 *
 * Task 12.3 — ProtectedRoute: redirección sin auth, render con auth, 403 con rol insuficiente.
 *
 * NOTE: Requires vitest + @testing-library/react + Zustand mock setup.
 */

describe('ProtectedRoute', () => {
  it.todo('redirects to /login when user is not authenticated');
  it.todo('preserves return URL in location state');
  it.todo('renders children when user is authenticated (no roles required)');
  it.todo('renders children when user has required role');
  it.todo('redirects to /acceso-denegado when user lacks required role');
  it.todo('accepts custom redirectTo prop');
});
