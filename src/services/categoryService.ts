/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { BusinessCategory, Category } from '../types';
import { auditService } from './auditService';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

const NEW_COLLECTION = 'businessCategories';

export interface CategoryTreeNode extends BusinessCategory {
  id?: string;
  children: BusinessCategory[];
}

// ----------------------------------------------------
// Core Seed Data (as requested in Prompt #6)
// ----------------------------------------------------
export const MANDATORY_SEED_DATA: Omit<BusinessCategory, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [
  // 1. Industrials (สินค้าอุตสาหกรรม)
  { categoryCode: 'IND', parentCode: null, level: 1, categoryNameTH: 'สินค้าอุตสาหกรรม', categoryNameEN: 'Industrials', fullNameTH: 'สินค้าอุตสาหกรรม', fullNameEN: 'Industrials', sortOrder: 10, active: true, allowCustomText: false },
  { categoryCode: 'IND_AUTO', parentCode: 'IND', level: 2, categoryNameTH: 'ยานยนต์', categoryNameEN: 'Automotive', fullNameTH: 'สินค้าอุตสาหกรรม > ยานยนต์', fullNameEN: 'Industrials > Automotive', sortOrder: 11, active: true, allowCustomText: false },
  { categoryCode: 'IND_MACH', parentCode: 'IND', level: 2, categoryNameTH: 'วัสดุอุตสาหกรรมและเครื่องจักร', categoryNameEN: 'Industrial Materials & Machinery', fullNameTH: 'สินค้าอุตสาหกรรม > วัสดุอุตสาหกรรมและเครื่องจักร', fullNameEN: 'Industrials > Industrial Materials & Machinery', sortOrder: 12, active: true, allowCustomText: false },
  { categoryCode: 'IND_PACK', parentCode: 'IND', level: 2, categoryNameTH: 'บรรจุภัณฑ์', categoryNameEN: 'Packaging', fullNameTH: 'สินค้าอุตสาหกรรม > บรรจุภัณฑ์', fullNameEN: 'Industrials > Packaging', sortOrder: 13, active: true, allowCustomText: false },
  { categoryCode: 'IND_PPR', parentCode: 'IND', level: 2, categoryNameTH: 'กระดาษและวัสดุพิมพ์', categoryNameEN: 'Paper & Printing Materials', fullNameTH: 'สินค้าอุตสาหกรรม > กระดาษและวัสดุพิมพ์', fullNameEN: 'Industrials > Paper & Printing Materials', sortOrder: 14, active: true, allowCustomText: false },
  { categoryCode: 'IND_PETR', parentCode: 'IND', level: 2, categoryNameTH: 'ปิโตรเคมีและเคมีภัณฑ์', categoryNameEN: 'Petrochemicals & Chemicals', fullNameTH: 'สินค้าอุตสาหกรรม > ปิโตรเคมีและเคมีภัณฑ์', fullNameEN: 'Industrials > Petrochemicals & Chemicals', sortOrder: 15, active: true, allowCustomText: false },
  { categoryCode: 'IND_STEEL', parentCode: 'IND', level: 2, categoryNameTH: 'เหล็ก และผลิตภัณฑ์โลหะ', categoryNameEN: 'Steel & Metal Products', fullNameTH: 'สินค้าอุตสาหกรรม > เหล็ก และผลิตภัณฑ์โลหะ', fullNameEN: 'Industrials > Steel & Metal Products', sortOrder: 16, active: true, allowCustomText: false },

  // 2. Tech (เทคโนโลยี)
  { categoryCode: 'TECH', parentCode: null, level: 1, categoryNameTH: 'เทคโนโลยี', categoryNameEN: 'Tech', fullNameTH: 'เทคโนโลยี', fullNameEN: 'Tech', sortOrder: 20, active: true, allowCustomText: false },
  { categoryCode: 'TECH_ELEC', parentCode: 'TECH', level: 2, categoryNameTH: 'ชิ้นส่วนอิเล็กทรอนิกส์', categoryNameEN: 'Electronic Components', fullNameTH: 'เทคโนโลยี > ชิ้นส่วนอิเล็กทรอนิกส์', fullNameEN: 'Tech > Electronic Components', sortOrder: 21, active: true, allowCustomText: false },
  { categoryCode: 'TECH_ICT', parentCode: 'TECH', level: 2, categoryNameTH: 'เทคโนโลยีและการสื่อสาร', categoryNameEN: 'Information & Communication Technology', fullNameTH: 'เทคโนโลยี > เทคโนโลยีและการสื่อสาร', fullNameEN: 'Tech > Information & Communication Technology', sortOrder: 22, active: true, allowCustomText: false },

  // 3. Property (อสังหาริมทรัพย์)
  { categoryCode: 'PROP', parentCode: null, level: 1, categoryNameTH: 'อสังหาริมทรัพย์', categoryNameEN: 'Property', fullNameTH: 'อสังหาริมทรัพย์', fullNameEN: 'Property', sortOrder: 30, active: true, allowCustomText: false },
  { categoryCode: 'PROP_MAT', parentCode: 'PROP', level: 2, categoryNameTH: 'วัสดุก่อสร้าง', categoryNameEN: 'Construction Materials', fullNameTH: 'อสังหาริมทรัพย์ > วัสดุก่อสร้าง', fullNameEN: 'Property > Construction Materials', sortOrder: 31, active: true, allowCustomText: false },
  { categoryCode: 'PROP_SERV', parentCode: 'PROP', level: 2, categoryNameTH: 'บริการรับเหมาก่อสร้าง', categoryNameEN: 'Construction Services', fullNameTH: 'อสังหาริมทรัพย์ > บริการรับเหมาก่อสร้าง', fullNameEN: 'Property > Construction Services', sortOrder: 32, active: true, allowCustomText: false },
  { categoryCode: 'PROP_DEV', parentCode: 'PROP', level: 2, categoryNameTH: 'พัฒนาอสังหาริมทรัพย์', categoryNameEN: 'Property Development', fullNameTH: 'อสังหาริมทรัพย์ > พัฒนาอสังหาริมทรัพย์', fullNameEN: 'Property > Property Development', sortOrder: 33, active: true, allowCustomText: false },

  // 4. Financial (ธุรกิจการเงิน)
  { categoryCode: 'FIN', parentCode: null, level: 1, categoryNameTH: 'ธุรกิจการเงิน', categoryNameEN: 'Financial', fullNameTH: 'ธุรกิจการเงิน', fullNameEN: 'Financial', sortOrder: 40, active: true, allowCustomText: false },
  { categoryCode: 'FIN_BANK', parentCode: 'FIN', level: 2, categoryNameTH: 'ธนาคาร', categoryNameEN: 'Banking', fullNameTH: 'ธุรกิจการเงิน > ธนาคาร', fullNameEN: 'Financial > Banking', sortOrder: 41, active: true, allowCustomText: false },
  { categoryCode: 'FIN_SEC', parentCode: 'FIN', level: 2, categoryNameTH: 'เงินทุนและหลักทรัพย์', categoryNameEN: 'Finance & Securities', fullNameTH: 'ธุรกิจการเงิน > เงินทุนและหลักทรัพย์', fullNameEN: 'Financial > Finance & Securities', sortOrder: 42, active: true, allowCustomText: false },

  // 5. Food (อาหาร)
  { categoryCode: 'FOOD', parentCode: null, level: 1, categoryNameTH: 'อาหาร', categoryNameEN: 'Food', fullNameTH: 'อาหาร', fullNameEN: 'Food', sortOrder: 50, active: true, allowCustomText: false },
  { categoryCode: 'FOOD_BEV', parentCode: 'FOOD', level: 2, categoryNameTH: 'อาหารและเครื่องดื่ม', categoryNameEN: 'Food & Beverage', fullNameTH: 'อาหาร > อาหารและเครื่องดื่ม', fullNameEN: 'Food > Food & Beverage', sortOrder: 51, active: true, allowCustomText: false },

  // 6. Energy (พลังงาน)
  { categoryCode: 'ENERG', parentCode: null, level: 1, categoryNameTH: 'พลังงาน', categoryNameEN: 'Energy', fullNameTH: 'พลังงาน', fullNameEN: 'Energy', sortOrder: 60, active: true, allowCustomText: false },
  { categoryCode: 'ENERG_UTIL', parentCode: 'ENERG', level: 2, categoryNameTH: 'พลังงานและสาธารณูปโภค', categoryNameEN: 'Energy & Utilities', fullNameTH: 'พลังงาน > พลังงานและสาธารณูปโภค', fullNameEN: 'Energy > Energy & Utilities', sortOrder: 61, active: true, allowCustomText: false },

  // 7. Products (สินค้า)
  { categoryCode: 'PROD', parentCode: null, level: 1, categoryNameTH: 'สินค้า', categoryNameEN: 'Products', fullNameTH: 'สินค้า', fullNameEN: 'Products', sortOrder: 70, active: true, allowCustomText: false },
  { categoryCode: 'PROD_FASH', parentCode: 'PROD', level: 2, categoryNameTH: 'แฟชั่น', categoryNameEN: 'Fashion', fullNameTH: 'สินค้า > แฟชั่น', fullNameEN: 'Products > Fashion', sortOrder: 71, active: true, allowCustomText: false },
  { categoryCode: 'PROD_HOME', parentCode: 'PROD', level: 2, categoryNameTH: 'Home & Office Products', categoryNameEN: 'Home & Office Products', fullNameTH: 'สินค้า > Home & Office Products', fullNameEN: 'Products > Home & Office Products', sortOrder: 72, active: true, allowCustomText: false },
  { categoryCode: 'PROD_MED', parentCode: 'PROD', level: 2, categoryNameTH: 'ของใช้ส่วนตัวและเวชภัณฑ์', categoryNameEN: 'Personal Product & Pharmaceuticals', fullNameTH: 'สินค้า > ของใช้ส่วนตัวและเวชภัณฑ์', fullNameEN: 'Products > Personal Product & Pharmaceuticals', sortOrder: 73, active: true, allowCustomText: false },

  // 8. Services (บริการ)
  { categoryCode: 'SERV', parentCode: null, level: 1, categoryNameTH: 'บริการ', categoryNameEN: 'Services', fullNameTH: 'บริการ', fullNameEN: 'Services', sortOrder: 80, active: true, allowCustomText: false },
  { categoryCode: 'SERV_COMM', parentCode: 'SERV', level: 2, categoryNameTH: 'พาณิชย์', categoryNameEN: 'Commerce', fullNameTH: 'บริการ > พาณิชย์', fullNameEN: 'Services > Commerce', sortOrder: 81, active: true, allowCustomText: false },
  { categoryCode: 'SERV_HEALTH', parentCode: 'SERV', level: 2, categoryNameTH: 'การแพทย์', categoryNameEN: 'Health Care Services', fullNameTH: 'บริการ > การแพทย์', fullNameEN: 'Services > Health Care Services', sortOrder: 82, active: true, allowCustomText: false },
  { categoryCode: 'SERV_MEDIA', parentCode: 'SERV', level: 2, categoryNameTH: 'สื่อและสิ่งพิมพ์', categoryNameEN: 'Media & Publishing', fullNameTH: 'บริการ > สื่อและสิ่งพิมพ์', fullNameEN: 'Services > Media & Publishing', sortOrder: 83, active: true, allowCustomText: false },
  { categoryCode: 'SERV_PROF', parentCode: 'SERV', level: 2, categoryNameTH: 'บริการเฉพาะกิจ', categoryNameEN: 'Professional Services', fullNameTH: 'บริการ > บริการเฉพาะกิจ', fullNameEN: 'Services > Professional Services', sortOrder: 84, active: true, allowCustomText: false },
  { categoryCode: 'SERV_TOUR', parentCode: 'SERV', level: 2, categoryNameTH: 'การท่องเที่ยวและสันทนาการ', categoryNameEN: 'Tourism & Leisure', fullNameTH: 'บริการ > การท่องเที่ยวและสันทนาการ', fullNameEN: 'Services > Tourism & Leisure', sortOrder: 85, active: true, allowCustomText: false },
  { categoryCode: 'SERV_LOGIS', parentCode: 'SERV', level: 2, categoryNameTH: 'ขนส่งและโลจิสติกส์', categoryNameEN: 'Transportation & Logistics', fullNameTH: 'บริการ > ขนส่งและโลจิสติกส์', fullNameEN: 'Services > Transportation & Logistics', sortOrder: 86, active: true, allowCustomText: false },

  // 9. Others (อื่น ๆ)
  { categoryCode: 'OTHERS', parentCode: null, level: 1, categoryNameTH: 'อื่น ๆ', categoryNameEN: 'Others', fullNameTH: 'อื่น ๆ', fullNameEN: 'Others', sortOrder: 99, active: true, allowCustomText: true }
];

// In-Memory Fallback Sandbox state
let sandboxBusinessCategories: BusinessCategory[] = MANDATORY_SEED_DATA.map((item, idx) => ({
  ...item,
  id: `cat_${idx + 1}`,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: 'system'
})) as BusinessCategory[];

export const categoryService = {
  // ========================================================
  // Core Methods
  // ========================================================

  async getAllBusinessCategories(): Promise<BusinessCategory[]> {
    if (!isFirebaseConfigured) {
      return [...sandboxBusinessCategories].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    try {
      const q = query(collection(db, NEW_COLLECTION), orderBy('sortOrder', 'asc'));
      const qSnap = await getDocs(q);
      return qSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt
        } as BusinessCategory;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, NEW_COLLECTION);
      return [];
    }
  },

  async getAllMasterRaw(): Promise<BusinessCategory[]> {
    return this.getAllBusinessCategories();
  },

  async getBusinessCategoryById(id: string): Promise<BusinessCategory | null> {
    if (!isFirebaseConfigured) {
      return sandboxBusinessCategories.find(c => c.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, NEW_COLLECTION, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        ...d,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt
      } as BusinessCategory;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${NEW_COLLECTION}/${id}`);
      return null;
    }
  },

  subscribeBusinessCategories(callback: (categories: BusinessCategory[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxBusinessCategories].sort((a, b) => a.sortOrder - b.sortOrder));
      return () => {};
    }
    const q = query(collection(db, NEW_COLLECTION), orderBy('sortOrder', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt
        } as BusinessCategory;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, NEW_COLLECTION);
      if (onError) onError(err);
    });
  },

  async createBusinessCategory(cat: Omit<BusinessCategory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, operatorEmail: string): Promise<BusinessCategory> {
    const raw: BusinessCategory = {
      ...cat,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'bc_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxBusinessCategories.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, NEW_COLLECTION), {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      });
      return { ...raw, id: ref.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, NEW_COLLECTION);
      return raw;
    }
  },

  async updateBusinessCategory(id: string, updates: Partial<BusinessCategory>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxBusinessCategories.findIndex(c => c.id === id);
      if (idx !== -1) {
        sandboxBusinessCategories[idx] = {
          ...sandboxBusinessCategories[idx],
          ...updates,
          updatedAt: new Date(),
          updatedBy: operatorEmail
        };
      }
      return;
    }

    try {
      await updateDoc(doc(db, NEW_COLLECTION, id), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: operatorEmail
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${NEW_COLLECTION}/${id}`);
    }
  },

  async deleteBusinessCategory(id: string): Promise<void> {
    // In our system deletion acts as Soft Delete: we call updateBusinessCategory(id, { active: false })
    // To implement the requested prompt "ห้ามลบข้อมูลจริง ให้ใช้ Soft Delete active = false"
    // We handle the actual logic in UI or route calls, but provide this tool
    if (!isFirebaseConfigured) {
      const idx = sandboxBusinessCategories.findIndex(c => c.id === id);
      if (idx !== -1) {
        sandboxBusinessCategories[idx].active = false;
      }
      return;
    }
    try {
      await updateDoc(doc(db, NEW_COLLECTION, id), {
        active: false,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${NEW_COLLECTION}/${id}`);
    }
  },

  // ==========================================
  // HIERARCHICAL SPECIFIC FUNCTIONS
  // ==========================================

  async getParents(): Promise<BusinessCategory[]> {
    const list = await this.getAllBusinessCategories();
    return list.filter(c => c.level === 1);
  },

  async getChildren(parentCode: string): Promise<BusinessCategory[]> {
    const list = await this.getAllBusinessCategories();
    return list.filter(c => c.level === 2 && c.parentCode === parentCode);
  },

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const list = await this.getAllBusinessCategories();
    const parents = list.filter(c => c.level === 1) as CategoryTreeNode[];
    const children = list.filter(c => c.level === 2);

    parents.forEach(p => {
      p.children = children.filter(c => c.parentCode === p.categoryCode);
    });

    return parents;
  },

  async getActiveCategories(): Promise<BusinessCategory[]> {
    const list = await this.getAllBusinessCategories();
    return list.filter(c => c.active);
  },

  async initializeCategories(operatorEmail: string): Promise<{ success: boolean; count: number }> {
    // Initialize standard categories
    const existing = await this.getAllBusinessCategories();
    
    // Calculate which items in seed data do not exist by Category Code
    const toAdd = MANDATORY_SEED_DATA.filter(seed => 
      !existing.some(ext => ext.categoryCode === seed.categoryCode)
    );

    if (toAdd.length === 0) {
      return { success: true, count: 0 };
    }

    if (!isFirebaseConfigured) {
      toAdd.forEach((seed, idx) => {
        sandboxBusinessCategories.push({
          ...seed,
          id: `bc_seed_${Date.now()}_${idx}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: operatorEmail,
          updatedBy: operatorEmail
        } as BusinessCategory);
      });
      await auditService.logAction(
        'Initialize Categories',
        operatorEmail,
        'multiple',
        'BusinessCategory',
        `Seeded ${toAdd.length} categories into memory.`
      );
      return { success: true, count: toAdd.length };
    }

    try {
      const batch = writeBatch(db);
      const catColl = collection(db, NEW_COLLECTION);
      
      toAdd.forEach(item => {
        const itemRef = doc(catColl);
        batch.set(itemRef, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: operatorEmail,
          updatedBy: operatorEmail
        });
      });

      await batch.commit();

      await auditService.logAction(
        'Initialize Categories',
        operatorEmail,
        'multiple',
        'BusinessCategory',
        `Successfully initialized ${toAdd.length} new parent & child categories into database.`
      );

      return { success: true, count: toAdd.length };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, NEW_COLLECTION);
      return { success: false, count: 0 };
    }
  },

  // ========================================================
  // Backward compatibility with legacy components
  // ========================================================
  async getAll(): Promise<Category[]> {
    const list = await this.getAllBusinessCategories();
    // Map BusinessCategory to Category format
    return list.map(c => ({
      id: c.id || c.categoryCode,
      nameTH: c.categoryNameTH,
      nameEN: c.categoryNameEN,
      descriptionTH: c.fullNameTH,
      descriptionEN: c.fullNameEN
    }));
  }
};
