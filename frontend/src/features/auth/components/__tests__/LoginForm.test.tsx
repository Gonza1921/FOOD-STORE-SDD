/**
 * Tests for LoginForm component.
 *
 * Task 12.1 — LoginForm: renderizado, validación, submit.
 *
 * NOTE: Requires vitest + @testing-library/react to be set up.
 * Install: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
 *
 * Run: npx vitest run
 */

// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { BrowserRouter } from 'react-router-dom';
// import { describe, it, expect, vi } from 'vitest';
// import LoginForm from '../LoginForm';
// import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
// vi.mock('../../hooks/useAuth');

describe('LoginForm', () => {
  it.todo('renders email and password fields');
  it.todo('shows validation error for empty email');
  it.todo('shows validation error for invalid email format');
  it.todo('shows validation error for empty password');
  it.todo('calls login with credentials on submit');
  it.todo('shows error message on failed login');
  it.todo('navigates to return URL on success');
  it.todo('disables submit button while loading');
  it.todo('shows generic error for invalid credentials');
});

/**
 * Example test implementation (once vitest is available):
 *
 * ```tsx
 * const renderLoginForm = () => {
 *   return render(
 *     <BrowserRouter>
 *       <LoginForm />
 *     </BrowserRouter>
 *   );
 * };
 *
 * it('renders email and password fields', () => {
 *   renderLoginForm();
 *   expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
 *   expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
 * });
 *
 * it('calls login with credentials on submit', async () => {
 *   const mockLogin = vi.fn();
 *   (useAuth as any).mockReturnValue({ login: mockLogin, isLoading: false, error: null });
 *   renderLoginForm();
 *
 *   fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
 *   fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
 *   fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
 *
 *   await waitFor(() => {
 *     expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
 *   });
 * });
 * ```
 */
