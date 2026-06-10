/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { counterService } from './counterService';

export const registrationNumberService = {
  /**
   * Generates a unique, sequential registration number in the format 'BUJF-2026-000001'
   * by atomically incrementing the counter inside 'systemCounters' collection.
   */
  async generateNextRegistrationNumber(operatorEmail: string = 'system'): Promise<string> {
    try {
      const nextSequence = await counterService.getNextSequence('registration', operatorEmail);
      // Pad to 6 digits, e.g. 000001
      const paddedSequence = String(nextSequence).padStart(6, '0');
      return `BUJF-2026-${paddedSequence}`;
    } catch (err) {
      console.error('Failed to generate next registration number:', err);
      // Failover to a random-backed fallback if atomic sequence fails
      const fallbackRandom = Math.floor(100000 + Math.random() * 90000);
      return `BUJF-2026-F${fallbackRandom}`;
    }
  }
};
