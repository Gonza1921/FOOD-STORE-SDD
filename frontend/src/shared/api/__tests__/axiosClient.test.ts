/**
 * Tests for axiosClient interceptor.
 *
 * Task 12.4 — Axios interceptor: adjuntar token, refresh automático en 401.
 *
 * NOTE: Requires vitest + MSW (Mock Service Worker) or axios mock adapter.
 * Install: npm install -D vitest axios-mock-adapter
 */

describe('axiosClient interceptor', () => {
  it.todo('attaches Bearer token from authStore to every request');
  it.todo('skips auth endpoints (login, register, refresh) from interceptor');
  it.todo('attempts token refresh on 401 response');
  it.todo('queues concurrent requests during refresh');
  it.todo('retries original request after successful refresh');
  it.todo('logs out user when refresh fails');
  it.todo('redirects to /login when refresh fails');
  it.todo('prevents concurrent refresh requests (isRefreshing flag)');
  it.todo('updates authStore with new tokens after refresh');

  describe('refresh queue', () => {
    it.todo('processes all queued requests after successful refresh');
    it.todo('rejects all queued requests after failed refresh');
    it.todo('maintains request order in queue');
  });

  describe('edge cases', () => {
    it.todo('handles missing refresh token gracefully');
    it.todo('handles network error on refresh (no 401 response)');
    it.todo('handles concurrent 401 errors from different endpoints');
  });
});
