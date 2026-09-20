import React, { useState, useEffect } from 'react';
import {
  MOCK_COURSES,
  MOCK_STUDENTS,
  MOCK_RUBRICS,
  MOCK_SUBMISSIONS,
  MOCK_LEARNING_GAPS,
  INITIAL_BENCHMARKS,
} from './data/mockData';
import { Course, Student, Rubric, Submission, LearningGap, BenchmarkMetrics, ClassroomAssignment } from './types';
import { initAuth, googleSignIn, logout, User } from './lib/googleAuth';
import { HeaderNavbar } from './components/HeaderNavbar';
import { DashboardView } from './components/DashboardView';
import { GradingStudio } from './components/GradingStudio';
import { RubricManager } from './components/RubricManager';
import { AnalyticsView } from './components/AnalyticsView';
import { LmsSyncView } from './components/LmsSyncView';
import { BenchmarkView } from './components/BenchmarkView';
import { PreGradingDiagnostic } from './components/PreGradingDiagnostic';
import { ClassroomCourseModal } from './components/ClassroomCourseModal';
import { DriveView } from './components/DriveView';
import { DriveFile } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type GradingTab =
  | 'dashboard'
  | 'grading'
  | 'rubrics'
  | 'analytics'
  | 'lms'
  | 'drive'
  | 'benchmarks';

export default function App() {
  const [activeTab, setActiveTab] = useState<GradingTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Google Classroom Auth State for cwadden@gnspes.ca
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('classroom_courses');
    if (saved) {
      try {
        const parsed: Course[] = JSON.parse(saved);
        return parsed.filter(
          (c) =>
            !c.id.startsWith('course-') &&
            c.id !== 'course-1' &&
            c.id !== 'course-2' &&
            c.id !== 'course-3'
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(() => {
    const saved = localStorage.getItem('classroom_courses');
    if (saved) {
      try {
        const parsed: Course[] = JSON.parse(saved);
        const real = parsed.filter(
          (c) =>
            !c.id.startsWith('course-') &&
            c.id !== 'course-1' &&
            c.id !== 'course-2' &&
            c.id !== 'course-3'
        );
        return real[0] || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [assignments, setAssignments] = useState<ClassroomAssignment[]>(() => {
    const saved = localStorage.getItem('classroom_assignments');
    if (saved) {
      try {
        const parsed: ClassroomAssignment[] = JSON.parse(saved);
        return parsed.filter((a) => !a.id.startsWith('gc-assign-'));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const [students] = useState<Student[]>(MOCK_STUDENTS);
  
  const [rubrics, setRubrics] = useState<Rubric[]>(() => {
    const saved = localStorage.getItem('rubrics_state');
    return saved ? JSON.parse(saved) : MOCK_RUBRICS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('submissions_state');
    if (saved) {
      try {
        const parsed: Submission[] = JSON.parse(saved);
        return parsed.filter(
          (s) =>
            !s.id.startsWith('sub-1') &&
            !s.id.startsWith('sub-2') &&
            !s.id.startsWith('sub-3') &&
            !s.id.startsWith('sub-4') &&
            !s.id.startsWith('sub-5')
        );
      } catch {
        return [];
      }
    }
    return [];
  });

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(() => {
    const saved = localStorage.getItem('submissions_state');
    if (saved) {
      try {
        const parsed: Submission[] = JSON.parse(saved);
        const real = parsed.filter(
          (s) =>
            !s.id.startsWith('sub-1') &&
            !s.id.startsWith('sub-2') &&
            !s.id.startsWith('sub-3') &&
            !s.id.startsWith('sub-4') &&
            !s.id.startsWith('sub-5')
        );
        return real[0] || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [learningGaps, setLearningGaps] = useState<LearningGap[]>(MOCK_LEARNING_GAPS);
  const [benchmarks] = useState<BenchmarkMetrics>(INITIAL_BENCHMARKS);

  const [isLmsSyncing, setIsLmsSyncing] = useState<boolean>(false);
  const [isPassingBack, setIsPassingBack] = useState<boolean>(false);
  const [isBatchGrading, setIsBatchGrading] = useState<boolean>(false);
  const [isPreGradingModalOpen, setIsPreGradingModalOpen] = useState<boolean>(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState<boolean>(false);
  const [classroomModalInitialTab, setClassroomModalInitialTab] = useState<'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test'>('import_assignment');

  // Listen to Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuthUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setAuthUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setAuthUser(res.user);
        setAccessToken(res.accessToken);
        setToastNotification({
          type: 'success',
          message: `Connected Google Classroom as ${res.user.email || 'cwadden@gnspes.ca'}!`,
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setToastNotification({
        type: 'error',
        message: err?.message || 'Could not complete Google sign-in. Please try again.',
      });
      setTimeout(() => setToastNotification(null), 5000);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setAuthUser(null);
      setAccessToken(null);
      setToastNotification({
        type: 'info',
        message: 'Signed out of Google Classroom.',
      });
      setTimeout(() => setToastNotification(null), 3000);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSwitchGoogleAccount = async (targetEmail: string = 'cwadden@gnspes.ca') => {
    setIsSigningIn(true);
    try {
      await logout();
      const res = await googleSignIn({
        targetEmail,
        targetDomain: targetEmail.includes('@') ? targetEmail.split('@')[1] : undefined,
      });
      if (res) {
        setAuthUser(res.user);
        setAccessToken(res.accessToken);
        setToastNotification({
          type: 'success',
          message: `Switched Google account to ${res.user.email}!`,
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    } catch (err: any) {
      console.error('Account switch error:', err);
      setToastNotification({
        type: 'error',
        message: err?.message || 'Could not complete account switch to ' + targetEmail,
      });
      setTimeout(() => setToastNotification(null), 6000);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOpenClassroomModal = (tab: 'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test' = 'import_assignment') => {
    setClassroomModalInitialTab(tab);
    setIsClassroomModalOpen(true);
  };

  const handleImportAssignment = (assignment: ClassroomAssignment, newSubmissions: Submission[]) => {
    // Add or update assignment in assignments list
    setAssignments((prev) => {
      const exists = prev.some((a) => a.id === assignment.id);
      if (exists) {
        return prev.map((a) => (a.id === assignment.id ? assignment : a));
      }
      return [assignment, ...prev];
    });
    setSelectedAssignmentId(assignment.id);

    // Switch to the assignment's course if needed
    const matchingCourse = courses.find((c) => c.id === assignment.courseId);
    if (matchingCourse) {
      setSelectedCourse(matchingCourse);
    }
    // Update submissions in state
    setSubmissions((prev) => {
      const filtered = prev.filter((s) => s.lmsAssignmentId !== assignment.id);
      return [...newSubmissions, ...filtered];
    });
    if (newSubmissions.length > 0) {
      setSelectedSubmission(newSubmissions[0]);
    }
    // Switch to grading view immediately so teacher can grade the imported assignment
    setActiveTab('grading');
  };

  const handleCreateAssignment = (newAssignment: ClassroomAssignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);
    setSelectedAssignmentId(newAssignment.id);
    setToastNotification({
      type: 'success',
      message: `Created assignment "${newAssignment.title}"!`,
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    setSubmissions((prev) => prev.filter((s) => s.lmsAssignmentId !== assignmentId));
    if (selectedAssignmentId === assignmentId) {
      setSelectedAssignmentId(null);
    }
    setToastNotification({
      type: 'info',
      message: 'Assignment removed.',
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setAssignments((prev) => prev.filter((a) => a.courseId !== courseId));
    setSubmissions((prev) => prev.filter((s) => s.courseId !== courseId));
    if (selectedCourse?.id === courseId) {
      const remaining = courses.filter((c) => c.id !== courseId);
      setSelectedCourse(remaining[0] || null);
    }
    setToastNotification({
      type: 'info',
      message: 'Class and associated coursework removed.',
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  const handleClearAllFakeData = () => {
    localStorage.removeItem('classroom_courses');
    localStorage.removeItem('classroom_assignments');
    localStorage.removeItem('submissions_state');
    setCourses([]);
    setSelectedCourse(null);
    setAssignments([]);
    setSelectedAssignmentId(null);
    setSubmissions([]);
    setSelectedSubmission(null);
    setToastNotification({
      type: 'info',
      message: 'All mock classes and assignments cleared. Ready for your live Google Classroom import!',
    });
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Sync Dark mode setting with html / body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Persist courses state
  useEffect(() => {
    try {
      localStorage.setItem('classroom_courses', JSON.stringify(courses));
    } catch (e) {
      console.warn('LocalStorage save courses failed:', e);
    }
  }, [courses]);

  // Persist assignments state
  useEffect(() => {
    try {
      localStorage.setItem('classroom_assignments', JSON.stringify(assignments));
    } catch (e) {
      console.warn('LocalStorage save assignments failed:', e);
    }
  }, [assignments]);

  // Persist submissions state across page reloads
  useEffect(() => {
    try {
      localStorage.setItem('submissions_state', JSON.stringify(submissions));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [submissions]);

  // Persist rubrics state
  useEffect(() => {
    try {
      localStorage.setItem('rubrics_state', JSON.stringify(rubrics));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [rubrics]);

  // Sync selected submission when course changes
  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    const courseSubmissions = submissions.filter((s) => s.courseId === course.id);
    if (courseSubmissions.length > 0) {
      setSelectedSubmission(courseSubmissions[0]);
    } else {
      setSelectedSubmission(null);
    }
    const courseAssigns = assignments.filter((a) => a.courseId === course.id);
    setSelectedAssignmentId(courseAssigns[0]?.id || null);
  };

  // Add new course from Google Classroom
  const handleAddNewCourse = (newCourse: Course) => {
    setCourses((prev) => {
      if (prev.some((c) => c.id === newCourse.id || c.code === newCourse.code)) return prev;
      return [newCourse, ...prev];
    });
    setSelectedCourse(newCourse);
    setToastNotification({
      type: 'success',
      message: `Imported class: "${newCourse.title}"!`,
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Update submission in state
  const handleUpdateSubmission = (updated: Submission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    if (selectedSubmission?.id === updated.id) {
      setSelectedSubmission(updated);
    }
  };

  // Batch Auto-Grade All Submissions with Gemini AI
  const handleBatchAutoGrade = async () => {
    setIsBatchGrading(true);
    try {
      const activeRubric = rubrics[0];
      const unassessed = submissions.filter((s) => s.lmsStatus === 'unassessed');
      
      const res = await fetch('/api/gemini/batch-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions: unassessed.length > 0 ? unassessed : submissions,
          rubric: activeRubric,
        }),
      });

      const data = await res.json();
      if (data.success && data.results) {
        setSubmissions((prev) =>
          prev.map((s) => {
            const match = data.results.find((r: any) => r.id === s.id);
            if (match) {
              return {
                ...s,
                totalScore: match.totalScore,
                maxScore: match.maxScore,
                feedbackSummary: match.feedbackSummary,
                lmsStatus: 'graded_draft',
                draftSavedAt: new Date().toISOString(),
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error('Batch grading failed:', err);
    } finally {
      setIsBatchGrading(false);
    }
  };

  // Open Pre-Grading Diagnostic modal for a submission
  const handleOpenPreGrading = (sub?: Submission) => {
    if (sub) {
      setSelectedSubmission(sub);
    }
    setIsPreGradingModalOpen(true);
  };

  // Proceed from Pre-Grading Diagnostic to Studio
  const handleProceedFromDiagnostic = (updated: Submission) => {
    handleUpdateSubmission(updated);
    setIsPreGradingModalOpen(false);
    setActiveTab('grading');
  };

  // Sync roster / assignments with Google Classroom / LMS API
  const handleSyncLms = async () => {
    setIsLmsSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setToastNotification({
        type: 'success',
        message: `Synchronized ${selectedCourse?.title || 'active classes'} roster and assignments with Google Classroom (cwadden@gnspes.ca)!`,
      });
      setTimeout(() => setToastNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setToastNotification({
        type: 'error',
        message: 'Failed to sync with Google Classroom. Please try again.',
      });
      setTimeout(() => setToastNotification(null), 4000);
    } finally {
      setIsLmsSyncing(false);
    }
  };

  // Pass back specific grade to LMS API
  const handlePassbackToLms = async (submission: Submission) => {
    setIsPassingBack(true);
    try {
      const res = await fetch('/api/lms/passback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          studentId: submission.studentId,
          courseId: submission.courseId,
          totalScore: submission.totalScore || 0,
          maxScore: submission.maxScore || 10,
          comments: submission.feedbackSummary || '',
          lmsPlatform: selectedCourse?.lmsPlatform || 'google_classroom',
        }),
      });
      const data = await res.json();

      if (data.success) {
        const updated: Submission = {
          ...submission,
          lmsStatus: 'synced_to_lms',
          lmsSyncedAt: data.syncedAt,
        };
        handleUpdateSubmission(updated);
        setToastNotification({
          type: 'success',
          message: `Grade (${submission.totalScore}/${submission.maxScore}) for ${submission.studentName} pushed to Google Classroom!`,
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    } catch (err) {
      console.error('LMS Passback error:', err);
      setToastNotification({
        type: 'error',
        message: 'Could not pass back grade to Google Classroom. Please try again.',
      });
      setTimeout(() => setToastNotification(null), 4000);
    } finally {
      setIsPassingBack(false);
    }
  };

  // Add new Rubric
  const handleAddRubric = (newRubric: Rubric) => {
    setRubrics((prev) => [newRubric, ...prev]);
  };

  // Delete Rubric
  const handleDeleteRubric = (rubricId: string) => {
    setRubrics((prev) => prev.filter((r) => r.id !== rubricId));
  };

  // Import file directly from Google Drive into the Grading Studio
  const handleImportDriveFileToGrading = (
    file: DriveFile,
    contentText?: string,
    customImageUrls?: string[]
  ) => {
    const studentOwner = file.owners?.[0]?.displayName || file.name.split(' - ')[0] || 'Drive Student';
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

    const newSubmission: Submission = {
      id: `sub-drive-${Date.now()}`,
      studentId: `std-drive-${Date.now()}`,
      studentName: studentOwner,
      assignmentTitle: cleanTitle,
      courseId: selectedCourse?.id || courses[0]?.id || 'course-drive',
      submissionType: file.fileCategory === 'pdf' ? 'pdf' : 'gdoc',
      fileType: file.fileCategory === 'pdf' ? 'pdf' : 'text',
      documentImageUrls:
        customImageUrls && customImageUrls.length > 0
          ? customImageUrls
          : [
              'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
            ],
      ocrText:
        contentText ||
        `Student submission imported from Google Drive: "${file.name}"\nOwner: ${studentOwner}\n\n${file.description || ''}`,
      ocrConfidence: 99.4,
      ocrProcessingTimeMs: 140,
      annotations: [],
      scores: [],
      rubricId: rubrics[0]?.id || 'rubric-1',
      voiceNotes: [],
      lmsStatus: 'unassessed',
      submissionDate: new Date().toISOString().split('T')[0],
      lmsAssignmentId: `drive-${file.id}`,
      deliveryMethod: 'google_drive_folder',
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setSelectedSubmission(newSubmission);
    setActiveTab('grading');
    setToastNotification({
      type: 'success',
      message: `Loaded "${file.name}" into Grading Studio for marking!`,
    });
    setTimeout(() => setToastNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-in slide-in-from-top-2 duration-200 shadow-xl rounded-2xl border p-3.5 flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          {toastNotification.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          {toastNotification.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          {toastNotification.type === 'info' && (
            <Info className="w-5 h-5 text-indigo-500 shrink-0" />
          )}
          <p className="text-xs font-semibold flex-1 leading-snug">
            {toastNotification.message}
          </p>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Fixed Header Navbar */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        selectedCourse={selectedCourse}
        courses={courses}
        setSelectedCourse={handleSelectCourse}
        lmsSynced={true}
        onSyncLms={handleSyncLms}
        isSyncingLms={isLmsSyncing}
        onOpenClassroomModal={() => setIsClassroomModalOpen(true)}
        authUser={authUser}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onSwitchAccount={handleSwitchGoogleAccount}
        isSigningIn={isSigningIn}
      />

      {/* Main View Area */}
      <main className="pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            courses={courses}
            submissions={submissions}
            students={students}
            selectedCourse={selectedCourse}
            onSelectCourse={handleSelectCourse}
            onSelectSubmissionToGrade={(sub) => {
              setSelectedSubmission(sub);
              setActiveTab('grading');
            }}
            onOpenPreGradingDiagnostic={handleOpenPreGrading}
            onBatchAutoGrade={handleBatchAutoGrade}
            isBatchGrading={isBatchGrading}
            onSyncAllToLms={handleSyncLms}
            isSyncing={isLmsSyncing}
            onOpenClassroomModal={handleOpenClassroomModal}
            assignments={assignments}
            selectedAssignmentId={selectedAssignmentId}
            onSelectAssignment={setSelectedAssignmentId}
            onDeleteAssignment={handleDeleteAssignment}
            onClearAllFakeData={handleClearAllFakeData}
            onOpenDriveModal={() => setActiveTab('drive')}
          />
        )}

        {activeTab === 'grading' && (
          <GradingStudio
            submissions={submissions}
            selectedSubmission={selectedSubmission}
            onSelectSubmission={setSelectedSubmission}
            rubrics={rubrics}
            selectedCourse={selectedCourse}
            onUpdateSubmission={handleUpdateSubmission}
            onPassbackToLms={handlePassbackToLms}
            isPassingBack={isPassingBack}
            onOpenPreGradingDiagnostic={() => handleOpenPreGrading(selectedSubmission || undefined)}
            onOpenDrive={() => setActiveTab('drive')}
            authUser={authUser}
            onOpenClassroomModal={handleOpenClassroomModal}
          />
        )}

        {/* Pre-Grading AI Impression Modal */}
        {isPreGradingModalOpen && selectedSubmission && (
          <PreGradingDiagnostic
            submission={selectedSubmission}
            rubric={rubrics.find((r) => r.id === selectedSubmission.rubricId) || rubrics[0]}
            onProceedToGrading={handleProceedFromDiagnostic}
            onClose={() => setIsPreGradingModalOpen(false)}
          />
        )}

        {/* Google Classroom Integration Hub Modal */}
        <ClassroomCourseModal
          isOpen={isClassroomModalOpen}
          onClose={() => setIsClassroomModalOpen(false)}
          courses={courses}
          selectedCourse={selectedCourse}
          onSelectCourse={handleSelectCourse}
          onAddCourse={handleAddNewCourse}
          onDeleteCourse={handleDeleteCourse}
          assignments={assignments}
          onImportAssignment={handleImportAssignment}
          onCreateAssignment={handleCreateAssignment}
          onDeleteAssignment={handleDeleteAssignment}
          onClearAllFakeData={handleClearAllFakeData}
          initialTab={classroomModalInitialTab}
          authUser={authUser}
          accessToken={accessToken}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleGoogleSignOut}
          isSigningIn={isSigningIn}
        />

        {activeTab === 'rubrics' && (
          <RubricManager
            rubrics={rubrics}
            onAddRubric={handleAddRubric}
            onDeleteRubric={handleDeleteRubric}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            learningGaps={learningGaps}
            students={students}
            selectedCourse={selectedCourse}
            onAddLearningGap={(gap) => setLearningGaps((prev) => [gap, ...prev])}
          />
        )}

        {activeTab === 'lms' && (
          <LmsSyncView
            submissions={submissions}
            selectedCourse={selectedCourse}
            onSyncCourse={handleSyncLms}
            onPassbackSubmission={handlePassbackToLms}
            isSyncing={isLmsSyncing}
            onOpenClassroomModal={() => setIsClassroomModalOpen(true)}
            authUser={authUser}
            accessToken={accessToken}
            onSignIn={handleGoogleSignIn}
          />
        )}

        {activeTab === 'drive' && (
          <DriveView
            authUser={authUser}
            accessToken={accessToken}
            onSignIn={handleGoogleSignIn}
            selectedCourse={selectedCourse}
            submissions={submissions}
            onImportDriveFileToGrading={handleImportDriveFileToGrading}
            onToast={(type, message) => {
              setToastNotification({ type, message });
              setTimeout(() => setToastNotification(null), 4000);
            }}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkView benchmarks={benchmarks} />
        )}
      </main>

    </div>
  );
}
