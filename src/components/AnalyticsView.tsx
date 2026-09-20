import React, { useState } from 'react';
import { LearningGap, Student, Course } from '../types';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Send,
  UserCheck,
  Target,
  Mail,
  RefreshCcw,
  FileText,
} from 'lucide-react';

interface AnalyticsViewProps {
  learningGaps: LearningGap[];
  students: Student[];
  selectedCourse: Course | null;
  onAddLearningGap: (gap: LearningGap) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  learningGaps,
  students,
  selectedCourse,
}) => {
  const [selectedGap, setSelectedGap] = useState<LearningGap>(learningGaps[0]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiPlan, setAiPlan] = useState<{
    strategy: string;
    actionPlan: string[];
    parentEmailDraft: string;
  } | null>(null);

  const handleGenerateIntervention = async (gap: LearningGap) => {
    setIsGenerating(true);
    setAiPlan(null);
    try {
      const res = await fetch('/api/gemini/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: gap.studentName,
          gapCategory: gap.gapCategory,
          topic: gap.topic,
          evidence: gap.evidence,
        }),
      });
      const data = await res.json();
      setAiPlan({
        strategy: data.strategy,
        actionPlan: data.actionPlan || [],
        parentEmailDraft: data.parentEmailDraft || '',
      });
    } catch (err) {
      console.error('Failed to generate intervention:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5 text-amber-300" />
            Learning Gap Diagnostics & Intervention Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Student Performance & Gap Analytics
          </h1>
          <p className="text-xs text-indigo-200 mt-1">
            Automated trend analysis from graded handwritten OCR essays for {selectedCourse?.title || 'Selected Class'}.
          </p>
        </div>
      </div>

      {/* Mastery Skill Categories Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Thesis & Claim Strength</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">92%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+4% vs Last Unit</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[92%]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Textual Evidence Depth</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">76%</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Target Growth Area</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[76%]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Rhetorical Sophistication</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">88%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Proficient</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[88%]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Grammar & Structure</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">95%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Exemplary</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-500 h-full w-[95%]" />
          </div>
        </div>
      </div>

      {/* Main Grid: Identified Learning Gaps vs AI Intervention Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Flagged Learning Gaps List - 5 Cols */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Flagged Learning Gaps ({learningGaps.length})
          </h3>

          <div className="flex flex-col gap-3">
            {learningGaps.map((gap) => (
              <div
                key={gap.id}
                onClick={() => {
                  setSelectedGap(gap);
                  setAiPlan(null);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  selectedGap.id === gap.id
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {gap.studentName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      gap.severity === 'high'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {gap.severity} Severity
                  </span>
                </div>

                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {gap.gapCategory}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  "{gap.evidence}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: AI Intervention Strategy Details - 7 Cols */}
        <div className="lg:col-span-7 flex flex-col gap-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Personalized Intervention Strategy
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {selectedGap.studentName} — {selectedGap.gapCategory}
              </h2>
            </div>

            <button
              onClick={() => handleGenerateIntervention(selectedGap)}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Gemini Generating Plan...' : 'Generate AI Action Plan'}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                Suggested Pedagogy & Scaffold Strategy
              </h4>
              <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                {selectedGap.suggestedIntervention}
              </p>
            </div>

            {aiPlan && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                
                {/* Step Action Plan */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Targeted Action Plan Steps
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {aiPlan.actionPlan.map((step, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Parent Email Draft */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    Parent / Guardian Support Communication Draft
                  </h4>
                  <textarea
                    value={aiPlan.parentEmailDraft}
                    readOnly
                    rows={5}
                    className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl font-sans text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                  />
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
