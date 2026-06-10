/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, auth } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { EmailLog, EmailTemplate } from '../types';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

const TEMPLATE_COLL = 'email_templates';
const LOG_COLL = 'email_logs';

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_registration_received',
    name: 'Registration Received (คำขอลงทะเบียนเข้ามา)',
    subjectTH: 'มหาวิทยาลัยกรุงเทพ ได้รับคำขอลงทะเบียนงาน BU Job Fair ของท่านแล้ว',
    subjectEN: 'Bangkok University: Your BU Job Fair Application has been received',
    bodyTH: '<p>เรียน ท่านผู้รับผิดชอบบริษัท {{companyName}}</p><p>ทางคณะกรรมการจัดงานมุ่งมั่นขอขอบคุณที่ท่านสละเวลาสมัครลงทะเบียนเข้าร่วมงาน BU Job Fair สิทธิ์ของท่านอยู่ในขั้นตอนการตรวจสอบเบื้องต้น...</p>',
    bodyEN: '<p>Dear Representative of {{companyName}},</p><p>We hereby confirm receipt of your corporate registration submission for the upcoming BU Job Fair event...</p>',
    type: 'initial'
  },
  {
    id: 'tpl_registration_approved',
    name: 'Application Approved & Booth Allocated (อนุมัติลงทะเบียนและจัดสรรบูธ)',
    subjectTH: 'ตอบรับการอนุมัติและจัดสรรพื้นที่บูธงาน BU Job Fair 2026',
    subjectEN: 'Approved & Allocated: BU Job Fair 2026 booth confirmation',
    bodyTH: '<p>ยินดีด้วย! บริษัท {{companyName}} ได้รับการอนุมัติให้เข้าร่วมงานอย่างเป็นทางการ บูธเลขที่จัดสรรของท่านคือ {{boothNumber}}</p>',
    bodyEN: '<p>Congratulations! {{companyName}} is officially approved to participate. Your allocated booth number is {{boothNumber}}.</p>',
    type: 'approved'
  },
  {
    id: 'tpl_registration_rejected',
    name: 'Application Dis disapproved (ไม่ผ่านการอนุมัติเข้าร่วม)',
    subjectTH: 'แจ้งผลการตรวจสอบสิทธิ์การสมัครงาน BU Job Fair 2026',
    subjectEN: 'Update status of your application regarding BU Job Fair 2026',
    bodyTH: '<p>เรียน ผู้รับผิดชอบ ทางเราต้องขออภัยอย่างสูงในการเรียนแจ้งข้อมูลว่าคำขอสมัครของท่านไม่ผ่านคุณสมบัติจัดแสดงบูธในปีนี้...</p>',
    bodyEN: '<p>Dear Applicant, We regret to inform you that your application failed to clear our strict criteria catalog for exhibit booth limits...</p>',
    type: 'rejected'
  }
];

const INITIAL_LOGS: EmailLog[] = [
  {
    id: 'log_01',
    recipient: 'hr@g-tech.example.com',
    subject: 'มหาวิทยาลัยกรุงเทพ ได้รับคำขอลงทะเบียนงาน BU Job Fair ของท่านแล้ว',
    status: 'sent',
    sentAt: '2026-06-08T09:31:10Z',
    templateId: 'tpl_registration_received'
  },
  {
    id: 'log_02',
    recipient: 'hr@g-tech.example.com',
    subject: 'ตอบรับการอนุมัติและจัดสรรพื้นที่บูธงาน BU Job Fair 2026',
    status: 'sent',
    sentAt: '2026-06-08T11:00:15Z',
    templateId: 'tpl_registration_approved'
  },
  {
    id: 'log_03',
    recipient: 'contact@bmg-media.example.com',
    subject: 'Bangkok University: Your BU Job Fair Application has been received',
    status: 'sent',
    sentAt: '2026-06-09T14:15:30Z',
    templateId: 'tpl_registration_received'
  }
];

let sandboxTemplates: EmailTemplate[] = [...DEFAULT_TEMPLATES];
let sandboxLogs: EmailLog[] = [...INITIAL_LOGS];

export const emailService = {
  // Templates API
  async getTemplates(): Promise<EmailTemplate[]> {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      return [...sandboxTemplates];
    }
    try {
      const qSnap = await getDocs(collection(db, TEMPLATE_COLL));
      if (qSnap.empty) {
        await this.hydrateDefaultTemplates();
        return [...DEFAULT_TEMPLATES];
      }
      return qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, TEMPLATE_COLL);
      return [];
    }
  },

  async updateTemplate(id: string, updates: Partial<Omit<EmailTemplate, 'id'>>): Promise<boolean> {
    if (!isFirebaseConfigured) {
      const index = sandboxTemplates.findIndex(t => t.id === id);
      if (index === -1) return false;
      sandboxTemplates[index] = { ...sandboxTemplates[index], ...updates };
      return true;
    }
    try {
      await updateDoc(doc(db, TEMPLATE_COLL, id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${TEMPLATE_COLL}/${id}`);
      return false;
    }
  },

  // Log Transmissions API
  async getLogs(): Promise<EmailLog[]> {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      return [...sandboxLogs];
    }
    try {
      const qSnap = await getDocs(collection(db, LOG_COLL));
      if (qSnap.empty) {
        await this.hydrateDefaultLogs();
        return [...INITIAL_LOGS];
      }
      return qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailLog));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, LOG_COLL);
      return [];
    }
  },

  async logSentEmail(recipient: string, subject: string, templateId: string, status: 'sent' | 'pending' | 'failed' = 'sent'): Promise<EmailLog> {
    const id = 'log_' + Math.random().toString(36).substr(2, 9);
    const sentAt = new Date().toISOString();
    const newLog: EmailLog = { id, recipient, subject, status, sentAt, templateId };

    if (!isFirebaseConfigured) {
      sandboxLogs.unshift(newLog);
      return newLog;
    }

    try {
      await setDoc(doc(db, LOG_COLL, id), {
        recipient,
        subject,
        status,
        sentAt,
        templateId,
        createdAt: serverTimestamp()
      });
      return newLog;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, LOG_COLL);
      return newLog;
    }
  },

  async hydrateDefaultTemplates() {
    if (!isFirebaseConfigured) return;
    try {
      for (const t of DEFAULT_TEMPLATES) {
        await setDoc(doc(db, TEMPLATE_COLL, t.id), {
          name: t.name,
          subjectTH: t.subjectTH,
          subjectEN: t.subjectEN,
          bodyTH: t.bodyTH,
          bodyEN: t.bodyEN,
          type: t.type
        });
      }
    } catch (e) {
      console.error('Failed to populate email templates:', e);
    }
  },

  async hydrateDefaultLogs() {
    if (!isFirebaseConfigured) return;
    try {
      for (const l of INITIAL_LOGS) {
        await setDoc(doc(db, LOG_COLL, l.id), {
          recipient: l.recipient,
          subject: l.subject,
          status: l.status,
          sentAt: l.sentAt,
          templateId: l.templateId
        });
      }
    } catch (e) {
      console.error('Failed to populate email logs:', e);
    }
  }
};
