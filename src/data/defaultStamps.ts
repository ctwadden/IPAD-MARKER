import { FeedbackStamp } from '../types';

export const DEFAULT_FEEDBACK_STAMPS: FeedbackStamp[] = [
  {
    id: 'stamp-ros',
    code: 'ROS',
    label: 'Run-on Sentence',
    category: 'grammar',
    color: '#dc2626', // Red
    description: 'Sentence lacks proper punctuation junction or coordinating conjunction.',
  },
  {
    id: 'stamp-vague',
    code: 'Vague',
    label: 'Vague Statement',
    category: 'style',
    color: '#ea580c', // Orange
    description: 'Explanation or term lacks specific detail, data, or context.',
  },
  {
    id: 'stamp-evid-plus',
    code: 'Evid+',
    label: 'Strong Evidence',
    category: 'evidence',
    color: '#16a34a', // Green
    description: 'Excellent textual quote or concrete evidence supporting the thesis.',
  },
  {
    id: 'stamp-claim',
    code: 'Claim?',
    label: 'Unsubstantiated Claim',
    category: 'argument',
    color: '#9333ea', // Purple
    description: 'Asserts a strong claim without sufficient supporting rationale.',
  },
  {
    id: 'stamp-cit',
    code: 'Cit?',
    label: 'Citation Needed',
    category: 'evidence',
    color: '#d97706', // Amber
    description: 'Requires MLA/APA in-text citation or reference source credit.',
  },
  {
    id: 'stamp-awk',
    code: 'Awk',
    label: 'Awkward Phrasing',
    category: 'style',
    color: '#4f46e5', // Indigo
    description: 'Word choice or sentence syntax is clumsy or difficult to follow.',
  },
  {
    id: 'stamp-trans',
    code: 'Trans',
    label: 'Needs Transition',
    category: 'style',
    color: '#0284c7', // Sky Blue
    description: 'Sudden topic shift; add a transitional bridge phrase.',
  },
  {
    id: 'stamp-praise',
    code: 'Spot On! ★',
    label: 'Insightful Point',
    category: 'praise',
    color: '#059669', // Emerald
    description: 'Perceptive analysis showing deep analytical mastery.',
  },
];
