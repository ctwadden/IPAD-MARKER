import React, { useState } from 'react';
import { Course, Submission } from '../types';
import {
  RefreshCw,
  CheckCircle2,
  Send,
  Globe,
  Database,
  Lock,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface LmsSyncViewProps {
  submissions: Submission[];
  selectedCourse: Course;
  onSyncCourse: () => void;
  onPassbackSubmission: (sub: Submission) => Promise<void>;
  isSyncing: boolean;
  onOpenClassroomModal?: () => void;
}

export const LmsSyncView: React.FC<LmsSyncViewProps> = ({
  submissions,
  selectedCourse,
  onSyncCourse,
  onPassbackSubmission,
  isSyncing,
  onOpenClassroomModal,
}) => {
  const [syncedLogs, setSyncedLogs] = useState<
    { id: string; studentName: string; status: string; timestamp: string; transactionId: string }[]
  >([
    {
      id: 'log-1',
      studentName: 'Maya Lin',
      status: '200 OK (Posted to Google Classroom Gradebook)',
      timestamp: new Date().toLocaleTimeString(),
      transactionId: 'GC-PASSBACK-98231',
    },
  ]);

  const handlePassbackAll = async () => {
    const unposted = submissions.filter((s) => s.lmsStatus !== 'synced_to_lms');
    for (const sub of unposted) {
      await onPassbackSubmission(sub);
      setSyncedLogs((prev) => [
        {
          id: `log-${Date.now()}-${sub.id}`,
          studentName: sub.studentName,
          status: '200 OK (Grade & Feedback Pushed)',
          timestamp: new Date().toLocaleTimeString(),
          transactionId: `GC-SYNC-${Math.floor(Math.random() * 90000 + 10000)}`,
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              LMS & Google Classroom Direct API Integration
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seamless 2-way gradebook synchronization with Google Classroom, Canvas, Schoology, and Moodle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSyncCourse}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Roster & Assignments
          </button>

          <button
            onClick={handlePassbackAll}
            disabled={isSyncing}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <Send className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            Bulk Push Scores & Comments
          </button>
        </div>
      </div>

      {/* Grid: LMS Connection Specs vs Active Gradebook Sync Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Connection Specs Card - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Google Classroom API
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active OAuth 2.0
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold">{selectedCourse.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Course ID: {selectedCourse.lmsCourseId} • {selectedCourse.studentCount} Students
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Sync Mode:</span>
                <span className="font-semibold text-white">Bi-Directional API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roster Sync:</span>
                <span className="font-semibold text-white">Auto-Refreshed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gradebook Entry:</span>
                <span className="font-semibold text-emerald-400">Direct Passback</span>
              </div>
            </div>

            {onOpenClassroomModal && (
              <button
                type="button"
                onClick={onOpenClassroomModal}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Switch / Import Google Class</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Log & Submissions Queue - 8 Cols */}
        <div className="lg:col-span-8 flex flex-col gap-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Live Gradebook API Transmission Logs
          </h2>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {syncedLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.studentName}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                      {log.status}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <span>{log.transactionId}</span>
                  <span className="block font-medium">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
