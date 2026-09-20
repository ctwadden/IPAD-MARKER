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
import { HeaderNavbar } from './components/HeaderNavbar';
import { DashboardView } from './components/DashboardView';
import { GradingStudio } from './components/GradingStudio';
import { RubricManager } from './components/RubricManager';
import { AnalyticsView } from './components/AnalyticsView';
import { LmsSyncView } from './components/LmsSyncView';
import { BenchmarkView } from './components/BenchmarkView';
import { PreGradingDiagnostic } from './components/PreGradingDiagnostic';
import { ClassroomCourseModal } from './components/ClassroomCourseModal';

export type GradingTab =
  | 'dashboard'
  | 'grading'
  | 'rubrics'
  | 'analytics'
  | 'lms'
  | 'benchmarks';

export default function App() {
  const [activeTab, setActiveTab] = useState<GradingTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('classroom_courses');
    return saved ? JSON.parse(saved) : MOCK_COURSES;
  });
  const [selectedCourse, setSelectedCourse] = useState<Course>(() => courses[0] || MOCK_COURSES[0]);
  const [students] = useState<Student[]>(MOCK_STUDENTS);
  
  const [rubrics, setRubrics] = useState<Rubric[]>(() => {
    const saved = localStorage.getItem('rubrics_state');
    return saved ? JSON.parse(saved) : MOCK_RUBRICS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('submissions_state');
    return saved ? JSON.parse(saved) : MOCK_SUBMISSIONS;
  });

  const [selectedSubmission, setSelectedSubmission] = useState<Submission>(() => {
    return submissions[0] || MOCK_SUBMISSIONS[0];
  });

  const [learningGaps, setLearningGaps] = useState<LearningGap[]>(MOCK_LEARNING_GAPS);
  const [benchmarks] = useState<BenchmarkMetrics>(INITIAL_BENCHMARKS);

  const [isLmsSyncing, setIsLmsSyncing] = useState<boolean>(false);
  const [isPassingBack, setIsPassingBack] = useState<boolean>(false);
  const [isBatchGrading, setIsBatchGrading] = useState<boolean>(false);
  const [isPreGradingModalOpen, setIsPreGradingModalOpen] = useState<boolean>(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState<boolean>(false);
  const [classroomModalInitialTab, setClassroomModalInitialTab] = useState<'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test'>('import_assignment');

  const handleOpenClassroomModal = (tab: 'my_classes' | 'import_assignment' | 'import_classroom' | 'connection_test' = 'import_assignment') => {
    setClassroomModalInitialTab(tab);
    setIsClassroomModalOpen(true);
  };

  const handleImportAssignment = (assignment: ClassroomAssignment, newSubmissions: Submission[]) => {
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
    }
  };

  // Add new course from Google Classroom
  const handleAddNewCourse = (newCourse: Course) => {
    setCourses((prev) => {
      if (prev.some((c) => c.id === newCourse.id || c.code === newCourse.code)) return prev;
      return [newCourse, ...prev];
    });
  };

  // Update submission in state
  const handleUpdateSubmission = (updated: Submission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    if (selectedSubmission.id === updated.id) {
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
      await new Promise((r) => setTimeout(r, 1200));
      alert(`Successfully synchronized ${selectedCourse.title} roster and assignments with ${selectedCourse.lmsPlatform.toUpperCase()} API!`);
    } catch (err) {
      console.error(err);
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
          lmsPlatform: selectedCourse.lmsPlatform,
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
      }
    } catch (err) {
      console.error('LMS Passback error:', err);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
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
      />

      {/* Main View Area */}
      <main className="pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            submissions={submissions}
            students={students}
            selectedCourse={selectedCourse}
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
            onOpenPreGradingDiagnostic={() => handleOpenPreGrading(selectedSubmission)}
          />
        )}

        {/* Pre-Grading AI Impression Modal */}
        {isPreGradingModalOpen && (
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
          onImportAssignment={handleImportAssignment}
          initialTab={classroomModalInitialTab}
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
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkView benchmarks={benchmarks} />
        )}
      </main>

    </div>
  );
}
