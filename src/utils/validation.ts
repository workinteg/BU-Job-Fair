/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reusable validation utilities for the application.
 */
export const validationUtils = {
  /**
   * Validates if a string is a valid email address.
   */
  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Validates if a string is a valid phone number.
   * Supports standard Thai and international formatting.
   */
  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[-+() ]/g, '');
    return cleanPhone.length >= 9 && cleanPhone.length <= 15 && /^\d+$/.test(cleanPhone);
  },

  /**
   * Validates if a value is present (not undefined, null, or empty string).
   */
  isRequired(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  },

  /**
   * Validates if a value is a valid number and optionally falls within specified bounds.
   */
  isValidNumber(value: unknown, min?: number, max?: number): boolean {
    if (value === undefined || value === null || value === '') return false;
    const num = Number(value);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  }
};
