/**
 * validateEmail - Validate email format using RFC 5322 simplified regex.
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * validatePassword - Validate password strength.
 * Requirements:
 *   - At least 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one digit
 *   - At least one special character (!@#$%^&*)
 * @param password - Password string to validate
 * @returns true if valid, false otherwise
 */
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * validatePasswordStrength - Get password strength level.
 * @param password - Password string to analyze
 * @returns 'weak' | 'fair' | 'good' | 'strong'
 */
export const validatePasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
  if (password.length === 0) return 'weak';

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 1) return 'weak';
  if (score <= 2) return 'fair';
  if (score <= 3) return 'good';
  return 'strong';
};

/**
 * validatePhoneNumber - Validate phone number format (US format).
 * @param phone - Phone number string
 * @returns true if valid US phone format, false otherwise
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+?1)?[\s.-]?\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return phoneRegex.test(phone);
};
