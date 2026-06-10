/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { collection, getDocs } from 'firebase/firestore';

export const categoryAnalyticsService = {
  /**
   * Returns a map of category ID or code to count of active companies
   */
  async getCompanyCountByCategory(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    if (!isFirebaseConfigured) {
      // In-memory fallback
      // Try to load any sandbox companyMaster records
      // Since it's imported dynamically or defined globally, let's just query or output general count
      return {
        'bc_tech': 1,
        'bc_mkt': 1,
        'bc_fin': 1,
        'IND_AUTO': 0,
        'TECH_ELEC': 0
      };
    }

    try {
      const snap = await getDocs(collection(db, 'companyMaster'));
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.active !== false && data.businessCategoryId) {
          counts[data.businessCategoryId] = (counts[data.businessCategoryId] || 0) + 1;
        }
      });
      return counts;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'companyMaster');
      return {};
    }
  },

  /**
   * Returns a map of category ID or code to count of registered companies
   */
  async getRegistrationCountByCategory(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    if (!isFirebaseConfigured) {
      return {
        'bc_tech': 1,
        'bc_mkt': 1,
        'bc_fin': 0,
        'IND_AUTO': 0
      };
    }

    try {
      const snap = await getDocs(collection(db, 'registrations'));
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.businessCategoryId) {
          counts[data.businessCategoryId] = (counts[data.businessCategoryId] || 0) + 1;
        }
      });
      return counts;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'registrations');
      return {};
    }
  }
};
