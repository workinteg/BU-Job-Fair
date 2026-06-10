/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { companyService } from './companyService';

export const companyDuplicateService = {
  /**
   * Check if a Thai or English company name already exists (excluding a specific ID for edit checks)
   */
  async checkDuplicate(
    nameTH: string,
    nameEN: string,
    excludeId?: string
  ): Promise<{ duplicateTH: boolean; duplicateEN: boolean }> {
    const cleanTH = nameTH.trim().toLowerCase();
    const cleanEN = nameEN.trim().toLowerCase();

    // Fetch all master records
    const all = await companyService.getAllMasterRaw();

    let duplicateTH = false;
    let duplicateEN = false;

    for (const c of all) {
      if (excludeId && c.id === excludeId) continue;

      if (cleanTH && c.companyNameTH.trim().toLowerCase() === cleanTH) {
        duplicateTH = true;
      }
      if (cleanEN && c.companyNameEN.trim().toLowerCase() === cleanEN) {
        duplicateEN = true;
      }
    }

    return { duplicateTH, duplicateEN };
  }
};

export default companyDuplicateService;
