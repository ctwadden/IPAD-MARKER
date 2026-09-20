export type LMSPlatform = 'google_classroom' | 'canvas' | 'schoology' | 'moodle';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  gradeLevel: string;
  status: 'active' | 'at_risk' | 'excelling';
  attendanceRate: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  section: string;
  studentCount: number;
  term: string;
  lmsPlatform: LMSPlatform;
  lmsCourseId: string;
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  submissionCount: number;
  ungradedCount: number;
  rubricTitle?: string;
  rubricId?: string;
  status: 'published' | 'draft';
}

export interface RubricLevel {
  points: number;
  title: string;
  description: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  criteria: RubricCriterion[];
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface FeedbackStamp {
  id: string;
  code: string; // e.g. "ROS", "Vague", "Evid+", "Claim?", "Cit?", "Awk"
  label: string; // e.g. "Run-on Sentence"
  category: 'grammar' | 'argument' | 'evidence' | 'style' | 'praise';
  color: string;
  description: string;
  isCustom?: boolean;
}

export interface AnnotationPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface Annotation {
  id: string;
  type: 'pen' | 'highlighter' | 'circle' | 'underline' | 'squiggly' | 'stamp' | 'text' | 'eraser';
  points: AnnotationPoint[];
  color: string;
  strokeWidth: number;
  text?: string;
  stampData?: {
    code: string;
    label: string;
    color: string;
    comment?: string;
  };
  page: number;
  timestamp: string;
}

export interface CriterionScore {
  criterionId: string;
  score: number;
  comment: string;
  aiSuggestedScore?: number;
  aiReasoning?: string;
}

export interface VoiceNote {
  id: string;
  timestamp: string;
  durationSeconds: number;
  transcript: string;
  audioUrl?: string; // MP3 Audio Voice Memo Blob URL
}

export interface PreGradingImpression {
  overallFeeling: string; // 1-2 sentence impression of submission
  keyRisks: string[]; // Areas where student might lose points
  rubricAlignmentNotes: string; // How well it aligns with curriculum outcomes
  thingsToConsider: string[]; // Guiding tips for the teacher while grading
}

export interface SimilarityReport {
  scorePercent: number; // e.g. 12%
  status: 'clean' | 'minor_flag' | 'high_flag';
  flaggedSnippets: { text: string; sourceMatch: string; reason: string }[];
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  anonymousCode?: string; // e.g. "Student #A-104" for blind grading
  assignmentTitle: string;
  courseId: string;
  submissionType: 'handwritten' | 'gdoc' | 'pdf';
  fileType: 'image' | 'pdf' | 'text';
  documentImageUrls: string[];
  ocrText: string;
  ocrConfidence: number; // 0 to 100
  ocrProcessingTimeMs: number;
  annotations: Annotation[];
  scores: CriterionScore[];
  rubricId: string;
  totalScore?: number;
  maxScore?: number;
  feedbackSummary?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  voiceNotes: VoiceNote[];
  lmsStatus: 'unassessed' | 'graded_draft' | 'synced_to_lms';
  lmsSyncedAt?: string;
  submissionDate: string;
  lmsAssignmentId: string;
  deliveryMethod?: 'google_classroom' | 'google_drive_folder' | 'email';
  sharedDomain?: string; // e.g. "gnspes.ca"
  preGradingImpression?: PreGradingImpression;
  similarityReport?: SimilarityReport;
  draftSavedAt?: string;
}

export interface LearningGap {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  gapCategory: string;
  topic: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string;
  suggestedIntervention: string;
  resourceLinks?: string[];
  status: 'identified' | 'in_progress' | 'resolved';
}

export interface BenchmarkMetrics {
  ocrAccuracyPercent: number;
  ocrLatencyMs: number;
  geminiGradingLatencyMs: number;
  lmsSyncLatencyMs: number;
  canvasRenderFps: number;
  systemUptimePercent: number;
  requestsCount?: number;
  requestsProcessed?: number;
  averageMemoryMb: number;
  cpuLoadPercent: number;
}

export interface DriveFileOwner {
  displayName: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  starred?: boolean;
  trashed?: boolean;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  owners?: DriveFileOwner[];
  shared?: boolean;
  isFolder?: boolean;
  fileCategory?: 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'folder' | 'image' | 'archive' | 'other';
}

export interface ScanFolderConfig {
  id: string;
  name: string;
  webViewLink?: string;
  courseCode?: string;
  isDefault?: boolean;
  itemCount?: number;
  lastSyncedAt?: string;
}

export interface ScannedImagePage {
  id: string;
  dataUrl: string;
  fileName: string;
  pageNumber: number;
  rotation: number; // 0, 90, 180, 270
  grayscale?: boolean;
  contrastBoost?: boolean;
}

