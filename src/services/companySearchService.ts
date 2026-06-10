/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { companyService } from './companyService';
import { CompanyMaster } from '../types';

export const companySearchService = {
  /**
   * Search active companies matching a keyword in Thai, English, or Code
   */
  async searchCompanies(keyword: string): Promise<CompanyMaster[]> {
    const cleanKeyword = keyword.trim().toLowerCase();
    const all = await companyService.getAllMasterRaw();
    // Only search active companies
    const activeCompanies = all.filter(c => c.active);

    if (!cleanKeyword) {
      return activeCompanies;
    }

    return activeCompanies.filter(c => 
      c.companyNameTH.toLowerCase().includes(cleanKeyword) ||
      c.companyNameEN.toLowerCase().includes(cleanKeyword) ||
      c.companyCode.toLowerCase().includes(cleanKeyword)
    );
  },

  /**
   * Get a single company by ID
   */
  async getCompanyById(id: string): Promise<CompanyMaster | null> {
    return companyService.getMasterById(id);
  },

  /**
   * Get top suggested autocomplete options for search keyword
   */
  async getCompanySuggestions(keyword: string): Promise<CompanyMaster[]> {
    const results = await this.searchCompanies(keyword);
    // Limit to top 15 suggestions for fast list delivery and high screen responsiveness
    return results.slice(0, 15);
  }
};

export default companySearchService;
