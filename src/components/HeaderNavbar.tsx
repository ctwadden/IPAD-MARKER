import React from 'react';
import {
  GradingTab,
} from '../App';
import {
  FileText,
  Sparkles,
  BookOpen,
  BarChart3,
  RefreshCw,
  Activity,
  Sun,
  Moon,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Course } from '../types';

interface HeaderNavbarProps {
  activeTab: GradingTab;
  setActiveTab: (tab: GradingTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  selectedCourse: Course;
  courses: Course[];
  setSelectedCourse: (course: Course) => void;
  lmsSynced: boolean;
  onSyncLms: () => void;
  isSyncingLms: boolean;
  onOpenClassroomModal?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  selectedCourse,
  courses,
  setSelectedCourse,
  lmsSynced,
  onSyncLms,
  isSyncingLms,
  onOpenClassroomModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  Grade Assessment <span className="text-indigo-600 dark:text-indigo-400">Tool</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Google Classroom Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                All-in-One AI Rubric, Apple Pencil & Audio Grading Suite
              </p>
            </div>
          </div>

          {/* Course Switcher Dropdown & LMS Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                  Active Class
                </span>
                <select
                  value={selectedCourse.id}
                  onChange={(e) => {
                    const found = courses.find((c) => c.id === e.target.value);
                    if (found) setSelectedCourse(found);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer mt-0.5"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id} className="dark:bg-slate-800">
                      {course.code} — {course.title} ({course.section})
                    </option>
                  ))}
                </select>
              </div>

              {onOpenClassroomModal && (
                <button
                  type="button"
                  onClick={onOpenClassroomModal}
                  className="ml-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold transition-colors whitespace-nowrap"
                  title="Open Google Classroom Class Selector & Importer"
                >
                  Switch / Import
                </button>
              )}
            </div>

            {/* Google Classroom Status Badge */}
            <button
              onClick={onSyncLms}
              disabled={isSyncingLms}
              title="Click to sync roster & assignments with Google Classroom API"
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLms ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">Google Classroom</span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Connected
              </span>
            </button>
          </div>

          {/* Right Utilities (Dark Mode Toggle & Quick Actions) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
              title="Toggle Dark Mode (Reduce eye strain during long grading sessions)"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>

        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('grading')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'grading'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Grading Studio (OCR & Pencil)
          </button>

          <button
            onClick={() => setActiveTab('rubrics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'rubrics'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Rubrics & AI Generator
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Learning Gaps & Interventions
          </button>

          <button
            onClick={() => setActiveTab('lms')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'lms'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            LMS API Sync
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'benchmarks'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-teal-500" />
            Benchmarks & Diagnostics
          </button>
        </nav>
      </div>
    </header>
  );
};
