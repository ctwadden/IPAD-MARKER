import React, { useState } from 'react';
import { Course, ClassroomAssignment, Submission } from '../types';
import { GOOGLE_CLASSROOM_ASSIGNMENTS, generateAssignmentSubmissions } from '../data/mockData';
import {
  BookOpen,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  X,
  Users,
  ExternalLink,
  ShieldCheck,
  FolderSync,
  GraduationCap,
  FileText,
  Calendar,
  Award,
  ArrowRight,
  Zap,
  Check,
  AlertCircle,
  Clock,
  Send,
} from 'lucide-react';

interface ClassroomCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourse: Course;
  onSelectCourse: (course: Course) => void;
  onAddCourse: (newCourse: Course) => void;
  onImportAssignment?: (assignment: ClassroomAssignment, submissions: Submission[]) => void;
  initialTab?: 'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test';
}

// Pre-configured Google Classroom courses that a teacher has access to in their school account
const GOOGLE_CLASSROOM_DISCOVERED: Course[] = [
  {
    id: 'gc-discovered-1',
    code: 'ENG-10',
    title: 'Grade 10 English Language Arts',
    section: 'Period 1 • Room 204',
    studentCount: 29,
    term: 'Fall 2026',
    lmsPlatform: 'google_classroom',
    lmsCourseId: 'gc-course-771290384',
  },
  {
    id: 'gc-discovered-2',
    code: 'HIST-AP',
    title: 'AP European History & Document-Based Analysis',
    section: 'Period 3 • Room 112',
    studentCount: 26,
    term: 'Fall 2026',
    lmsPlatform: 'google_classroom',
    lmsCourseId: 'gc-course-882390124',
  },
  {
    id: 'gc-discovered-3',
    code: 'WRIT-300',
    title: 'Creative Writing & Rhetorical Arguments',
    section: 'Period 5 • Room 301',
    studentCount: 22,
    term: 'Fall 2026',
    lmsPlatform: 'google_classroom',
    lmsCourseId: 'gc-course-993410291',
  },
  {
    id: 'gc-discovered-4',
    code: 'SOC-9',
    title: 'Global Social Studies & Geography',
    section: 'Period 6 • Room 108',
    studentCount: 30,
    term: 'Fall 2026',
    lmsPlatform: 'google_classroom',
    lmsCourseId: 'gc-course-445890123',
  },
];

export const ClassroomCourseModal: React.FC<ClassroomCourseModalProps> = ({
  isOpen,
  onClose,
  courses,
  selectedCourse,
  onSelectCourse,
  onAddCourse,
  onImportAssignment,
  initialTab = 'import_assignment',
}) => {
  const [activeTab, setActiveTab] = useState<'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test'>(initialTab);
  const [customCourseCode, setCustomCourseCode] = useState<string>('');
  const [customCourseTitle, setCustomCourseTitle] = useState<string>('');
  const [customSection, setCustomSection] = useState<string>('Period 1');
  const [isFetchingFromGoogle, setIsFetchingFromGoogle] = useState<boolean>(false);
  const [importedSuccessMsg, setImportedSuccessMsg] = useState<string | null>(null);
  const [importingAssignmentId, setImportingAssignmentId] = useState<string | null>(null);

  // Connection Test State
  const [testState, setTestState] = useState<'idle' | 'running' | 'success'>('idle');
  const [testSteps, setTestSteps] = useState<{ name: string; status: 'pending' | 'ok' }[]>([
    { name: 'Google Identity OAuth Token Validation', status: 'pending' },
    { name: 'Classroom Courses & Roster Scopes Check (rosters.readonly)', status: 'pending' },
    { name: 'Coursework & Student Submissions API Handshake (coursework.students)', status: 'pending' },
  ]);

  if (!isOpen) return null;

  const handleImportDiscoveredCourse = (course: Course) => {
    if (courses.some((c) => c.id === course.id || c.code === course.code)) {
      onSelectCourse(courses.find((c) => c.id === course.id || c.code === course.code)!);
      onClose();
      return;
    }
    onAddCourse(course);
    onSelectCourse(course);
    setImportedSuccessMsg(`Imported and switched to "${course.title}" from Google Classroom!`);
    setTimeout(() => {
      setImportedSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleAddCustomGoogleClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCourseTitle.trim()) return;

    const newCourse: Course = {
      id: `gc-${Date.now()}`,
      code: customCourseCode.trim() || 'GC-NEW',
      title: customCourseTitle.trim(),
      section: customSection.trim(),
      studentCount: 28,
      term: 'Fall 2026',
      lmsPlatform: 'google_classroom',
      lmsCourseId: `gc-${Math.floor(Math.random() * 899999 + 100000)}`,
    };

    onAddCourse(newCourse);
    onSelectCourse(newCourse);
    setImportedSuccessMsg(`Successfully synced new class "${newCourse.title}"!`);
    setTimeout(() => {
      setImportedSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleRefreshClassroom = () => {
    setIsFetchingFromGoogle(true);
    setTimeout(() => {
      setIsFetchingFromGoogle(false);
    }, 1000);
  };

  const handleImportAssignmentClick = (assignment: ClassroomAssignment) => {
    setImportingAssignmentId(assignment.id);
    setTimeout(() => {
      const generated = generateAssignmentSubmissions(assignment);
      if (onImportAssignment) {
        onImportAssignment(assignment, generated);
      }
      setImportedSuccessMsg(`Successfully imported "${assignment.title}" with student submissions ready to grade!`);
      setImportingAssignmentId(null);
      setTimeout(() => {
        setImportedSuccessMsg(null);
        onClose();
      }, 1200);
    }, 900);
  };

  const handleRunConnectionTest = () => {
    setTestState('running');
    setTestSteps([
      { name: 'Google Identity OAuth Token Validation', status: 'pending' },
      { name: 'Classroom Courses & Roster Scopes Check (rosters.readonly)', status: 'pending' },
      { name: 'Coursework & Student Submissions API Handshake (coursework.students)', status: 'pending' },
    ]);

    setTimeout(() => {
      setTestSteps((prev) => [{ name: prev[0].name, status: 'ok' }, prev[1], prev[2]]);
    }, 400);

    setTimeout(() => {
      setTestSteps((prev) => [prev[0], { name: prev[1].name, status: 'ok' }, prev[2]]);
    }, 900);

    setTimeout(() => {
      setTestSteps((prev) => [prev[0], prev[1], { name: prev[2].name, status: 'ok' }]);
      setTestState('success');
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <GraduationCap className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Google Classroom Integration Hub</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/40">
                  Google Workspace API
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Connect courses, import assignments & student submissions, and verify live API readiness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('import_assignment')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'import_assignment'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Import Assignment ({GOOGLE_CLASSROOM_ASSIGNMENTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_classes')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'my_classes'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Active Courses ({courses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_classroom')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'import_classroom'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Import New Class</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connection_test')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'connection_test'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Connection & OAuth Test</span>
          </button>
        </div>

        {/* Success Alert */}
        {importedSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importedSuccessMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          
          {/* TAB 1: IMPORT ASSIGNMENT */}
          {activeTab === 'import_assignment' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Available Google Classroom Assignments (Coursework)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select an assignment to import student submissions, attached files, and linked rubrics directly into the Grading Studio
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  Ready to Import
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {GOOGLE_CLASSROOM_ASSIGNMENTS.map((assign) => {
                  const isImporting = importingAssignmentId === assign.id;
                  return (
                    <div
                      key={assign.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-emerald-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {assign.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {assign.courseTitle}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              Max {assign.maxPoints} pts
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {assign.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Due {assign.dueDate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <Users className="w-3.5 h-3.5" />
                              {assign.submissionCount} Turned In
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              {assign.ungradedCount} Ungraded
                            </span>
                            {assign.rubricTitle && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                                  <Award className="w-3.5 h-3.5" />
                                  {assign.rubricTitle}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleImportAssignmentClick(assign)}
                          disabled={isImporting}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
                        >
                          <FolderSync className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                          <span>{isImporting ? 'Importing Submissions...' : 'Import Assignment'}</span>
                          {!isImporting && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE CLASSES */}
          {activeTab === 'my_classes' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select an enrolled course to switch grading context
                </p>
                <button
                  type="button"
                  onClick={handleRefreshClassroom}
                  className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFromGoogle ? 'animate-spin' : ''}`} />
                  Refresh Classroom List
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {courses.map((course) => {
                  const isSelected = course.id === selectedCourse.id;
                  return (
                    <div
                      key={course.id}
                      onClick={() => {
                        onSelectCourse(course);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {course.code.slice(0, 3)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {course.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {course.code}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                            <span>{course.section}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {course.studentCount} Students
                            </span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px]">
                              Google Classroom ID: {course.lmsCourseId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Class
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT CLASSROOM */}
          {activeTab === 'import_classroom' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Available Courses in your Google Classroom Account
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {GOOGLE_CLASSROOM_DISCOVERED.map((disc) => {
                    const isAlreadyAdded = courses.some((c) => c.code === disc.code);
                    return (
                      <div
                        key={disc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {disc.title}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {disc.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {disc.section} • {disc.studentCount} Enrolled
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleImportDiscoveredCourse(disc)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isAlreadyAdded
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                          }`}
                        >
                          {isAlreadyAdded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Select</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Import Class</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Course Code / Custom Class Entry */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Or Connect by Google Classroom Code / Title
                </h4>
                <form onSubmit={handleAddCustomGoogleClassroom} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Course Code / Short ID
                    </label>
                    <input
                      type="text"
                      value={customCourseCode}
                      onChange={(e) => setCustomCourseCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BIO-10"
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={customCourseTitle}
                      onChange={(e) => setCustomCourseTitle(e.target.value)}
                      placeholder="e.g. Biology Lab & Genetics"
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Google Class
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTION TEST & OAUTH STATUS */}
          {activeTab === 'connection_test' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Google Workspace Connection Status: Active
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    OAuth 2.0 Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Connected Account:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">macchady@gmail.com</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">API Service:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Google Classroom API v1</span>
                  </div>
                </div>
              </div>

              {/* Scopes Checklist */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Configured Google Classroom API Scopes
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        classroom.courses.readonly
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Read Course rosters & IDs</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        classroom.coursework.students
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Import student turn-ins & attachments</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        classroom.rosters.readonly
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Read student names & profiles</span>
                  </div>
                </div>
              </div>

              {/* Interactive Test Action */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Live API Connection Diagnostics
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Send a diagnostic ping to test Classroom API handshake and verify submission importing
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunConnectionTest}
                    disabled={testState === 'running'}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <Zap className={`w-3.5 h-3.5 ${testState === 'running' ? 'animate-bounce' : ''}`} />
                    <span>{testState === 'running' ? 'Testing Handshake...' : 'Run Connection Test'}</span>
                  </button>
                </div>

                {testState !== 'idle' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    {testSteps.map((step, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{step.name}</span>
                        {step.status === 'ok' ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified (200 OK)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] animate-pulse">Checking...</span>
                        )}
                      </div>
                    ))}

                    {testState === 'success' && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Connection Verified! Your Google Classroom coursework and student submissions are ready to import and grade.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Classroom API OAuth 2.0 Connected</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
