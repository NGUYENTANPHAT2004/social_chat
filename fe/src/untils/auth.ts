import { AUTH_VALIDATION } from '@/constants/auth';

export class AuthUtils {
  // Validate username
  static validateUsername(username: string): string | null {
    if (!username) return 'Username is required';
    if (username.length < AUTH_VALIDATION.USERNAME.MIN_LENGTH) {
      return `Username must be at least ${AUTH_VALIDATION.USERNAME.MIN_LENGTH} characters`;
    }
    if (username.length > AUTH_VALIDATION.USERNAME.MAX_LENGTH) {
      return `Username must be no more than ${AUTH_VALIDATION.USERNAME.MAX_LENGTH} characters`;
    }
    if (!AUTH_VALIDATION.USERNAME.PATTERN.test(username)) {
      return AUTH_VALIDATION.USERNAME.ERROR_MESSAGE;
    }
    return null;
  }

  // Validate email
  static validateEmail(email: string): string | null {
    if (!email) return 'Email is required';
    if (!AUTH_VALIDATION.EMAIL.PATTERN.test(email)) {
      return AUTH_VALIDATION.EMAIL.ERROR_MESSAGE;
    }
    return null;
  }

  // Validate password
  static validatePassword(password: string): string | null {
    if (!password) return 'Password is required';
    if (password.length < AUTH_VALIDATION.PASSWORD.MIN_LENGTH) {
      return `Password must be at least ${AUTH_VALIDATION.PASSWORD.MIN_LENGTH} characters`;
    }
    if (!AUTH_VALIDATION.PASSWORD.PATTERN.test(password)) {
      return AUTH_VALIDATION.PASSWORD.ERROR_MESSAGE;
    }
    return null;
  }

  // Get password strength
  static getPasswordStrength(password: string): {
    score: number;
    feedback: string;
    color: string;
  } {
    let score = 0;
    let feedback = '';
    let color = 'text-red-500';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very Weak';
        color = 'text-red-500';
        break;
      case 2:
        feedback = 'Weak';
        color = 'text-orange-500';
        break;
      case 3:
        feedback = 'Fair';
        color = 'text-yellow-500';
        break;
      case 4:
        feedback = 'Good';
        color = 'text-blue-500';
        break;
      case 5:
        feedback = 'Strong';
        color = 'text-green-500';
        break;
      default:
        feedback = 'Unknown';
        color = 'text-gray-500';
    }

    return { score, feedback, color };
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Get token expiry time
  static getTokenExpiry(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  // Format auth error message
  static formatAuthError(error: any): string {
    if (typeof error === 'string') return error;
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  // Generate secure random password
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // special character
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Clear all auth data
  static clearAuthData(): void {
    Object.values(AUTH_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  // Set remember me preference
  static setRememberMe(remember: boolean): void {
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, 'true');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_ME);
    }
  }

  // Check if remember me is set
  static getRememberMe(): boolean {
    return localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_ME) === 'true';
  }
}