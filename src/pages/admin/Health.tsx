/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { db, isFirebaseConfigured } from '../../firebase/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { 
  Activity, 
  Database, 
  UserCheck, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Server
} from 'lucide-react';

export const Health: React.FC = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [collectionStats, setCollectionStats] = useState<Array<{ name: string; count: number | string; status: 'ok' | 'unknown' | 'error' }>>([]);
  const [dbStatus, setDbStatus] = useState<'connected' | 'simulated' | 'error'>('simulated');
  const [pingTime, setPingTime] = useState<number | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      if (!isFirebaseConfigured) {
        setDbStatus('simulated');
        setPingTime(Math.round(performance.now() - start));
        loadSimulatedDocs();
        setLoading(false);
        return;
      }

      // Check real Firestore with quick query limit 1
      const q = query(collection(db, 'settings'), limit(1));
      await getDocs(q);
      setDbStatus('connected');
      setPingTime(Math.round(performance.now() - start));
      await loadRealFirestoreDocs();
    } catch (err) {
      console.error('Firestore health check failed:', err);
      setDbStatus('error');
      setPingTime(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulatedDocs = () => {
    // Return mock lengths
    setCollectionStats([
      { name: 'admins', count: 'Active (Sandbox)', status: 'ok' },
      { name: 'auditLogs', count: 'Dynamic Mock', status: 'ok' },
      { name: 'announcements', count: 'Active (Sandbox)', status: 'ok' },
      { name: 'businessCategories', count: 5, status: 'ok' },
      { name: 'eventDates', count: 2, status: 'ok' },
      { name: 'booths', count: 6, status: 'ok' },
      { name: 'companyMaster', count: 3, status: 'ok' },
      { name: 'registrations', count: 2, status: 'ok' },
      { name: 'emailTemplates', count: 1, status: 'ok' },
      { name: 'emailQueue', count: 1, status: 'ok' },
      { name: 'emailLogs', count: 1, status: 'ok' },
      { name: 'systemCounters', count: 1, status: 'ok' },
    ]);
  };

  const loadRealFirestoreDocs = async () => {
    const list = [
      'admins', 'auditLogs', 'announcements', 'businessCategories', 
      'eventDates', 'booths', 'companyMaster', 'registrations', 
      'emailTemplates', 'emailQueue', 'emailLogs', 'systemCounters'
    ];

    const statsPromises = list.map(async (colName) => {
      try {
        const snap = await getDocs(query(collection(db, colName), limit(50)));
        return { name: colName, count: snap.size, status: 'ok' as const };
      } catch (e) {
        return { name: colName, count: 'Access Denied (Rules)', status: 'error' as const };
      }
    });

    const results = await Promise.all(statsPromises);
    setCollectionStats(results);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-sans">System Health Status</h1>
          <p className="text-sm text-slate-500 font-sans">Real-time health parameters and indices diagnostic reports.</p>
        </div>
        <button
          onClick={checkConnection}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50 font-sans"
        >
          <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Auth & Service Connection */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-slate-900 font-sans">Cloud Service Status</h3>
            </div>
            {dbStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <CheckCircle className="h-3 w-3" /> Connect
              </span>
            ) : dbStatus === 'simulated' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                <Activity className="h-3 w-3" /> Sandbox Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                <AlertTriangle className="h-3 w-3" /> Connection Error
              </span>
            )}
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Platform Target:</span>
              <span className="font-medium text-slate-700 font-mono">React / Web API</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Firebase Host:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {isFirebaseConfigured ? 'Live Production' : 'Simulated Sandbox'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Query Ping:</span>
              <span className="font-semibold text-indigo-600 font-mono">
                {pingTime ? `${pingTime}ms` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Operator Roles Overview */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-slate-900 font-sans">Verified Operator Scope</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              <ShieldCheck className="h-3 w-3" /> Super Admin
            </span>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Active User:</span>
              <span className="font-medium text-slate-700 font-sans max-w-[150px] truncate">
                {user?.displayName || 'Super Developer'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Operator Email:</span>
              <span className="font-semibold text-slate-700 font-mono max-w-[150px] truncate">
                {user?.email || 'workinteg@bu.ac.th'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Role Level:</span>
              <span className="font-semibold text-slate-700 font-mono uppercase">{role || 'superAdmin'}</span>
            </div>
          </div>
        </div>

        {/* System Releases Metrics */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-slate-900 font-sans">Engine Specification</h3>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">System Version:</span>
              <span className="font-semibold text-slate-700 font-mono">v1.2.0-schema</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Build Environment:</span>
              <span className="font-medium text-emerald-600 font-mono">Production Ready</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-sans">Spark Plan Limit:</span>
              <span className="font-semibold text-slate-700 font-sans">No Trigger Fees</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Collections Manifest */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          <h3 className="font-medium text-slate-900 font-sans">Database Collections Manifest</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                <th className="py-3.5 px-6">Collection Path</th>
                <th className="py-3.5 px-6">Record Count / Status</th>
                <th className="py-3.5 px-6">Security Context</th>
                <th className="py-3.5 px-6">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-sans text-slate-700">
              {collectionStats.map((stat, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-mono font-medium text-slate-800">
                    /{stat.name}
                  </td>
                  <td className="py-4 px-6 font-mono">
                    {typeof stat.count === 'number' ? `${stat.count} items / lines` : stat.count}
                  </td>
                  <td className="py-4 px-6">
                    {stat.name === 'settings' || stat.name === 'businessCategories' || stat.name === 'eventDates' || stat.name === 'companyMaster' || stat.name === 'emailTemplates' ? (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono font-semibold">
                        Super Admin Access Only
                      </span>
                    ) : stat.name === 'registrations' || stat.name === 'booths' || stat.name === 'announcements' ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-mono font-semibold">
                        Admin / Public Allowed
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded font-mono font-semibold">
                        Standard Operators
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {stat.status === 'ok' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" /> Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5" /> Restricted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
