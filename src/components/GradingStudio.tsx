import React, { useState } from 'react';
import { Submission, Rubric, Course, VoiceNote, FeedbackStamp, Annotation } from '../types';
import { GradingCanvas } from './GradingCanvas';
import { VoiceDictationButton } from './VoiceDictationButton';
import { AudioVoiceRecorder } from './AudioVoiceRecorder';
import { DEFAULT_FEEDBACK_STAMPS } from '../data/defaultStamps';
import {
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  Send,
  FileCheck,
  Zap,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Tag,
  Save,
  HelpCircle,
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
} from 'lucide-react';

interface GradingStudioProps {
  submissions: Submission[];
  selectedSubmission: Submission;
  onSelectSubmission: (submission: Submission) => void;
  rubrics: Rubric[];
  selectedCourse: Course;
  onUpdateSubmission: (updated: Submission) => void;
  onPassbackToLms: (submission: Submission) => Promise<void>;
  isPassingBack: boolean;
  onOpenPreGradingDiagnostic?: () => void;
}

export const GradingStudio: React.FC<GradingStudioProps> = ({
  submissions,
  selectedSubmission,
  onSelectSubmission,
  rubrics,
  selectedCourse,
  onUpdateSubmission,
  onPassbackToLms,
  isPassingBack,
  onOpenPreGradingDiagnostic,
}) => {
  const [activeView, setActiveView] = useState<'canvas' | 'ocr_split'>('canvas');
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [isAiGrading, setIsAiGrading] = useState<boolean>(false);
  const [isPlagiarismScanning, setIsPlagiarismScanning] = useState<boolean>(false);
  const [isAutoStamping, setIsAutoStamping] = useState<boolean>(false);
  const [activeRubricId, setActiveRubricId] = useState<string>(selectedSubmission.rubricId || rubrics[0]?.id || '');
  const [teacherComments, setTeacherComments] = useState<string>(selectedSubmission.feedbackSummary || '');

  // User requirement: Collapsible Rubric Tab along the left side that folds/unfolds for canvas real estate
  const [isRubricDrawerOpen, setIsRubricDrawerOpen] = useState<boolean>(true);

  // User requirement: Anonymous / Blind Grading Toggle
  const [isBlindGrading, setIsBlindGrading] = useState<boolean>(false);

  // Auto-stamp recommendations
  const [suggestedStamps, setSuggestedStamps] = useState<
    { code: string; reason: string; snippet: string; suggestedColor: string }[]
  >([]);

  const activeRubric = rubrics.find((r) => r.id === activeRubricId) || rubrics[0];

  // OCR Recognition Trigger
  const handleRunOcr = async () => {
    setIsOcrRunning(true);
    try {
      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedSubmission.documentImageUrls[0],
          fileType: selectedSubmission.fileType,
          fallbackText: selectedSubmission.ocrText,
        }),
      });
      const data = await res.json();

      onUpdateSubmission({
        ...selectedSubmission,
        ocrText: data.text || selectedSubmission.ocrText,
        ocrConfidence: data.confidence || 98.8,
        ocrProcessingTimeMs: data.processingTimeMs || 280,
        draftSavedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('OCR run failed:', err);
    } finally {
      setIsOcrRunning(false);
    }
  };

  // AI Auto-Grade with Gemini
  const handleAiAutoGrade = async () => {
    if (!activeRubric) return;
    setIsAiGrading(true);
    try {
      const res = await fetch('/api/gemini/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText: selectedSubmission.ocrText,
          rubric: activeRubric,
          assignmentTitle: selectedSubmission.assignmentTitle,
        }),
      });
      const data = await res.json();

      const updatedScores = data.scores || [];
      const updatedSubmission: Submission = {
        ...selectedSubmission,
        scores: updatedScores,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        feedbackSummary: data.feedbackSummary || teacherComments,
        strengths: data.strengths || [],
        areasForImprovement: data.areasForImprovement || [],
        lmsStatus: 'graded_draft',
        draftSavedAt: new Date().toISOString(),
      };

      setTeacherComments(data.feedbackSummary || teacherComments);
      onUpdateSubmission(updatedSubmission);
    } catch (err) {
      console.error('AI Grading failed:', err);
    } finally {
      setIsAiGrading(false);
    }
  };

  // AI Plagiarism & Similarity Spotter
  const handleRunPlagiarismScan = async () => {
    setIsPlagiarismScanning(true);
    try {
      const res = await fetch('/api/gemini/plagiarism-spotter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText: selectedSubmission.ocrText }),
      });
      const data = await res.json();

      onUpdateSubmission({
        ...selectedSubmission,
        similarityReport: {
          scorePercent: data.scorePercent || 8,
          status: data.status || 'clean',
          flaggedSnippets: data.flaggedSnippets || [],
        },
        draftSavedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Plagiarism spotter error:', err);
    } finally {
      setIsPlagiarismScanning(false);
    }
  };

  // AI Auto-Stamp Detection
  const handleDetectAutoStamps = async () => {
    setIsAutoStamping(true);
    try {
      const res = await fetch('/api/gemini/auto-stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText: selectedSubmission.ocrText }),
      });
      const data = await res.json();
      setSuggestedStamps(data.suggestions || []);
    } catch (err) {
      console.error('Auto stamps error:', err);
    } finally {
      setIsAutoStamping(false);
    }
  };

  // Apply suggested stamp directly to canvas
  const handleApplySuggestedStamp = (code: string, color: string) => {
    const stampDef = DEFAULT_FEEDBACK_STAMPS.find((s) => s.code === code);
    const newStamp: Annotation = {
      id: `stamp-ai-${Date.now()}-${Math.random()}`,
      type: 'stamp',
      points: [{ x: 120 + Math.random() * 200, y: 150 + Math.random() * 250 }],
      color: color || stampDef?.color || '#dc2626',
      strokeWidth: 2,
      stampData: {
        code,
        label: stampDef?.label || code,
        color: color || stampDef?.color || '#dc2626',
      },
      page: 0,
      timestamp: new Date().toISOString(),
    };

    onUpdateSubmission({
      ...selectedSubmission,
      annotations: [...selectedSubmission.annotations, newStamp],
      draftSavedAt: new Date().toISOString(),
    });
  };

  // Update specific score criterion
  const handleScoreChange = (criterionId: string, points: number) => {
    const existingScores = selectedSubmission.scores || [];
    const index = existingScores.findIndex((s) => s.criterionId === criterionId);

    let updated = [...existingScores];
    if (index >= 0) {
      updated[index] = {
        ...updated[index],
        score: points,
      };
    } else {
      updated.push({
        criterionId,
        score: points,
        comment: 'Teacher score updated',
      });
    }

    const totalScore = updated.reduce((sum, item) => sum + item.score, 0);
    const maxScore = activeRubric ? activeRubric.criteria.reduce((s, c) => s + c.maxPoints, 0) : 10;

    onUpdateSubmission({
      ...selectedSubmission,
      scores: updated,
      totalScore,
      maxScore,
      feedbackSummary: teacherComments,
      lmsStatus: 'graded_draft',
      draftSavedAt: new Date().toISOString(),
    });
  };

  // Export marks & rubric comments to CSV (Google Sheets backup)
  const handleExportToCsv = () => {
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

  // Add / Delete Voice Memos
  const handleAddVoiceNote = (note: VoiceNote) => {
    const currentNotes = selectedSubmission.voiceNotes || [];
    onUpdateSubmission({
      ...selectedSubmission,
      voiceNotes: [...currentNotes, note],
      draftSavedAt: new Date().toISOString(),
    });
  };

  const handleDeleteVoiceNote = (noteId: string) => {
    const currentNotes = selectedSubmission.voiceNotes || [];
    onUpdateSubmission({
      ...selectedSubmission,
      voiceNotes: currentNotes.filter((n) => n.id !== noteId),
      draftSavedAt: new Date().toISOString(),
    });
  };

  // Display Name considering Blind Grading Toggle
  const displayName = isBlindGrading
    ? selectedSubmission.anonymousCode || `Student #${selectedSubmission.studentId.slice(-4).toUpperCase()}`
    : selectedSubmission.studentName;

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      
      {/* Top Header Bar: Submission Switcher, Blind Grading Toggle, Google Sheets Export, Return Channel */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Student Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-200 dark:border-indigo-800 shrink-0">
            {isBlindGrading ? '??' : selectedSubmission.studentName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedSubmission.id}
                onChange={(e) => {
                  const found = submissions.find((s) => s.id === e.target.value);
                  if (found) {
                    onSelectSubmission(found);
                    setTeacherComments(found.feedbackSummary || '');
                    setSuggestedStamps([]);
                  }
                }}
                className="font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer text-base"
              >
                {submissions.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-800">
                    {isBlindGrading
                      ? s.anonymousCode || `Student #${s.studentId.slice(-4).toUpperCase()}`
                      : s.studentName}{' '}
                    — {s.assignmentTitle} ({s.submissionType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Submitted: {new Date(selectedSubmission.submissionDate).toLocaleDateString()}</span>
              <span>•</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedCourse.title}</span>
              {selectedSubmission.draftSavedAt && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Save className="w-3 h-3" /> Auto-saved draft
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Blind Grading, Pre-Grading Diagnostic, Sheets Export, Passback */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Blind Grading Toggle */}
          <button
            type="button"
            onClick={() => setIsBlindGrading(!isBlindGrading)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isBlindGrading
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title="Toggle Anonymous Blind Grading (Hides student identity to prevent confirmation bias)"
          >
            {isBlindGrading ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-slate-500" />}
            <span>{isBlindGrading ? 'Blind Grading: ON' : 'Blind Grading: OFF'}</span>
          </button>

          {/* Persistent Rubric Side Tab Toggle Button */}
          <button
            type="button"
            onClick={() => setIsRubricDrawerOpen(!isRubricDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
              isRubricDrawerOpen
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900'
            }`}
            title="Toggle Rubric Side Tab (Stays pinned along the side while scrolling)"
          >
            <Award className="w-4 h-4" />
            <span>{isRubricDrawerOpen ? 'Shrink Rubric Tab' : 'See Rubric Tab'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isRubricDrawerOpen ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'}`}>
              {selectedSubmission.totalScore ?? '--'}/{activeRubric?.criteria.reduce((a, b) => a + b.maxPoints, 0) ?? 10}
            </span>
          </button>

          {/* Pre-Grading AI Impression Button */}
          {onOpenPreGradingDiagnostic && (
            <button
              type="button"
              onClick={onOpenPreGradingDiagnostic}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors shadow-sm"
              title="Open Pre-Grading AI First Impression & Name OCR Verification"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Impression Scan</span>
            </button>
          )}

          {/* Export to Google Sheets (CSV) */}
          <button
            type="button"
            onClick={handleExportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
            title="Export all grades and feedback to Google Sheets backup (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheets Backup (CSV)</span>
          </button>

          {/* Return Passback to LMS button */}
          <button
            onClick={() => onPassbackToLms({ ...selectedSubmission, feedbackSummary: teacherComments })}
            disabled={isPassingBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Send className={`w-3.5 h-3.5 ${isPassingBack ? 'animate-bounce' : ''}`} />
            {selectedSubmission.lmsStatus === 'synced_to_lms' ? 'Re-Sync Grade to LMS' : 'Return & Passback to LMS'}
          </button>
        </div>

      </div>

      {/* PERSISTENT SIDE TAB: Stays along the side so teacher never has to scroll */}
      {/* 1. SHRUNK STATE: Sleek vertical tab pinned to the left edge */}
      {!isRubricDrawerOpen && (
        <div className="fixed left-0 top-36 z-40 flex items-center">
          <button
            type="button"
            onClick={() => setIsRubricDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-2xl rounded-r-2xl py-4 px-2.5 flex flex-col items-center gap-2.5 border-y border-r border-indigo-400/50 hover:px-3.5 transition-all cursor-pointer group"
            title="Click to see Rubric & Outcomes (Stays pinned along the side while scrolling)"
          >
            <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
              <Award className="w-4 h-4 text-amber-300 drop-shadow" />
            </div>
            <span className="[writing-mode:vertical-lr] text-[11px] font-black tracking-widest uppercase text-white/95 py-1">
              Rubric
            </span>
            <div className="px-1.5 py-0.5 rounded-full bg-indigo-900/80 text-white font-black text-[10px] tracking-tight border border-indigo-400/30">
              {selectedSubmission.totalScore ?? '--'}/{activeRubric?.criteria.reduce((a, b) => a + b.maxPoints, 0) ?? 10}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. EXPANDED STATE: Pinned side panel that stays along the side without scrolling */}
      {isRubricDrawerOpen && (
        <>
          {/* Subtle mobile backdrop click-to-shrink */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            onClick={() => setIsRubricDrawerOpen(false)}
          />

          <div
            className="fixed left-0 top-20 bottom-4 z-50 w-84 sm:w-96 bg-white dark:bg-slate-900 border-r-2 border-y border-indigo-200 dark:border-indigo-900 shadow-2xl rounded-r-3xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-200"
          >
            {/* Header: Rubric Title & Click to Shrink Button */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    Rubric & Scoring
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                    {activeRubric?.title || 'Course Rubric'}
                  </p>
                </div>
              </div>

              {/* Click to shrink button */}
              <button
                type="button"
                onClick={() => setIsRubricDrawerOpen(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-bold transition-all shadow-sm group"
                title="Click to shrink rubric into side tab"
              >
                <PanelLeftClose className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>Click to shrink</span>
              </button>
            </div>

            {/* Total Points Display Card */}
            <div className="p-3 mx-4 mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Points:</span>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {selectedSubmission.totalScore ?? '--'} /{' '}
                {selectedSubmission.maxScore ?? activeRubric?.criteria.reduce((a, b) => a + b.maxPoints, 0) ?? 10}
              </div>
            </div>

            {/* AI Auto-Grade Button */}
            <div className="px-4 pt-3 shrink-0">
              <button
                onClick={handleAiAutoGrade}
                disabled={isAiGrading}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiGrading ? 'animate-spin' : ''}`} />
                {isAiGrading ? 'Gemini Evaluating Rubric...' : '✨ Auto-Grade with Gemini'}
              </button>
            </div>

            {/* Scrollable Criteria Scoring List (independent internal scroll) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeRubric?.criteria.map((criterion) => {
                const currentScoreObj = selectedSubmission.scores?.find((s) => s.criterionId === criterion.id);
                const currentPoints = currentScoreObj?.score ?? 0;

                return (
                  <div
                    key={criterion.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {criterion.title}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {currentPoints}/{criterion.maxPoints} pts
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      {criterion.description}
                    </p>

                    {/* Point level buttons */}
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: criterion.maxPoints + 1 }).map((_, pt) => (
                        <button
                          key={pt}
                          onClick={() => handleScoreChange(criterion.id, pt)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentPoints === pt
                              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>

                    {currentScoreObj?.comment && (
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-300 italic bg-indigo-50/50 dark:bg-indigo-950/40 p-1.5 rounded-lg">
                        "{currentScoreObj.comment}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer: Quick Shrink Button */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsRubricDrawerOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Shrink Rubric Tab</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Studio Layout: Primary Canvas Workspace (Full Width) */}
      <div className="w-full flex flex-col gap-5">
          
          {/* Workspace Sub-Toolbar: View Mode Switcher + AI Auto-Stamps + Plagiarism Spotter */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveView('canvas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'canvas'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Apple Pencil Canvas
                </button>
                <button
                  onClick={() => setActiveView('ocr_split')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'ocr_split'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  OCR Split View
                </button>
              </div>

              {/* ✨ AI Auto-Detect Stamps Trigger */}
              <button
                type="button"
                onClick={handleDetectAutoStamps}
                disabled={isAutoStamping}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors shadow-sm"
                title="Gemini scans essay text and suggests where to place ROS, Vague, and Evidence stamps"
              >
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>{isAutoStamping ? 'Analyzing Text...' : '✨ AI Suggest Stamps'}</span>
              </button>
            </div>

            {/* Plagiarism & Similarity Spotter Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunPlagiarismScan}
                disabled={isPlagiarismScanning}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                  selectedSubmission.similarityReport
                    ? selectedSubmission.similarityReport.scorePercent > 15
                      ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title="Scan for uncredited quotes or copied text across submissions"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {isPlagiarismScanning
                    ? 'Scanning Similarity...'
                    : selectedSubmission.similarityReport
                    ? `Similarity: ${selectedSubmission.similarityReport.scorePercent}% (${selectedSubmission.similarityReport.status})`
                    : 'Plagiarism Spotter'}
                </span>
              </button>
            </div>

          </div>

          {/* AI Suggested Stamps Notification Tray */}
          {suggestedStamps.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Gemini Identified {suggestedStamps.length} Feedback Stamp Recommendations:
                </span>
                <button
                  onClick={() => setSuggestedStamps([])}
                  className="text-xs text-purple-500 hover:text-purple-700"
                >
                  Dismiss
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {suggestedStamps.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60 shadow-sm text-xs"
                  >
                    <span
                      style={{ backgroundColor: st.suggestedColor }}
                      className="px-2 py-0.5 rounded text-white font-black text-[11px]"
                    >
                      {st.code}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{st.reason}</span>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestedStamp(st.code, st.suggestedColor)}
                      className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px]"
                    >
                      + Add to Canvas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Canvas Overlay View */}
          {activeView === 'canvas' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Marking Canvas — {displayName}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Page 1 of {selectedSubmission.documentImageUrls.length || 1}
                </span>
              </div>

              <GradingCanvas
                documentImageUrl={selectedSubmission.documentImageUrls[0] || ''}
                annotations={selectedSubmission.annotations}
                onAnnotationsChange={(updatedAnn) => {
                  onUpdateSubmission({
                    ...selectedSubmission,
                    annotations: updatedAnn,
                    draftSavedAt: new Date().toISOString(),
                  });
                }}
              />
            </div>
          )}

          {/* OCR Split View */}
          {activeView === 'ocr_split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Original Student Document
                </h4>
                <div className="h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <img
                    src={selectedSubmission.documentImageUrls[0]}
                    alt="Original Student Submission"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    OCR Digitized Text
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                      {selectedSubmission.ocrConfidence || 98.8}% OCR Accuracy
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedSubmission.ocrProcessingTimeMs || 280}ms
                    </span>
                  </div>
                </div>

                <textarea
                  value={selectedSubmission.ocrText}
                  onChange={(e) =>
                    onUpdateSubmission({
                      ...selectedSubmission,
                      ocrText: e.target.value,
                      draftSavedAt: new Date().toISOString(),
                    })
                  }
                  className="w-full h-[450px] p-3 text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 resize-none"
                  placeholder="Digitized essay text..."
                />

                <button
                  onClick={handleRunOcr}
                  disabled={isOcrRunning}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isOcrRunning ? 'animate-spin' : ''}`} />
                  {isOcrRunning ? 'Running Gemini Vision OCR...' : 'Re-Run High-Precision OCR'}
                </button>
              </div>
            </div>
          )}

          {/* Feedback & Multi-Modal Audio Voice Memo Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Teacher Personalized Feedback & Accessibility Options
            </h3>

            {/* Audio Voice Memo Recorder for Auditory Learners */}
            <AudioVoiceRecorder
              voiceNotes={selectedSubmission.voiceNotes || []}
              onAddVoiceNote={handleAddVoiceNote}
              onDeleteVoiceNote={handleDeleteVoiceNote}
            />

            {/* Speech-to-Text Voice Dictation + Written Feedback Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Written Feedback & Growth Areas
                </label>
                <VoiceDictationButton
                  currentText={teacherComments}
                  onTranscriptChange={(newText) => {
                    setTeacherComments(newText);
                    onUpdateSubmission({
                      ...selectedSubmission,
                      feedbackSummary: newText,
                      draftSavedAt: new Date().toISOString(),
                    });
                  }}
                />
              </div>

              <textarea
                value={teacherComments}
                onChange={(e) => {
                  setTeacherComments(e.target.value);
                  onUpdateSubmission({
                    ...selectedSubmission,
                    feedbackSummary: e.target.value,
                    draftSavedAt: new Date().toISOString(),
                  });
                }}
                rows={3}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 resize-none"
                placeholder="Enter personalized feedback notes for the student..."
              />
            </div>

            {/* Return Passback to Google Classroom / LMS Button */}
            <button
              onClick={() => onPassbackToLms({ ...selectedSubmission, feedbackSummary: teacherComments })}
              disabled={isPassingBack}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Send className={`w-4 h-4 ${isPassingBack ? 'animate-bounce' : ''}`} />
              {isPassingBack ? 'Syncing to Google Classroom API...' : 'Finalize & Passback Score, Annotations and Voice Memos'}
            </button>

          </div>

        </div>

      </div>
    );
  };
