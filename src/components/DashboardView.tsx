import React, { useState } from 'react';
import { Course, Submission, Student, ClassroomAssignment } from '../types';
import {
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Send,
  Search,
  ArrowRight,
  Zap,
  FileText,
  BookOpen,
  FolderSync,
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Camera,
  Filter,
} from 'lucide-react';

interface DashboardViewProps {
  courses?: Course[];
  submissions: Submission[];
  students: Student[];
  selectedCourse: Course | null;
  onSelectCourse?: (course: Course) => void;
  onSelectSubmissionToGrade: (submission: Submission) => void;
  onOpenPreGradingDiagnostic?: (submission?: Submission) => void;
  onBatchAutoGrade?: () => void;
  isBatchGrading?: boolean;
  onSyncAllToLms: () => void;
  isSyncing: boolean;
  onOpenClassroomModal?: (tab?: 'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test') => void;
  assignments?: ClassroomAssignment[];
  selectedAssignmentId?: string | null;
  onSelectAssignment?: (assignmentId: string | null) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  onClearAllFakeData?: () => void;
  onOpenDriveModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses = [],
  submissions,
  students,
  selectedCourse,
  onSelectCourse,
  onSelectSubmissionToGrade,
  onOpenPreGradingDiagnostic,
  onBatchAutoGrade,
  isBatchGrading = false,
  onSyncAllToLms,
  isSyncing,
  onOpenClassroomModal,
  assignments = [],
  selectedAssignmentId = null,
  onSelectAssignment,
  onDeleteAssignment,
  onClearAllFakeData,
  onOpenDriveModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassessed' | 'graded_draft' | 'synced_to_lms'>('all');

  // Check if any fake courses or assignments exist
  const hasFakeData =
    courses.some((c) => c.id.startsWith('course-') || c.id === 'course-1' || c.id === 'course-2' || c.id === 'course-3') ||
    assignments.some((a) => a.id.startsWith('gc-assign-'));

  // Assignments for the current selected class
  const classAssignments = selectedCourse
    ? assignments.filter(
        (a) =>
          a.courseId === selectedCourse.id ||
          (selectedCourse.lmsCourseId && a.courseId === selectedCourse.lmsCourseId)
      )
    : [];

  // Filter submissions by current course, selected assignment, search, and status
  const filteredSubmissions = submissions.filter((s) => {
    const matchesCourse = selectedCourse
      ? s.courseId === selectedCourse.id ||
        (selectedCourse.lmsCourseId && s.courseId === selectedCourse.lmsCourseId)
      : true;

    const selectedAssignObj = assignments.find((a) => a.id === selectedAssignmentId);
    const matchesAssignment = selectedAssignmentId
      ? s.lmsAssignmentId === selectedAssignmentId || (selectedAssignObj && s.assignmentTitle === selectedAssignObj.title)
      : true;

    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.lmsStatus === statusFilter;

    return matchesCourse && matchesAssignment && matchesSearch && matchesStatus;
  });

  // KPI calculations for currently scoped submissions
  const courseSubmissions = selectedCourse
    ? submissions.filter(
        (s) =>
          s.courseId === selectedCourse.id ||
          (selectedCourse.lmsCourseId && s.courseId === selectedCourse.lmsCourseId)
      )
    : submissions;

  const totalCount = courseSubmissions.length;
  const gradedCount = courseSubmissions.filter((s) => s.lmsStatus !== 'unassessed').length;
  const syncedCount = courseSubmissions.filter((s) => s.lmsStatus === 'synced_to_lms').length;
  const pendingCount = totalCount - gradedCount;

  // Average score calculation
  const scoredSubmissions = courseSubmissions.filter((s) => s.totalScore !== undefined && s.maxScore);
  const avgScorePercent =
    scoredSubmissions.length > 0
      ? Math.round(
          (scoredSubmissions.reduce((acc, s) => acc + (s.totalScore! / s.maxScore!) * 100, 0) /
            scoredSubmissions.length)
        )
      : 88;

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Student Name', 'Assignment Title', 'Total Score', 'Max Score', 'Status', 'Feedback Summary'];
    const rows = filteredSubmissions.map((s) => [
      `"${s.studentName}"`,
      `"${s.assignmentTitle}"`,
      s.totalScore ?? '',
      s.maxScore ?? '',
      `"${s.lmsStatus}"`,
      `"${(s.feedbackSummary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gradebook_${selectedCourse?.code || 'All'}_Backup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If no course is selected or available
  if (!selectedCourse && courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Ready for your Google Classroom Classes & Assignments
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            All fake classes and assignments have been removed. Connect with your Google Classroom teacher account (<span className="font-mono font-bold text-indigo-600">cwadden@gnspes.ca</span>) to import your real classes, or create one manually.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {onOpenClassroomModal && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('import_classroom')}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                >
                  <FolderSync className="w-4 h-4" />
                  <span>Import Google Classroom Classes</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('import_classroom')}
                  className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Class Manually</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Purge Fake Data Notice Banner */}
      {hasFakeData && onClearAllFakeData && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <strong>Sample mock classes/assignments detected</strong> (e.g. AP English, US History). Click here to delete all fake data and use only your own classes & assignments.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete all demo/fake classes and assignments? You can then import your real classes from Google Classroom.')) {
                onClearAllFakeData();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Fake Classes & Assignments</span>
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Active Grading Class • Google Classroom Ready
            </div>
            
            {/* Class Title with Quick Switcher */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {selectedCourse ? selectedCourse.title : 'Select a Course'}
              </h1>
              {courses.length > 1 && onSelectCourse && (
                <select
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const c = courses.find((item) => item.id === e.target.value);
                    if (c) onSelectCourse(c);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 focus:outline-none cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                      Switch to: {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCourse && (
              <p className="text-sm text-indigo-200 mt-1 leading-relaxed">
                Section {selectedCourse.section} • {selectedCourse.studentCount} Enrolled Students • {classAssignments.length} Assignment{classAssignments.length === 1 ? '' : 's'}
              </p>
            )}

            {onOpenClassroomModal && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('import_assignment')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
                  title="View, create, or import assignments for this class"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Manage & Create Assignments</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('my_classes')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-sm"
                  title="Switch or import active classes"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                  <span>All Classes ({courses.length})</span>
                </button>

                {onOpenDriveModal && (
                  <button
                    type="button"
                    onClick={onOpenDriveModal}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-sm"
                    title="Scan student papers and store PDF in Google Drive"
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-300" />
                    <span>Drive Paper Scanner (PDF)</span>
                  </button>
                )}
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
              {isSyncing ? 'Syncing to Google Classroom...' : 'Push All Scores to Classroom'}
            </button>
          </div>
        </div>

        {/* Ambient Gradient Overlay */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* CLASS ASSIGNMENTS SELECTOR & MANAGER CARD */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                Assignments for {selectedCourse?.title} ({classAssignments.length})
              </h3>
              <p className="text-xs text-slate-500">
                Select an assignment to view its student submissions, or create a new one.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenClassroomModal && (
              <button
                type="button"
                onClick={() => onOpenClassroomModal('import_assignment')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Assignment</span>
              </button>
            )}
          </div>
        </div>

        {/* Assignment Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onSelectAssignment && onSelectAssignment(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedAssignmentId === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>All Assignments</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              selectedAssignmentId === null ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {courseSubmissions.length}
            </span>
          </button>

          {classAssignments.map((assign) => {
            const isSelected = selectedAssignmentId === assign.id;
            const assignSubCount = submissions.filter(
              (s) => s.lmsAssignmentId === assign.id || s.assignmentTitle === assign.title
            ).length;
            return (
              <div
                key={assign.id}
                className={`flex items-center rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-indigo-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectAssignment && onSelectAssignment(assign.id)}
                  className="px-3.5 py-2 text-xs font-bold flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{assign.title}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {assignSubCount}
                  </span>
                </button>

                {onDeleteAssignment && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete assignment "${assign.title}"?`)) {
                        onDeleteAssignment(assign.id);
                      }
                    }}
                    className="pr-2.5 pl-1 py-2 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {classAssignments.length === 0 && (
            <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
              <span>No assignments in this class yet.</span>
              {onOpenClassroomModal && (
                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('import_assignment')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Fetch from Google Classroom or create one
                </button>
              )}
            </div>
          )}
        </div>
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
              Synced to Classroom
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {syncedCount} / {totalCount}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Google Classroom API
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
              <span>Student Submissions</span>
              {selectedAssignmentId && (
                <span className="text-xs font-normal text-slate-500">
                  (Filtered by active assignment)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any student to open the OCR text digitization & grading canvas studio.
            </p>
          </div>

          {/* Search, Filter, & Export */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student or assignment..."
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

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              title="Download CSV report"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length > 0 ? (
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
        ) : (
          <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No student submissions found
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {selectedAssignmentId
                  ? 'There are no student submissions attached to this specific assignment yet.'
                  : 'No student turn-ins found for this class.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {onOpenDriveModal && (
                <button
                  type="button"
                  onClick={onOpenDriveModal}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan Student Work (Camera / PDF)</span>
                </button>
              )}
              {onOpenClassroomModal && (
                <button
                  type="button"
                  onClick={() => onOpenClassroomModal('import_assignment')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <FolderSync className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fetch Classroom Turn-Ins</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
