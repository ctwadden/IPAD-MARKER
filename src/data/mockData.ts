import { Course, Student, Rubric, Submission, LearningGap, BenchmarkMetrics, ClassroomAssignment } from '../types';

export const MOCK_COURSES: Course[] = [];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    name: 'Maya Lin',
    email: 'm.lin@student.school.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    gradeLevel: '10th Grade',
    status: 'excelling',
    attendanceRate: 98.5,
  },
  {
    id: 'stu-2',
    name: 'Liam Chen',
    email: 'l.chen@student.school.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    gradeLevel: '10th Grade',
    status: 'active',
    attendanceRate: 94.2,
  },
  {
    id: 'stu-3',
    name: 'Sophia Rodriguez',
    email: 's.rodriguez@student.school.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    gradeLevel: '10th Grade',
    status: 'at_risk',
    attendanceRate: 88.0,
  },
  {
    id: 'stu-4',
    name: 'Marcus Vance',
    email: 'm.vance@student.school.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    gradeLevel: '10th Grade',
    status: 'active',
    attendanceRate: 96.1,
  },
  {
    id: 'stu-5',
    name: 'Elena Rostova',
    email: 'e.rostova@student.school.edu',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    gradeLevel: '10th Grade',
    status: 'excelling',
    attendanceRate: 99.1,
  },
];

export const MOCK_RUBRICS: Rubric[] = [
  {
    id: 'rubric-1',
    title: 'AP Synthesis & Rhetorical Essay Rubric',
    description: 'Standard CollegeBoard AP English rubric for 6-point rhetorical argument essays.',
    subject: 'English Literature',
    gradeLevel: '10th-12th Grade',
    createdAt: '2026-09-01',
    isAiGenerated: false,
    criteria: [
      {
        id: 'crit-1',
        title: 'Thesis & Claim',
        description: 'Responds to the prompt with a defensible thesis that presents a clear line of reasoning.',
        maxPoints: 1,
        levels: [
          { points: 1, title: 'Defensible Thesis', description: 'Presents a specific, defensible thesis that establishes a clear line of reasoning.' },
          { points: 0, title: 'No Thesis / Summary Only', description: 'Does not state a clear thesis or merely restates the prompt.' },
        ],
      },
      {
        id: 'crit-2',
        title: 'Evidence & Commentary',
        description: 'Provides specific evidence from texts and explains how the evidence supports the line of reasoning.',
        maxPoints: 4,
        levels: [
          { points: 4, title: 'Thorough Synthesis & Insight', description: 'Provides detailed textual evidence for all claims; commentary consistently explains how evidence develops the argument.' },
          { points: 3, title: 'Sufficient Evidence', description: 'Provides specific evidence; commentary connects evidence to the line of reasoning.' },
          { points: 2, title: 'Basic Description', description: 'Provides some evidence, but commentary is brief or repetitive.' },
          { points: 1, title: 'Minimal Evidence', description: 'Evidence is vague, inaccurate, or missing commentary.' },
          { points: 0, title: 'No Evidence', description: 'Fails to provide relevant textual evidence.' },
        ],
      },
      {
        id: 'crit-3',
        title: 'Sophistication & Style',
        description: 'Demonstrates a complex understanding of rhetorical context or persuasive voice.',
        maxPoints: 1,
        levels: [
          { points: 1, title: 'Sophisticated Voice', description: 'Employs compelling rhetoric, nuanced counter-arguments, or vivid prose style.' },
          { points: 0, title: 'Standard Structure', description: 'Demonstrates mechanical compliance without rhetorical sophistication.' },
        ],
      },
    ],
  },
  {
    id: 'rubric-2',
    title: 'Document-Based Question (DBQ) History Rubric',
    description: 'Evaluation framework for historical analysis and primary document synthesis.',
    subject: 'History',
    gradeLevel: '10th-11th Grade',
    createdAt: '2026-08-28',
    isAiGenerated: true,
    criteria: [
      {
        id: 'crit-dbq-1',
        title: 'Contextualization',
        description: 'Describes a broader historical context relevant to the prompt (1-2 paragraphs).',
        maxPoints: 1,
        levels: [
          { points: 1, title: 'Accurate Context', description: 'Accurately situates the topic within broader historical developments before, during, or after.' },
          { points: 0, title: 'Insufficient Context', description: 'Mentions vague historical facts without connecting to the broader context.' },
        ],
      },
      {
        id: 'crit-dbq-2',
        title: 'Document Usage & Analysis',
        description: 'Uses at least 4 primary sources to support a central historical argument.',
        maxPoints: 3,
        levels: [
          { points: 3, title: 'Analyzes 4+ Docs with Sourcing', description: 'Accurately incorporates 4+ documents and analyzes point of view, purpose, or audience.' },
          { points: 2, title: 'Uses 3 Docs Accurately', description: 'Uses 3 documents to support the argument.' },
          { points: 1, title: 'Describes Docs Only', description: 'Merely quotes or summarizes documents without connecting to argument.' },
          { points: 0, title: 'Off-Topic', description: 'Does not use primary sources.' },
        ],
      },
    ],
  },
];

// Helper to generate lined notebook SVG data URL for handwritten display
export function createHandwrittenNotebookSvg(text: string, title: string, date: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
    <rect width="800" height="1000" fill="#fcfaf2" />
    <!-- Red margin line -->
    <line x1="110" y1="0" x2="110" y2="1000" stroke="#f28b82" stroke-width="2" opacity="0.8" />
    
    <!-- Lined ruled paper -->
    ${Array.from({ length: 28 }).map((_, i) => `<line x1="0" y1="${100 + i * 32}" x2="800" y2="${100 + i * 32}" stroke="#d0e0f0" stroke-width="1.5" />`).join('\n')}

    <!-- Notebook punch holes -->
    <circle cx="40" cy="180" r="14" fill="#e2e0d8" stroke="#d0cecc" stroke-width="2" />
    <circle cx="40" cy="500" r="14" fill="#e2e0d8" stroke="#d0cecc" stroke-width="2" />
    <circle cx="40" cy="820" r="14" fill="#e2e0d8" stroke="#d0cecc" stroke-width="2" />

    <!-- Title & Date Header -->
    <text x="130" y="65" font-family="'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif" font-size="28" font-weight="700" fill="#1b2a4a">${title}</text>
    <text x="620" y="65" font-family="'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif" font-size="22" fill="#4a5568">${date}</text>

    <!-- Handwritten Essay Lines -->
    ${text
      .split('\n')
      .slice(0, 24)
      .map(
        (line, idx) =>
          `<text x="130" y="${124 + idx * 32}" font-family="'Caveat', 'Dancing Script', 'Comic Sans MS', cursive" font-size="22" fill="#1e293b" letter-spacing="0.5">${line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</text>`
      )
      .join('\n')}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MOCK_ESSAY_TEXT_1 = `Title: Rhetorical Power in Atticus Finch's Closing Argument
Name: Maya Lin - AP Literature Period 2

Atticus Finch’s closing defense in 'To Kill a Mockingbird' remains one of American literature's most compelling courtroom speeches. Through masterful ethos, emotional appeal, and logical dismantling of false testimony, Atticus exposes the underlying prejudice of Maycomb.

First, Atticus establishes unquestionable moral authority by appealing to the founding principles of equality. He directly invokes Thomas Jefferson's famous declaration that 'all men are created equal.' By shifting the trial from a racial conflict to a constitutional responsibility, he forces the jury to confront their sworn duty under the law.

Furthermore, Atticus relies heavily on pathos to dismantle the prosecution's narrative. He points out Mayella Ewell's tragic isolation, acknowledging her suffering while making clear that her fear led her to accuse an innocent man. The contrast between Mayella’s desperation and Tom Robinson’s innate decency creates a stark moral clarity.

Finally, the logical evidence (logos) leaves no room for reasonable doubt. Tom’s crippled left arm physically prevented him from causing the injuries sustained by Mayella, which clearly came from a left-handed attacker like Bob Ewell. Through this precise synthesis of logic and moral courage, Atticus delivers an enduring lesson on justice.`;

export const MOCK_ESSAY_TEXT_2 = `DBQ Analysis: The Impact of the Industrial Revolution on Urban Working Class
Student: Liam Chen - US History Period 4

The late 19th-century Industrial Revolution transformed American society, leading to rapid urbanization and unprecedented economic output. However, for working-class families in major cities like New York and Chicago, this era brought extreme hardship, tenement overcrowding, and hazardous working conditions.

According to Document A (Jacob Riis, 'How the Other Half Lives', 1890), immigrant families lived packed into windowless tenement apartments with inadequate sanitation. Riis's photographic evidence exposed the rampant cholera and tuberculosis outbreaks that devastated child mortality rates in urban slums.

Document B (Labor Union Manifesto, 1886) highlights the physical dangers of unregulated factory floors. Workers routinely suffered limb amputations from unguarded machinery while working 12-to-14 hour shifts for meager wages. This environment sparked the rise of organized labor, notably the Knights of Labor and the American Federation of Labor (AFL).

In conclusion, while industrialization laid the foundation for modern American prosperity, it exacted a heavy human toll on the working class until Progressive Era reforms introduced child labor restrictions and workplace safety laws.`;

export const MOCK_SUBMISSIONS: Submission[] = [];

export const MOCK_LEARNING_GAPS: LearningGap[] = [
  {
    id: 'gap-1',
    studentId: 'stu-3',
    studentName: 'Sophia Rodriguez',
    courseId: 'course-1',
    gapCategory: 'Textual Commentary & Evidence Depth',
    topic: 'Rhetorical Analysis & Direct Quotation Integration',
    severity: 'high',
    evidence: 'In Assignment 1, commentary was limited to 1 sentence per paragraph with 0 direct textual quotes.',
    suggestedIntervention: 'Provide 1-on-1 graphic organizer scaffold for quote integration (ICE Method: Introduce, Cite, Explain). Assign 15-min interactive practice on embedding quotes.',
    resourceLinks: ['https://owl.purdue.edu/owl/general_writing/writing_with_research/using_research/index.html'],
    status: 'identified',
  },
  {
    id: 'gap-2',
    studentId: 'stu-2',
    studentName: 'Liam Chen',
    courseId: 'course-2',
    gapCategory: 'DBQ Document Multi-Sourcing',
    topic: 'Synthesizing 4+ Primary Sources',
    severity: 'medium',
    evidence: 'Used only 2 documents out of 6 required in recent DBQ essay submission.',
    suggestedIntervention: 'Provide DBQ Matrix template forcing student to map 4 primary documents before writing body paragraphs.',
    resourceLinks: ['https://apcentral.collegeboard.org/courses/ap-united-states-history/exam/dbq-rubric'],
    status: 'in_progress',
  },
  {
    id: 'gap-3',
    studentId: 'stu-4',
    studentName: 'Marcus Vance',
    courseId: 'course-1',
    gapCategory: 'Thesis Line of Reasoning',
    topic: 'Distinguishing Thesis Claims from Plot Summaries',
    severity: 'medium',
    evidence: 'Thesis statement restates plot summary without taking a defensible rhetorical position.',
    suggestedIntervention: 'Assign AI Thesis Doctor practice exercise to transform descriptive statements into defensible claims.',
    status: 'identified',
  },
];

export const INITIAL_BENCHMARKS: BenchmarkMetrics = {
  ocrAccuracyPercent: 98.7,
  ocrLatencyMs: 312,
  geminiGradingLatencyMs: 620,
  lmsSyncLatencyMs: 145,
  canvasRenderFps: 60,
  systemUptimePercent: 99.98,
  requestsProcessed: 1420,
  averageMemoryMb: 128,
  cpuLoadPercent: 12.4,
};

export const GOOGLE_CLASSROOM_ASSIGNMENTS: ClassroomAssignment[] = [];

export function generateAssignmentSubmissions(assignment: ClassroomAssignment): Submission[] {
  const students = MOCK_STUDENTS;
  return students.map((stu, idx) => {
    const isUnassessed = idx >= 2;
    const essayText =
      assignment.id === 'gc-assign-2'
        ? MOCK_ESSAY_TEXT_2
        : `Student Name: ${stu.name}\nAssignment: ${assignment.title}\n\nThis paper examines the central theme of ${assignment.title}. Through careful analysis of textual evidence and historical context, we can observe critical patterns in the author's line of reasoning. The initial premise introduces a clear thesis that establishes the primary direction of the argument.\n\nFurthermore, secondary details demonstrate how evidence directly links to broader consequences. In comparison to alternative perspectives, the primary sources offer compelling support for the central claim.\n\nIn conclusion, the synthesis of evidence and rigorous reasoning establishes a cohesive analysis that satisfies all core curricular benchmarks.`;

    return {
      id: `sub-imp-${assignment.id}-${stu.id}`,
      studentId: stu.id,
      studentName: stu.name,
      anonymousCode: `Student #${101 + idx}`,
      assignmentTitle: assignment.title,
      courseId: assignment.courseId,
      submissionType: 'handwritten',
      fileType: 'image',
      documentImageUrls: [
        createHandwrittenNotebookSvg(essayText, assignment.title, assignment.dueDate)
      ],
      ocrText: essayText,
      ocrConfidence: 98.4 - idx * 0.5,
      ocrProcessingTimeMs: 270 + idx * 25,
      annotations: [],
      scores: isUnassessed
        ? []
        : [
            { criterionId: 'crit-1', score: 1, comment: 'Defensible thesis presented.' },
            { criterionId: 'crit-2', score: Math.min(3, assignment.maxPoints), comment: 'Solid supporting evidence.' },
          ],
      rubricId: assignment.rubricId || 'rubric-1',
      totalScore: isUnassessed ? undefined : Math.round(assignment.maxPoints * 0.85),
      maxScore: assignment.maxPoints,
      feedbackSummary: isUnassessed ? '' : 'Good effort on thesis and evidence synthesis.',
      voiceNotes: [],
      lmsStatus: isUnassessed ? 'unassessed' : 'graded_draft',
      submissionDate: '2026-09-20T11:00:00Z',
      lmsAssignmentId: assignment.id,
      deliveryMethod: 'google_classroom',
      sharedDomain: 'school.edu',
    };
  });
}

