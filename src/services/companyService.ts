/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, auth } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Company, CompanyMaster } from '../types';
import { counterService } from './counterService';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  limit,
  startAfter,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const LEGACY_COLLECTION = 'companies';
const MASTER_COLLECTION = 'companyMaster';

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_gtech',
    nameTH: 'บริษัท จี-เทค ดิจิทัล โซลูชันส์ จำกัด',
    nameEN: 'G-Tech Digital Solutions Co., Ltd.',
    website: 'https://g-tech.example.com',
    contactEmail: 'hr@g-tech.example.com',
    contactPhone: '02-123-4567',
    categoryId: 'tech',
    registeredAt: '2026-06-08T09:30:00Z',
    boothId: 'A01'
  },
  {
    id: 'comp_bmg',
    nameTH: 'บางกอก มีเดีย แอดเวอร์ไทซิ่ง กรุ๊ป',
    nameEN: 'Bangkok Media Advertising Group',
    website: 'https://bmg.example.com',
    contactEmail: 'contact@bmg-media.example.com',
    contactPhone: '081-987-6543',
    categoryId: 'marketing',
    registeredAt: '2026-06-09T14:15:00Z',
  },
  {
    id: 'comp_bu_alumni',
    nameTH: 'เครือข่ายวิสาหกิจศิษย์เก่า มหาวิทยาลัยกรุงเทพ',
    nameEN: 'Bangkok University Alumni Enterprise Network',
    website: 'https://alumni.bu.ac.th',
    contactEmail: 'connect@bu-alumni.example.org',
    contactPhone: '02-350-3500',
    categoryId: 'finance',
    registeredAt: '2026-06-10T02:00:00Z',
    boothId: 'B01'
  }
];

let sandboxCompanies: Company[] = [...INITIAL_COMPANIES];

let sandboxCompanyMaster: CompanyMaster[] = [
  {
    id: 'cm_01',
    companyCode: 'CMP-000001',
    companyNameTH: 'บริษัท จี-เทค ดิจิทัล โซลูชันส์ จำกัด',
    companyNameEN: 'G-Tech Digital Solutions Co., Ltd.',
    businessCategoryId: 'bc_tech',
    businessCategoryNameTH: 'เทคโนโลยีและดิจิทัล',
    businessCategoryNameEN: 'Technology & Digital',
    website: 'https://g-tech.example.com',
    active: true,
    source: 'manual',
    remarks: 'Default system seed company',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'cm_02',
    companyCode: 'CMP-000002',
    companyNameTH: 'บางกอก มีเดีย แอดเวอร์ไทซิ่ง กรุ๊ป',
    companyNameEN: 'Bangkok Media Advertising Group',
    businessCategoryId: 'bc_mkt',
    businessCategoryNameTH: 'การตลาดและการโฆษณา',
    businessCategoryNameEN: 'Marketing & Digital Advertising',
    website: 'https://bmg.example.com',
    active: true,
    source: 'manual',
    remarks: 'Default system seed company',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'cm_03',
    companyCode: 'CMP-000003',
    companyNameTH: 'เครือข่ายวิสาหกิจศิษย์เก่า มหาวิทยาลัยกรุงเทพ',
    companyNameEN: 'Bangkok University Alumni Enterprise Network',
    businessCategoryId: 'bc_fin',
    businessCategoryNameTH: 'การบัญชีและการเงิน',
    businessCategoryNameEN: 'Accounting, Banking & Finance',
    website: 'https://alumni.bu.ac.th',
    active: true,
    source: 'manual',
    remarks: 'Default system seed company',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const companyService = {
  // ==========================================
  // NEW SYSTEM: companyMaster Collection
  // ==========================================
  
  async getAllMaster(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { 
      active?: boolean; 
      search?: string; 
      categoryId?: string | null; 
      createdFrom?: Date | null;
      createdTo?: Date | null;
      updatedFrom?: Date | null;
      updatedTo?: Date | null;
    }
  ): Promise<{ data: CompanyMaster[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxCompanyMaster];
      if (filters?.active !== undefined) {
        filtered = filtered.filter(c => c.active === filters.active);
      }
      if (filters?.categoryId) {
        filtered = filtered.filter(c => c.businessCategoryId === filters.categoryId);
      }
      if (filters?.search) {
        const keyword = filters.search.toLowerCase();
        filtered = filtered.filter(
          c => c.companyNameTH.toLowerCase().includes(keyword) || 
               c.companyNameEN.toLowerCase().includes(keyword) ||
               c.companyCode.toLowerCase().includes(keyword)
        );
      }
      if (filters?.createdFrom) {
        filtered = filtered.filter(c => new Date(c.createdAt as any) >= filters.createdFrom!);
      }
      if (filters?.createdTo) {
        filtered = filtered.filter(c => new Date(c.createdAt as any) <= filters.createdTo!);
      }
      if (filters?.updatedFrom) {
        filtered = filtered.filter(c => new Date(c.updatedAt as any) >= filters.updatedFrom!);
      }
      if (filters?.updatedTo) {
        filtered = filtered.filter(c => new Date(c.updatedAt as any) <= filters.updatedTo!);
      }

      // Sort by companyCode desc/asc as default
      filtered.sort((a, b) => b.companyCode.localeCompare(a.companyCode));

      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [];
      
      if (filters?.active !== undefined) {
        constraints.push(where('active', '==', filters.active));
      }
      if (filters?.categoryId) {
        constraints.push(where('businessCategoryId', '==', filters.categoryId));
      }

      const q = query(collection(db, MASTER_COLLECTION), ...constraints);
      const qSnap = await getDocs(q);
      
      let data = qSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          companyCode: d.companyCode || '',
          companyNameTH: d.companyNameTH || '',
          companyNameEN: d.companyNameEN || '',
          businessCategoryId: d.businessCategoryId || null,
          businessCategoryNameTH: d.businessCategoryNameTH || null,
          businessCategoryNameEN: d.businessCategoryNameEN || null,
          website: d.website || '',
          active: d.active ?? true,
          source: d.source || 'manual',
          remarks: d.remarks || '',
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as CompanyMaster;
      });

      // Filter remaining in memory to support complex text queries and date ranges without needing composite index pre-builds
      if (filters?.search) {
        const keyword = filters.search.toLowerCase().trim();
        data = data.filter(
          c => c.companyNameTH.toLowerCase().includes(keyword) || 
               c.companyNameEN.toLowerCase().includes(keyword) ||
               c.companyCode.toLowerCase().includes(keyword)
        );
      }
      if (filters?.createdFrom) {
        const fromTime = filters.createdFrom.getTime();
        data = data.filter(c => new Date(c.createdAt as any).getTime() >= fromTime);
      }
      if (filters?.createdTo) {
        const toTime = filters.createdTo.getTime();
        data = data.filter(c => new Date(c.createdAt as any).getTime() <= toTime);
      }
      if (filters?.updatedFrom) {
        const fromTime = filters.updatedFrom.getTime();
        data = data.filter(c => new Date(c.updatedAt as any).getTime() >= fromTime);
      }
      if (filters?.updatedTo) {
        const toTime = filters.updatedTo.getTime();
        data = data.filter(c => new Date(c.updatedAt as any).getTime() <= toTime);
      }

      // Sort by Company Code descending by default
      data.sort((a, b) => b.companyCode.localeCompare(a.companyCode));

      return { data, lastDoc: null };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, MASTER_COLLECTION);
      return { data: [], lastDoc: null };
    }
  },

  async getAllMasterRaw(): Promise<CompanyMaster[]> {
    if (!isFirebaseConfigured) {
      return [...sandboxCompanyMaster];
    }
    try {
      const qSnap = await getDocs(collection(db, MASTER_COLLECTION));
      return qSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          companyCode: d.companyCode || '',
          companyNameTH: d.companyNameTH || '',
          companyNameEN: d.companyNameEN || '',
          businessCategoryId: d.businessCategoryId || null,
          businessCategoryNameTH: d.businessCategoryNameTH || null,
          businessCategoryNameEN: d.businessCategoryNameEN || null,
          website: d.website || '',
          active: d.active ?? true,
          source: d.source || 'manual',
          remarks: d.remarks || '',
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as CompanyMaster;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, MASTER_COLLECTION);
      return [];
    }
  },

  async getMasterById(id: string): Promise<CompanyMaster | null> {
    if (!isFirebaseConfigured) {
      return sandboxCompanyMaster.find(c => c.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, MASTER_COLLECTION, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        companyCode: d.companyCode || '',
        companyNameTH: d.companyNameTH || '',
        companyNameEN: d.companyNameEN || '',
        businessCategoryId: d.businessCategoryId || null,
        businessCategoryNameTH: d.businessCategoryNameTH || null,
        businessCategoryNameEN: d.businessCategoryNameEN || null,
        website: d.website || '',
        active: d.active ?? true,
        source: d.source || 'manual',
        remarks: d.remarks || '',
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as CompanyMaster;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${MASTER_COLLECTION}/${id}`);
      return null;
    }
  },

  subscribeMaster(callback: (companies: CompanyMaster[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxCompanyMaster]);
      return () => {};
    }
    const q = query(collection(db, MASTER_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          companyCode: d.companyCode || '',
          companyNameTH: d.companyNameTH || '',
          companyNameEN: d.companyNameEN || '',
          businessCategoryId: d.businessCategoryId || null,
          businessCategoryNameTH: d.businessCategoryNameTH || null,
          businessCategoryNameEN: d.businessCategoryNameEN || null,
          website: d.website || '',
          active: d.active ?? true,
          source: d.source || 'manual',
          remarks: d.remarks || '',
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as CompanyMaster;
      });
      list.sort((a, b) => b.companyCode.localeCompare(a.companyCode));
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, MASTER_COLLECTION);
      if (onError) onError(err);
    });
  },

  async createMaster(comp: Omit<CompanyMaster, 'id' | 'companyCode' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, operatorEmail: string): Promise<CompanyMaster> {
    // Generate code format sequentially, e.g. CMP-000004
    let seq = 1;
    try {
      seq = await counterService.getNextSequence('companyCounter', operatorEmail);
    } catch (err) {
      console.warn('Failed to retrieve next sequence via transaction. Mocking sequential offset.', err);
      if (!isFirebaseConfigured) {
        seq = sandboxCompanyMaster.length + 1;
      }
    }
    const companyCode = `CMP-${String(seq).padStart(6, '0')}`;

    const raw: CompanyMaster = {
      ...comp,
      companyCode,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'cm_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxCompanyMaster.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, MASTER_COLLECTION), {
        ...comp,
        companyCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      });
      return { ...raw, id: ref.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, MASTER_COLLECTION);
      return raw;
    }
  },

  async updateMaster(id: string, updates: Partial<CompanyMaster>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxCompanyMaster.findIndex(c => c.id === id);
      if (idx !== -1) {
        sandboxCompanyMaster[idx] = {
          ...sandboxCompanyMaster[idx],
          ...updates,
          updatedAt: new Date(),
          updatedBy: operatorEmail
        };
      }
      return;
    }

    try {
      await updateDoc(doc(db, MASTER_COLLECTION, id), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: operatorEmail
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${MASTER_COLLECTION}/${id}`);
    }
  },

  async deleteMaster(id: string, operatorEmail: string): Promise<void> {
    // Requirements request: "DELETE RULE: ไม่ลบจริง ใช้ Soft Delete active = false. Admin สามารถ Restore ได้"
    await this.updateMaster(id, { active: false }, operatorEmail);
  },

  async restoreMaster(id: string, operatorEmail: string): Promise<void> {
    await this.updateMaster(id, { active: true }, operatorEmail);
  },

  // ==========================================
  // LEGACY BACKWARD COMPATIBILITY: companies Collection
  // ==========================================

  async getAll(): Promise<Company[]> {
    if (!isFirebaseConfigured) {
      return [...sandboxCompanies];
    }
    try {
      const qSnap = await getDocs(collection(db, LEGACY_COLLECTION));
      if (qSnap.empty) {
        if (auth?.currentUser) {
          await this.hydrateDefaults();
        }
        return [...INITIAL_COMPANIES];
      }
      return qSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Company));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, LEGACY_COLLECTION);
      return [];
    }
  },

  async getById(id: string): Promise<Company | null> {
    if (!isFirebaseConfigured) {
      return sandboxCompanies.find(c => c.id === id) || null;
    }
    try {
      const snap = await getDoc(doc(db, LEGACY_COLLECTION, id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Company;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${LEGACY_COLLECTION}/${id}`);
      return null;
    }
  },

  async create(company: Omit<Company, 'id'>, customId?: string): Promise<Company> {
    const id = customId || 'comp_' + Math.random().toString(36).substr(2, 9);
    const newCompany: Company = { id, ...company };

    if (!isFirebaseConfigured) {
      sandboxCompanies.push(newCompany);
      return newCompany;
    }

    try {
      await setDoc(doc(db, LEGACY_COLLECTION, id), {
        nameTH: newCompany.nameTH,
        nameEN: newCompany.nameEN,
        website: newCompany.website || '',
        contactEmail: newCompany.contactEmail,
        contactPhone: newCompany.contactPhone,
        categoryId: newCompany.categoryId,
        registeredAt: newCompany.registeredAt,
        boothId: newCompany.boothId || null,
        createdAt: serverTimestamp()
      });
      return newCompany;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, LEGACY_COLLECTION);
      return newCompany;
    }
  },

  async update(id: string, updates: Partial<Omit<Company, 'id'>>): Promise<boolean> {
    if (!isFirebaseConfigured) {
      const index = sandboxCompanies.findIndex(c => c.id === id);
      if (index === -1) return false;
      sandboxCompanies[index] = { ...sandboxCompanies[index], ...updates };
      return true;
    }

    try {
      await updateDoc(doc(db, LEGACY_COLLECTION, id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${LEGACY_COLLECTION}/${id}`);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isFirebaseConfigured) {
      const index = sandboxCompanies.findIndex(c => c.id === id);
      if (index === -1) return false;
      sandboxCompanies.splice(index, 1);
      return true;
    }

    try {
      await deleteDoc(doc(db, LEGACY_COLLECTION, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${LEGACY_COLLECTION}/${id}`);
      return false;
    }
  },

  async hydrateDefaults() {
    if (!isFirebaseConfigured) return;
    try {
      for (const comp of INITIAL_COMPANIES) {
        await setDoc(doc(db, LEGACY_COLLECTION, comp.id), {
          nameTH: comp.nameTH,
          nameEN: comp.nameEN,
          website: comp.website || '',
          contactEmail: comp.contactEmail,
          contactPhone: comp.contactPhone,
          categoryId: comp.categoryId,
          registeredAt: comp.registeredAt,
          boothId: comp.boothId || null
        });
      }
    } catch (e) {
      console.error('Failed to pre-populate default companies:', e);
    }
  }
};
