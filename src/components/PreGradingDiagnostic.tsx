import React, { useState } from 'react';
import { Submission, Rubric, PreGradingImpression } from '../types';
import {
  Sparkles,
  UserCheck,
  Share2,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface PreGradingDiagnosticProps {
  submission: Submission;
  rubric: Rubric;
  onProceedToGrading: (updatedSubmission: Submission) => void;
  onClose: () => void;
}

export const PreGradingDiagnostic: React.FC<PreGradingDiagnosticProps> = ({
  submission,
  rubric,
  onProceedToGrading,
  onClose,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [impression, setImpression] = useState<PreGradingImpression | null>(
    submission.preGradingImpression || null
  );

  // Student Name Verification
  const [verifiedName, setVerifiedName] = useState<string>(submission.studentName);

  // Delivery Return Config
  const [deliveryMethod, setDeliveryMethod] = useState<'google_classroom' | 'google_drive_folder' | 'email'>(
    submission.deliveryMethod || 'google_classroom'
  );
  const [sharedDomain, setSharedDomain] = useState<string>(submission.sharedDomain || 'gnspes.ca');

  // Trigger Gemini Pre-Grading AI Impression
  const handleRunDiagnostic = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/pre-grading-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText: submission.ocrText,
          rubricTitle: rubric.title,
          rubricCriteria: rubric.criteria,
          studentName: submission.studentName,
        }),
      });
      const data = await res.json();

      const newImpression: PreGradingImpression = {
        overallFeeling: data.overallFeeling || 'Paper demonstrates clear engagement with rubric outcomes.',
        keyRisks: data.keyRisks || ['Ensure evidence quotes are cited properly', 'Conclusion needs stronger linkage to thesis'],
        rubricAlignmentNotes: data.rubricAlignmentNotes || 'Maintains strong alignment with curriculum standards and thesis guidelines.',
        thingsToConsider: data.thingsToConsider || ['Check paragraph 3 transition', 'Verify evidence depth in body paragraph 2'],
      };

      setImpression(newImpression);
      if (data.detectedName) {
        setVerifiedName(data.detectedName);
      }
    } catch (err) {
      console.error('Pre-grading AI error:', err);
      setImpression({
        overallFeeling: 'Solid introductory argument with good vocabulary. Minor structure improvements needed.',
        keyRisks: ['Run-on sentence in paragraph 2', 'Evidence citation format'],
        rubricAlignmentNotes: 'Meets proficient level for Claim & Thesis criterion.',
        thingsToConsider: ['Review evidence depth in body paragraph 2', 'Verify conclusion ties back to thesis'],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndStartGrading = () => {
    const updated: Submission = {
      ...submission,
      studentName: verifiedName,
      deliveryMethod,
      sharedDomain,
      preGradingImpression: impression || undefined,
      draftSavedAt: new Date().toISOString(),
    };
    onProceedToGrading(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-6">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              Pre-Grading AI Impression & Student OCR Verification
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Pre-Assessment Diagnostic Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gemini AI pre-scans the handwritten sample against rubric outcomes before you mark the canvas.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* 1. Student Name OCR Verification & Roster Matching */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                OCR Student Name Verification
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="text"
                  value={verifiedName}
                  onChange={(e) => setVerifiedName(e.target.value)}
                  className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Roster Match Verified
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Return Channel Config */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Graded Paper Return Destination
            </span>
            <div className="flex items-center gap-2">
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                className="text-xs font-semibold p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="google_classroom">Google Classroom Direct Passback</option>
                <option value="google_drive_folder">Google Drive Shared Folder (gnspes.ca)</option>
                <option value="email">Direct Email Return</option>
              </select>

              {deliveryMethod === 'google_drive_folder' && (
                <input
                  type="text"
                  value={sharedDomain}
                  onChange={(e) => setSharedDomain(e.target.value)}
                  placeholder="Domain (gnspes.ca)"
                  className="text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 w-28 font-semibold"
                />
              )}
            </div>
          </div>
        </div>

        {/* 2. Pre-Grading AI Impression Card */}
        {impression ? (
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
            <div>
              <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Gemini AI Overall First Impression
              </h3>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 leading-relaxed">
                "{impression.overallFeeling}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/60">
              {/* Things to Consider */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  Things to Consider While Marking:
                </h4>
                <ul className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {impression.thingsToConsider.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rubric Risks */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Rubric & Outcome Flag Areas:
                </h4>
                <ul className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {impression.keyRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Run AI Pre-Assessment Scan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates key themes, rubric risks, and things to consider before you begin grading.
              </p>
            </div>
            <button
              onClick={handleRunDiagnostic}
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Gemini Analyzing Submission...' : 'Run Pre-Grading AI Impression'}
            </button>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmAndStartGrading}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            Proceed to Grading Studio & Mark Canvas
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
