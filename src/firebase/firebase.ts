/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect whether the current firebase-applet-config contains placeholder credentials.
export const isFirebaseConfigured =
  firebaseConfig &&
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.apiKey !== 'PLACEHOLDER_API_KEY' &&
  firebaseConfig.projectId !== 'PLACEHOLDER_PROJECT_ID';

let app;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);

    // Call getFromServer of firestore to validate live connection as requested in the Firebase integration skill
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(
          "⚠️ [Firebase Configuration Warning]: Could not reach Cloud Firestore backend.\n" +
          "This typically indicates the browser or proxy block, or Authorized Domains in your Firebase console is not configured for your Sandbox domain.\n" +
          "Error detail:", errorMsg
        );
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, db };
