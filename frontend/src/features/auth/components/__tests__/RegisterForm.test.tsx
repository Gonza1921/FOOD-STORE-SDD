/**
 * Tests for RegisterForm component.
 *
 * Task 12.2 — RegisterForm: renderizado, validación, submit, confirmación de password.
 *
 * NOTE: Requires vitest + @testing-library/react to be set up.
 * Install: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
 *
 * Run: npx vitest run
 */

describe('RegisterForm', () => {
  it.todo('renders nombre, apellido, email, password, confirmPassword fields');
  it.todo('shows validation error for empty nombre');
  it.todo('shows validation error for empty apellido');
  it.todo('shows validation error for invalid email format');
  it.todo('shows validation error for password shorter than 8 chars');
  it.todo('shows validation error when passwords do not match');
  it.todo('calls register with form data on submit');
  it.todo('shows API error on duplicate email');
  it.todo('navigates to home on successful registration');
  it.todo('disables submit button while loading');
});
