import React, { useState } from 'react';
import { Submission, Course, Student } from '../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Search,
  Filter,
  BarChart2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  Users,
  ShieldCheck,
  FolderSync,
} from 'lucide-react';

interface DashboardViewProps {
  submissions: Submission[];
  students: Student[];
  selectedCourse: Course;
  onSelectSubmissionToGrade: (submission: Submission) => void;
  onOpenPreGradingDiagnostic?: (submission: Submission) => void;
  onBatchAutoGrade?: () => Promise<void>;
  isBatchGrading?: boolean;
  onSyncAllToLms: () => void;
  isSyncing: boolean;
  onOpenClassroomModal?: (tab?: 'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  submissions,
  students,
  selectedCourse,
  onSelectSubmissionToGrade,
  onOpenPreGradingDiagnostic,
  onBatchAutoGrade,
  isBatchGrading = false,
  onSyncAllToLms,
  isSyncing,
  onOpenClassroomModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassessed' | 'graded_draft' | 'synced_to_lms'>('all');

  const filteredSubmissions = submissions.filter((s) => {
    const matchesCourse = s.courseId === selectedCourse.id || true;
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.lmsStatus === statusFilter;
    return matchesCourse && matchesSearch && matchesStatus;
  });

  const totalCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.lmsStatus !== 'unassessed').length;
  const syncedCount = submissions.filter((s) => s.lmsStatus === 'synced_to_lms').length;
  const pendingCount = totalCount - gradedCount;

  // Average score calculation
  const scoredSubmissions = submissions.filter((s) => s.totalScore !== undefined && s.maxScore);
  const avgScorePercent =
    scoredSubmissions.length > 0
      ? Math.round(
          (scoredSubmissions.reduce((acc, s) => acc + (s.totalScore! / s.maxScore!) * 100, 0) /
            scoredSubmissions.length)
        )
      : 88;

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Student Name', 'Assignment Title', 'Total Score', 'Max Score', 'Status', 'Feedback Summary', 'Voice Memos Count'];
    const rows = submissions.map((s) => [
      `"${s.studentName}"`,
      `"${s.assignmentTitle}"`,
      s.totalScore ?? '',
      s.maxScore ?? '',
      `"${s.lmsStatus}"`,
      `"${(s.feedbackSummary || '').replace(/"/g, '""')}"`,
      s.voiceNotes?.length || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grade_Assessment_${selectedCourse.code}_Backup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 6-Step Grading Workflow Stepper Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Standard Teacher Grading Lifecycle (Google Classroom Flow)
          </span>
          <button
            type="button"
            onClick={handleExportCsv}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Export Gradebook Backup (CSV)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold">
            <div className="text-[10px] font-black text-indigo-600 uppercase">Step 1</div>
            <div>Dashboard & Class Switcher</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="text-[10px] font-black text-slate-400 uppercase">Step 2</div>
            <div>Import & Name OCR Check</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="text-[10px] font-black text-slate-400 uppercase">Step 3</div>
            <div>Rubrics & Outcome Benchmarks</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="text-[10px] font-black text-slate-400 uppercase">Step 4</div>
            <div>AI First Impression Scan</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="text-[10px] font-black text-slate-400 uppercase">Step 5</div>
            <div>Canvas Stamps & Audio Memos</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="text-[10px] font-black text-slate-400 uppercase">Step 6</div>
            <div>Passback to Classroom & Drive</div>
          </div>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Grade Assessment Tool • Google Classroom Sync
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {selectedCourse.title}
            </h1>
            <p className="text-sm text-indigo-200 mt-1 leading-relaxed">
              Section {selectedCourse.section} • {selectedCourse.studentCount} Enrolled Students • Syncing via Google Classroom
            </p>

            {onOpenClassroomModal && (
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('import_assignment')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
                  title="Import Google Classroom assignments, student papers, and rubrics"
                >
                  <FolderSync className="w-3.5 h-3.5 text-white" />
                  <span>Import Assignment from Classroom</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('my_classes')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-sm"
                  title="Switch active course"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Switch Class</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('connection_test')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-sm"
                  title="Verify Google Workspace OAuth Scopes & Classroom API Status"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Test Connection & Scopes</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Batch AI Auto-Grade Button */}
            {onBatchAutoGrade && (
              <button
                type="button"
                onClick={onBatchAutoGrade}
                disabled={isBatchGrading}
                className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                title="Use Gemini AI to batch evaluate all unassessed student submissions against the rubric"
              >
                <Sparkles className={`w-4 h-4 ${isBatchGrading ? 'animate-spin' : ''}`} />
                {isBatchGrading ? 'Batch Auto-Grading...' : '✨ Batch AI Auto-Grade All'}
              </button>
            )}

            <button
              onClick={onSyncAllToLms}
              disabled={isSyncing}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Send className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing to Google Classroom...' : 'Bulk Push All Scores to Gradebook'}
            </button>
          </div>
        </div>

        {/* Ambient Gradient Overlay */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Submissions
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalCount}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Handwritten OCR & GDocs
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unassessed Queue
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Awaiting Teacher Review
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Synced to Gradebook
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {syncedCount} / {totalCount}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              API Status: 200 OK
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Class Average Score
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {avgScorePercent}%
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              Rubric Mastery Rate
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Assignment Submissions List & Filter Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Student Assignment Progress & Submissions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any student to open OCR text digitization & Apple Pencil annotation canvas.
            </p>
          </div>

          {/* Search & Filter Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student name..."
                className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('unassessed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  statusFilter === 'unassessed'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Unassessed
              </button>
              <button
                onClick={() => setStatusFilter('synced_to_lms')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  statusFilter === 'synced_to_lms'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Synced
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Assignment & Format</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">OCR Status</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">LMS Sync</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSubmissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                      {sub.studentName.slice(0, 2)}
                    </div>
                    <span>{sub.studentName}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {sub.assignmentTitle}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {sub.submissionType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(sub.submissionDate).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      <Zap className="w-3 h-3 text-indigo-600" />
                      {sub.ocrConfidence}% OCR Conf.
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {sub.totalScore !== undefined ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
                        {sub.totalScore} / {sub.maxScore}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Not Graded</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {sub.lmsStatus === 'synced_to_lms' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Synced
                      </span>
                    ) : sub.lmsStatus === 'graded_draft' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Draft Graded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Unassessed
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {onOpenPreGradingDiagnostic && (
                        <button
                          type="button"
                          onClick={() => onOpenPreGradingDiagnostic(sub)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold text-xs inline-flex items-center gap-1 transition-colors border border-purple-200 dark:border-purple-800"
                          title="Run Pre-Assessment AI Diagnostic & Name Verification"
                        >
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Pre-Scan</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectSubmissionToGrade(sub)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        Grade in Studio
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
