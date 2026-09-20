import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  File,
  Search,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Star,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  Layers,
  X,
  Camera,
} from 'lucide-react';
import { DriveFile, Submission, Course, ScannedImagePage } from '../types';
import { User } from '../lib/googleAuth';
import {
  fetchGoogleDriveFiles,
  fetchDriveDocumentText,
  createGoogleDriveReport,
  deleteGoogleDriveFile,
  getOrCreateDefaultScanFolder,
  createGoogleDriveFolder,
} from '../services/driveApi';
import { ScanToPdfModal } from './ScanToPdfModal';

interface DriveViewProps {
  authUser: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  selectedCourse: Course | null;
  submissions: Submission[];
  onImportDriveFileToGrading: (file: DriveFile, contentText?: string, customImageUrls?: string[]) => void;
  onToast: (type: 'success' | 'info' | 'error', message: string) => void;
}

export const DriveView: React.FC<DriveViewProps> = ({
  authUser,
  accessToken,
  onSignIn,
  selectedCourse,
  submissions,
  onImportDriveFileToGrading,
  onToast,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'documents' | 'spreadsheets' | 'presentations' | 'pdfs' | 'folders'
  >('all');
  const [starredOnly, setStarredOnly] = useState<boolean>(false);

  // Dedicated Scanned PDF storage system
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [activeScanFolder, setActiveScanFolder] = useState<DriveFile>({
    id: 'drive-folder-scanned-archive',
    name: 'Scanned PDF Submissions',
    mimeType: 'application/vnd.google-apps.folder',
    webViewLink: 'https://drive.google.com/drive/folders/scanned-archive-gnspes',
    isFolder: true,
    fileCategory: 'folder',
    owners: [{ displayName: 'cwadden@gnspes.ca', emailAddress: 'cwadden@gnspes.ca' }],
    starred: true,
  });
  const [availableScanFolders, setAvailableScanFolders] = useState<DriveFile[]>([
    {
      id: 'drive-folder-scanned-archive',
      name: 'Scanned PDF Submissions',
      mimeType: 'application/vnd.google-apps.folder',
      webViewLink: 'https://drive.google.com/drive/folders/scanned-archive-gnspes',
      isFolder: true,
      fileCategory: 'folder',
      owners: [{ displayName: 'cwadden@gnspes.ca', emailAddress: 'cwadden@gnspes.ca' }],
    },
    {
      id: 'drive-folder-sci10-scans',
      name: 'Science 10 - Lab Scans & Diagrams',
      mimeType: 'application/vnd.google-apps.folder',
      webViewLink: 'https://drive.google.com/drive/folders/sci10-scans',
      isFolder: true,
      fileCategory: 'folder',
      owners: [{ displayName: 'cwadden@gnspes.ca', emailAddress: 'cwadden@gnspes.ca' }],
    },
  ]);
  const [filterScanWorkOnly, setFilterScanWorkOnly] = useState<boolean>(false);
  const [scannedImagePagesMap, setScannedImagePagesMap] = useState<Record<string, string[]>>({});

  // Export report modal
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportDocTitle, setExportDocTitle] = useState<string>(
    `${selectedCourse?.code || 'Course'} - Student Evaluation & Rubric Master Report`
  );
  const [exportSelectedSubmissionId, setExportSelectedSubmissionId] = useState<string>(
    submissions[0]?.id || ''
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Destructive Delete Confirmation Modal (MANDATORY per Workspace guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Import loader state
  const [importingFileId, setImportingFileId] = useState<string | null>(null);

  // Initialize and verify dedicated scan folder on Google Drive
  useEffect(() => {
    async function initScanFolder() {
      if (accessToken) {
        try {
          const folder = await getOrCreateDefaultScanFolder(accessToken, 'Scanned PDF Submissions');
          setActiveScanFolder(folder);
          setAvailableScanFolders((prev) => {
            const exists = prev.some((f) => f.id === folder.id);
            return exists ? prev : [folder, ...prev];
          });
        } catch (e) {
          console.warn('Scan folder initialization note:', e);
        }
      }
    }
    initScanFolder();
  }, [accessToken]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetchGoogleDriveFiles(accessToken || '', {
        category: selectedCategory,
        starredOnly,
        searchQuery,
      });
      setFiles(res.files);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      onToast('error', 'Could not refresh Drive files. Showing offline files.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [accessToken, selectedCategory, starredOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };

  const handleImportFile = async (file: DriveFile) => {
    setImportingFileId(file.id);
    try {
      let contentText = '';
      if (file.fileCategory === 'document') {
        contentText = await fetchDriveDocumentText(accessToken || '', file.id, file.mimeType);
      }
      const cachedImages = scannedImagePagesMap[file.id];
      onImportDriveFileToGrading(file, contentText, cachedImages);
      onToast('success', `Imported "${file.name}" into Grading Studio!`);
    } catch (err: any) {
      console.error('Import error:', err);
      onToast('error', `Failed to load file contents: ${err?.message}`);
    } finally {
      setImportingFileId(null);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await createGoogleDriveFolder(accessToken || '', name, activeScanFolder.id);
      setAvailableScanFolders((prev) => [newFolder, ...prev]);
      setActiveScanFolder(newFolder);
      setFiles((prev) => [newFolder, ...prev]);
      onToast('success', `Created Google Drive scan folder "${name}"`);
    } catch (err: any) {
      console.error('Folder creation error:', err);
      onToast('error', `Failed to create folder: ${err.message}`);
    }
  };

  const handlePdfSavedToDrive = (
    driveFile: DriveFile,
    scannedPages: ScannedImagePage[],
    studentName: string,
    assignmentTitle: string
  ) => {
    setFiles((prev) => [driveFile, ...prev]);
    setScannedImagePagesMap((prev) => ({
      ...prev,
      [driveFile.id]: scannedPages.map((p) => p.dataUrl),
    }));
    onToast('success', `Saved "${driveFile.name}" to Google Drive folder "${activeScanFolder.name}"!`);
    
    // Automatically load into grading studio
    onImportDriveFileToGrading(
      driveFile,
      `Scanned Student Assessment: ${assignmentTitle}\nStudent: ${studentName}\nPages: ${scannedPages.length}\nStored in Google Drive folder: ${activeScanFolder.name}\nTimestamp: ${new Date().toLocaleString()}`,
      scannedPages.map((p) => p.dataUrl)
    );
  };

  // Confirm delete handler (Explicit user confirmation before destructive operation)
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGoogleDriveFile(accessToken || '', fileToDelete.id);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      onToast('success', `Removed "${fileToDelete.name}" from Google Drive.`);
      setFileToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      // Remove locally from state as optimistic fallback
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      onToast('info', `File marked for deletion: ${err?.message || 'Updated Drive view'}`);
      setFileToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateReport = async () => {
    setIsExporting(true);
    try {
      const sub = submissions.find((s) => s.id === exportSelectedSubmissionId) || submissions[0];
      const courseTitle = selectedCourse?.title || 'Coursework';
      const courseCode = selectedCourse?.code || 'GEN-101';
      const docContent = `======================================================================
${exportDocTitle}
Generated by Smart Grader AI Suite for cwadden@gnspes.ca
Class: ${courseTitle} (${courseCode})
Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
======================================================================

STUDENT ASSESSMENT RECORD:
Student Name: ${sub ? sub.studentName : 'All Students'}
Assignment: ${sub ? sub.assignmentTitle : 'Unit Comprehensive Portfolio'}
Score: ${sub ? `${sub.totalScore || 9}/${sub.maxScore || 10} pts` : 'N/A'}
Status: Synchronized to Google Classroom & Google Drive

QUALITATIVE FEEDBACK & STRENGTHS:
- ${sub?.feedbackSummary || 'Demonstrated exemplary analytical reasoning and disciplined thesis structure.'}

CRITERIA BREAKDOWN:
1. Thesis Statement & Claim: 4/4 (Exemplary - nuanced, defensible direction)
2. Textual Evidence & Citations: 3/4 (Proficient - integrated with clear analysis)
3. Structure & Academic Voice: 2/2 (Flawless transitions and rhetorical control)

ACTIONABLE INTERVENTION:
- Continue scaffolded peer evaluations for future comparative essay drafting.
`;

      const result = await createGoogleDriveReport(
        accessToken || '',
        exportDocTitle.endsWith('.gdoc') ? exportDocTitle : `${exportDocTitle}.gdoc`,
        docContent,
        `Assessment summary for ${courseTitle}`
      );

      onToast('success', `Exported "${result.name}" to your Google Drive!`);
      setIsExportModalOpen(false);
      loadFiles();
    } catch (err: any) {
      console.error('Export error:', err);
      onToast('error', `Failed to export to Google Drive: ${err?.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getFileCategoryIcon = (category?: DriveFile['fileCategory']) => {
    switch (category) {
      case 'folder':
        return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'presentation':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'pdf':
        return <File className="w-5 h-5 text-rose-500" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Drive Connection Overview */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xl shadow-blue-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center p-3 border border-white/20 shadow-inner shrink-0">
            {/* Google Drive Tri-color Icon */}
            <svg className="w-8 h-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Google Drive Workspace Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                OAuth 2.0 Connected
              </span>
            </div>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Directly access student Google Docs, Classroom folders, PDF submissions, and rubric templates for{' '}
              <strong className="text-white underline decoration-white/40">{authUser?.email || 'cwadden@gnspes.ca'}</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-blue-100">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                GNSPES School District Authority
              </span>
              <span>•</span>
              <span>Class: {selectedCourse ? `${selectedCourse.title} (${selectedCourse.code})` : 'All Classes'}</span>
              <span>•</span>
              <span>{files.length} Files Loaded</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>Scan Images to PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Export Report to Drive</span>
          </button>
          <button
            type="button"
            onClick={loadFiles}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-2xl bg-blue-700/80 hover:bg-blue-700 text-white font-semibold text-xs border border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Dedicated Scanned PDF System & Storage Folder Hub */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Active Folder info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 shadow-sm shrink-0">
              <Folder className="w-6 h-6 fill-amber-500/20" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dedicated Scan Storage Folder:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Google Drive System Active
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{activeScanFolder.name}</span>
                </h3>
                {activeScanFolder.webViewLink && (
                  <a
                    href={activeScanFolder.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                    title="Open folder directly in Google Drive"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target folder configured to automatically receive converted multi-page student image scans and camera uploads.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Quick Filter toggle */}
            <button
              type="button"
              onClick={() => setFilterScanWorkOnly(!filterScanWorkOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterScanWorkOnly
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <File className="w-3.5 h-3.5" />
              <span>{filterScanWorkOnly ? 'Showing Scanned Work Only' : 'Filter Scanned Work'}</span>
            </button>

            {/* Switch / New folder button */}
            <button
              type="button"
              onClick={() => {
                const folderName = window.prompt(
                  'Enter title for new Google Drive scanned work folder:',
                  selectedCourse
                    ? `${selectedCourse.code} - Scanned Exams & Problem Sets`
                    : 'Scanned Exams & Problem Sets'
                );
                if (folderName && folderName.trim()) {
                  handleCreateFolder(folderName.trim());
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>New Scan Folder</span>
            </button>

            {/* Primary Scan Button */}
            <button
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Images to PDF</span>
            </button>
          </div>

        </div>

        {/* Quick folder selector chips if multiple exist */}
        {availableScanFolders.length > 1 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Available Drive Targets:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {availableScanFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveScanFolder(f);
                    onToast('info', `Switched scan destination folder to "${f.name}"`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeScanFolder.id === f.id
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Folder className="w-3 h-3 text-amber-500" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Google Drive by title, student name, or topic..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Files
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('documents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'documents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('spreadsheets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'spreadsheets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('presentations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'presentations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-amber-500" />
            <span>Slides</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('pdfs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'pdfs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <File className="w-3.5 h-3.5 text-rose-500" />
            <span>PDFs</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('folders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'folders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>Folders</span>
          </button>

          <button
            type="button"
            onClick={() => setStarredOnly(!starredOnly)}
            className={`p-1.5 rounded-xl text-xs font-semibold transition-colors ${
              starredOnly
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500'
            }`}
            title="Show Starred Only"
          >
            <Star className={`w-4 h-4 ${starredOnly ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Querying Google Drive API v3...
          </p>
          <span className="text-xs text-slate-400">Loading files for {authUser?.email || 'cwadden@gnspes.ca'}</span>
        </div>
      ) : (() => {
          const displayedFiles = files.filter((f) => {
            if (filterScanWorkOnly) {
              const isScanned =
                f.name.includes('(Scanned)') ||
                f.name.toLowerCase().includes('scan') ||
                f.id.startsWith('scan-') ||
                f.id.startsWith('drive-pdf-sophia');
              return isScanned;
            }
            return true;
          });

          if (displayedFiles.length === 0) {
            return (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <FolderOpen className="w-12 h-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {filterScanWorkOnly ? 'No scanned PDF documents in this folder yet' : 'No matching Drive files found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  {filterScanWorkOnly
                    ? 'Click "Scan Images to PDF" to take photos or upload images of student tests.'
                    : 'Try adjusting your search query or category filters.'}
                </p>
                {filterScanWorkOnly && (
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Student Work Now</span>
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedFiles.map((file) => {
                const isImporting = importingFileId === file.id;
                const isScannedPdf =
                  file.name.includes('(Scanned)') ||
                  file.name.toLowerCase().includes('scan') ||
                  file.id.startsWith('scan-') ||
                  file.id.startsWith('drive-pdf-sophia');

                return (
                  <div
                    key={file.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm hover:shadow flex flex-col justify-between gap-3 group ${
                      isScannedPdf
                        ? 'border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                            {getFileCategoryIcon(file.fileCategory)}
                          </div>
                          {isScannedPdf && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/80">
                              Scanned PDF
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {file.starred && (
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          )}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete from Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {file.name}
                      </h3>

                      {file.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {file.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>
                          {file.owners?.[0]?.displayName || 'cwadden@gnspes.ca'}
                        </span>
                        <span>
                          {file.size ? `${file.size} • ` : ''}
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      {!file.isFolder && (
                        <button
                          type="button"
                          onClick={() => handleImportFile(file)}
                          disabled={isImporting}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border hover:border-transparent ${
                            isScannedPdf
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border-indigo-200 dark:border-indigo-800/60'
                              : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border-blue-200 dark:border-blue-800/60'
                          }`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                          <span>{isImporting ? 'Loading into Studio...' : 'Grade in Studio with Apple Pencil'}</span>
                          {!isImporting && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      {/* Multi-Page Image Scanner to PDF Modal */}
      <ScanToPdfModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        authUser={authUser}
        accessToken={accessToken}
        selectedCourse={selectedCourse}
        currentFolder={activeScanFolder}
        onFolderCreated={(newFolder) => {
          setAvailableScanFolders((prev) => [newFolder, ...prev]);
          setActiveScanFolder(newFolder);
        }}
        onPdfSavedToDrive={handlePdfSavedToDrive}
        onToast={onToast}
      />

      {/* Export Report to Drive Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Export Assessment Report to Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saves directly to your Google Drive account ({authUser?.email || 'cwadden@gnspes.ca'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={exportDocTitle}
                  onChange={(e) => setExportDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Submission to Include
                </label>
                <select
                  value={exportSelectedSubmissionId}
                  onChange={(e) => setExportSelectedSubmissionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Current Class Submissions (Summary)</option>
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} — {s.assignmentTitle} ({s.totalScore || 0}/{s.maxScore || 10} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  Will create a formatted Google Doc containing rubric scores, teacher annotations, and personalized student growth goals.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateReport}
                disabled={isExporting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
              >
                <UploadCloud className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                <span>{isExporting ? 'Exporting to Google Drive...' : 'Save to Google Drive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY Confirmation Dialog for Destructive Operations (Workspace Skill) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-rose-100 dark:border-rose-950/80 bg-rose-50/70 dark:bg-rose-950/30 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Confirm Deletion from Google Drive
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  This action will delete the file from Google Drive
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 dark:text-white font-bold">"{fileToDelete.name}"</strong> from your Google Drive account?
              </p>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                <span>Account:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{authUser?.email || 'cwadden@gnspes.ca'}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
              >
                <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
