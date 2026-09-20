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
import { User } from '../lib/googleAuth';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderNavbarProps {
  activeTab: GradingTab;
  setActiveTab: (tab: GradingTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  selectedCourse: Course | null;
  courses: Course[];
  setSelectedCourse: (course: Course) => void;
  lmsSynced: boolean;
  onSyncLms: () => void;
  isSyncingLms: boolean;
  onOpenClassroomModal?: () => void;
  authUser?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSwitchAccount?: (targetEmail: string) => void;
  isSigningIn?: boolean;
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
  authUser,
  onSignIn,
  onSignOut,
  onSwitchAccount,
  isSigningIn,
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
                {courses.length > 0 ? (
                  <select
                    value={selectedCourse?.id || ''}
                    onChange={(e) => {
                      const found = courses.find((c) => c.id === e.target.value);
                      if (found) setSelectedCourse(found);
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer mt-0.5"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="dark:bg-slate-800">
                        {course.code} — {course.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenClassroomModal}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 text-left"
                  >
                    + Add Class
                  </button>
                )}
              </div>

              {onOpenClassroomModal && (
                <button
                  type="button"
                  onClick={onOpenClassroomModal}
                  className="ml-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold transition-colors whitespace-nowrap"
                  title="Open Google Classroom Class Selector & Importer"
                >
                  Manage Classes
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

          {/* Right Utilities (Google Classroom Account & Dark Mode Toggle) */}
          <div className="flex items-center gap-2">
            {authUser ? (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'Google Classroom Teacher'}
                    className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {authUser.email ? authUser.email[0].toUpperCase() : 'C'}
                  </div>
                )}
                <div className="flex flex-col text-left leading-tight hidden md:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
                      {authUser.displayName || 'Chad Wadden'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Classroom Connected" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]">
                    {authUser.email || 'cwadden@gnspes.ca'}
                  </span>
                </div>

                {authUser.email && !authUser.email.endsWith('@gnspes.ca') && (
                  <button
                    type="button"
                    onClick={() => (onSwitchAccount ? onSwitchAccount('cwadden@gnspes.ca') : onSignIn?.())}
                    title="Switch to cwadden@gnspes.ca (GNSPES School Domain)"
                    className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-300 dark:border-amber-800 transition-colors hidden sm:block"
                  >
                    Switch GNSPES
                  </button>
                )}

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign out of Google Classroom"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                title="Connect Google Classroom with cwadden@gnspes.ca"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 shadow-sm transition-all hover:shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Connect cwadden@gnspes.ca'}</span>
              </button>
            )}

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
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'drive'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="currentColor">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            Google Drive
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
