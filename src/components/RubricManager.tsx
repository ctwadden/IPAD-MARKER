import React, { useState } from 'react';
import { Rubric, RubricCriterion } from '../types';
import {
  Sparkles,
  Plus,
  Layers,
  Award,
  CheckCircle2,
  Trash2,
  BookOpen,
  FileText,
  Copy,
} from 'lucide-react';

interface RubricManagerProps {
  rubrics: Rubric[];
  onAddRubric: (rubric: Rubric) => void;
  onDeleteRubric: (rubricId: string) => void;
}

export const RubricManager: React.FC<RubricManagerProps> = ({
  rubrics,
  onAddRubric,
  onDeleteRubric,
}) => {
  const [selectedRubric, setSelectedRubric] = useState<Rubric>(rubrics[0]);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // AI Prompt Inputs
  const [subject, setSubject] = useState<string>('English Literature');
  const [gradeLevel, setGradeLevel] = useState<string>('10th Grade');
  const [topic, setTopic] = useState<string>('Argumentative Essay on Digital Ethics & AI');
  const [curriculum, setCurriculum] = useState<string>('Common Core State Standards (CCSS.ELA-LITERACY.W.9-10.1)');

  const handleGenerateAiRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/suggest-rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          gradeLevel,
          topic,
          curriculumStandards: curriculum,
        }),
      });
      const data = await res.json();

      if (data.rubric) {
        onAddRubric(data.rubric);
        setSelectedRubric(data.rubric);
        setIsAiModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to generate AI rubric:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Curriculum Rubric Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, upload, or suggest AI rubrics aligned with your course curriculum.
          </p>
        </div>

        <button
          onClick={() => setIsAiModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          ✨ AI Suggest Rubric based on Curriculum
        </button>
      </div>

      {/* Main Grid: Saved Rubrics list vs Active Rubric Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Saved Rubrics List - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Active Rubric Library ({rubrics.length})
          </h3>

          <div className="flex flex-col gap-2">
            {rubrics.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRubric(r)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  selectedRubric.id === r.id
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {r.title}
                  </h4>
                  {r.isAiGenerated && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      AI Generated
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {r.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>{r.subject}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {r.criteria.length} Criteria
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Active Rubric Inspector - 8 Cols */}
        <div className="lg:col-span-8 flex flex-col gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {selectedRubric.subject} • {selectedRubric.gradeLevel}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {selectedRubric.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedRubric.description}
              </p>
            </div>

            {rubrics.length > 1 && (
              <button
                onClick={() => onDeleteRubric(selectedRubric.id)}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                title="Delete Rubric"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Criteria Breakdown */}
          <div className="flex flex-col gap-4 my-2">
            {selectedRubric.criteria.map((crit, idx) => (
              <div
                key={crit.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {crit.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    {crit.maxPoints} Points Max
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {crit.description}
                </p>

                {/* Level Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {crit.levels.map((lvl) => (
                    <div
                      key={lvl.points}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                        <span>{lvl.title}</span>
                        <span>{lvl.points} Pts</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lvl.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* AI Rubric Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              <Sparkles className="w-5 h-5 text-amber-400" />
              AI Curriculum Rubric Suggestion
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gemini AI will craft a customized, standards-aligned grading rubric tailored specifically to your subject matter and prompt goals.
            </p>

            <form onSubmit={handleGenerateAiRubric} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject Area</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade Level</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Topic / Assignment Prompt</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Curriculum Standards</label>
                <input
                  type="text"
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating Rubric...' : 'Generate Rubric'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
