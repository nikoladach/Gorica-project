/**
 * Password validation utility
 * Provides functions to validate password strength
 */

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @param {boolean} strict - If true, enforces stronger requirements (8+ chars, uppercase, lowercase, number, special char)
 * @returns {{ valid: boolean, errors: string[] }} - Validation result
 */
export function validatePassword(password, strict = false) {
  const errors = [];
  
  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }
  
  if (strict) {
    // Strict mode: 8+ characters, uppercase, lowercase, number, special character
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
      errors.push('Password is too common. Please choose a stronger password');
    }
  } else {
    // Basic mode: minimum 6 characters
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get password strength score (0-4)
 * @param {string} password - Password to score
 * @returns {number} - Strength score (0 = very weak, 4 = very strong)
 */
export function getPasswordStrength(password) {
  if (!password) return 0;
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  // Cap at 4
  return Math.min(score, 4);
}

/**
 * Get password strength label
 * @param {string} password - Password to evaluate
 * @returns {string} - Strength label
 */
export function getPasswordStrengthLabel(password) {
  const strength = getPasswordStrength(password);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[strength] || 'Very Weak';
}

