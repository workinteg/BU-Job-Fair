/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auditService } from './auditService';
import { AuditLog } from '../types';

export const auditLogService = {
  async getAll(): Promise<AuditLog[]> {
    const res = await auditService.getAll();
    return res.data;
  },

  async logAction(user: string, action: string, details: string): Promise<AuditLog> {
    return await auditService.logAction(action, user, '', 'System', details);
  },

  async hydrateDefaults() {
    // Handled in seeds
  }
};
