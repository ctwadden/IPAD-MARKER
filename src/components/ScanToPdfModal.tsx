import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Folder,
  FileText,
  Plus,
  Trash2,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  FileCheck,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ScannedImagePage, Course, DriveFile } from '../types';
import { User } from '../lib/googleAuth';
import { compileImagesToPdf } from '../services/pdfScannerService';
import { uploadPdfFileToDrive, createGoogleDriveFolder } from '../services/driveApi';

interface ScanToPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: User | null;
  accessToken: string | null;
  selectedCourse: Course | null;
  currentFolder: DriveFile | null;
  onFolderCreated?: (newFolder: DriveFile) => void;
  onPdfSavedToDrive: (
    driveFile: DriveFile,
    scannedPages: ScannedImagePage[],
    studentName: string,
    assignmentTitle: string
  ) => void;
  onToast: (type: 'success' | 'info' | 'error', message: string) => void;
}

// Sample realistic handwritten student pages for instant testing
const SAMPLE_SCANNED_PAGES: Omit<ScannedImagePage, 'id' | 'pageNumber'>[] = [
  {
    fileName: 'Page_1_Calculus_Handwritten.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
    rotation: 0,
    grayscale: false,
    contrastBoost: true,
  },
  {
    fileName: 'Page_2_Derivations_Proof.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80',
    rotation: 0,
    grayscale: true,
    contrastBoost: true,
  },
  {
    fileName: 'Page_3_Graph_Analysis.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80',
    rotation: 0,
    grayscale: false,
    contrastBoost: false,
  },
];

export const ScanToPdfModal: React.FC<ScanToPdfModalProps> = ({
  isOpen,
  onClose,
  authUser,
  accessToken,
  selectedCourse,
  currentFolder,
  onFolderCreated,
  onPdfSavedToDrive,
  onToast,
}) => {
  const [pages, setPages] = useState<ScannedImagePage[]>([]);
  const [studentName, setStudentName] = useState<string>('Sophia Patel');
  const [assignmentTitle, setAssignmentTitle] = useState<string>(
    selectedCourse
      ? `${selectedCourse.code} - Handwritten Problem Set Scan`
      : 'Handwritten Problem Set Scan'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [createdPdfFile, setCreatedPdfFile] = useState<DriveFile | null>(null);

  // New Folder inline creator
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>(
    selectedCourse
      ? `${selectedCourse.code} - Scanned Submissions`
      : 'Scanned Student Submissions'
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [activeFolder, setActiveFolder] = useState<DriveFile | null>(currentFolder);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPages((prev) => [
            ...prev,
            {
              id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              dataUrl: result,
              fileName: file.name,
              pageNumber: prev.length + 1,
              rotation: 0,
              grayscale: false,
              contrastBoost: false,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSamplePages = () => {
    const loaded: ScannedImagePage[] = SAMPLE_SCANNED_PAGES.map((s, idx) => ({
      ...s,
      id: `sample-page-${idx + 1}`,
      pageNumber: idx + 1,
    }));
    setPages(loaded);
    onToast('info', 'Loaded 3 sample student handwritten scan pages.');
  };

  const handleRotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleToggleGrayscale = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, grayscale: !p.grayscale } : p
      )
    );
  };

  const handleToggleContrast = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, contrastBoost: !p.contrastBoost } : p
      )
    );
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === pages.length - 1)
    ) {
      return;
    }
    const newPages = [...pages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newPages[index];
    newPages[index] = newPages[targetIdx];
    newPages[targetIdx] = temp;

    // renumber
    newPages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });
    setPages(newPages);
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const created = await createGoogleDriveFolder(
        accessToken || '',
        newFolderName.trim(),
        activeFolder?.id
      );
      setActiveFolder(created);
      if (onFolderCreated) onFolderCreated(created);
      setShowNewFolderInput(false);
      onToast('success', `Created Google Drive folder "${created.name}"`);
    } catch (err: any) {
      console.error(err);
      onToast('error', `Failed to create folder: ${err.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCompileAndSave = async () => {
    if (pages.length === 0) {
      onToast('error', 'Please upload or capture at least one image page.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Optimizing image contrast & rotating pages...');

    try {
      // 1. Compile pages into PDF
      setProcessingStatus('Compiling high-resolution multi-page PDF...');
      const cleanFileName = `${studentName.trim().replace(/\s+/g, '_')}_${assignmentTitle
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

      const { blob } = await compileImagesToPdf(pages, {
        title: assignmentTitle,
        studentName,
        courseTitle: selectedCourse?.title || 'Active Class',
        addHeaderFooter: true,
      });

      // 2. Upload to Google Drive
      const targetFolderId = activeFolder?.id || 'drive-folder-scanned-archive';
      setProcessingStatus(`Uploading to Google Drive folder "${activeFolder?.name || 'Scanned PDF Submissions'}"...`);

      const driveFile = await uploadPdfFileToDrive(
        accessToken || '',
        targetFolderId,
        cleanFileName,
        blob,
        `Scanned student assessment for ${studentName} (${selectedCourse?.code || 'Coursework'})`
      );

      setCreatedPdfFile(driveFile);
      setProcessingStatus('Upload complete!');
      onToast('success', `Saved "${driveFile.name}" to Google Drive folder!`);
    } catch (err: any) {
      console.error('Scan compilation error:', err);
      onToast('error', `Error compiling or uploading scan: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishAndGrade = () => {
    if (createdPdfFile) {
      onPdfSavedToDrive(createdPdfFile, pages, studentName, assignmentTitle);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Document Scanner & PDF Drive Storage
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                  Multi-Page
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Convert photos and scans of student work into a standardized PDF and store directly in Google Drive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* Success State Screen */}
          {createdPdfFile ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-3xl border border-emerald-200 dark:border-emerald-800">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Scanned PDF Successfully Stored in Google Drive!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                  Compiled <strong className="text-slate-900 dark:text-white">{pages.length} pages</strong> for{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">{studentName}</strong> into folder{' '}
                  <strong className="underline">{activeFolder?.name || 'Scanned PDF Submissions'}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 w-full max-w-md text-left flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {createdPdfFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {createdPdfFile.size || '1.8 MB'} • {pages.length} Pages • Ready for Apple Pencil Grading
                    </p>
                  </div>
                </div>
                {createdPdfFile.webViewLink && (
                  <a
                    href={createdPdfFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors shrink-0"
                    title="Open in Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full max-w-md">
                <button
                  type="button"
                  onClick={handleFinishAndGrade}
                  className="flex-1 w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open in iPad Grading Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedPdfFile(null);
                    setPages([]);
                  }}
                  className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  Scan Another Document
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Folder Storage Target Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Destination Google Drive Folder:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {activeFolder?.name || 'Scanned PDF Submissions'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Drive Folder</span>
                  </button>
                </div>

                {showNewFolderInput && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name (e.g. Science 10 - Unit 2 Tests)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewFolder}
                      disabled={isCreatingFolder}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewFolderInput(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata Inputs: Student & Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Sophia Patel"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Assignment / Exam Title
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g. Calculus Quadratic Derivation"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Upload Dropzone / Quick Actions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Scanned Image Pages ({pages.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSamplePages}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Load Sample Work (3 Pages)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Photos/Scans</span>
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFilesSelected}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                />

                {pages.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-850/50 flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Click or drag images to scan as a multi-page PDF
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports camera photos, phone scans, JPGs, and PNGs
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {pages.map((page, index) => (
                      <div
                        key={page.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-sm flex flex-col justify-between"
                      >
                        <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageNumber}`}
                            className={`w-full h-full object-cover transition-transform duration-200 ${
                              page.grayscale ? 'grayscale' : ''
                            } ${page.contrastBoost ? 'contrast-125' : ''}`}
                            style={{ transform: `rotate(${page.rotation}deg)` }}
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white font-bold text-[10px] backdrop-blur-sm shadow">
                            Page {page.pageNumber}
                          </span>

                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRemovePage(page.id)}
                              className="p-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white backdrop-blur-sm transition-colors shadow"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Page Tools Toolbar */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRotatePage(page.id)}
                              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Rotate 90°"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleGrayscale(page.id)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                page.grayscale
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                              title="Grayscale filter"
                            >
                              B&W
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleContrast(page.id)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                page.contrastBoost
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                              title="Boost pencil contrast"
                            >
                              Pencil+
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMovePage(index, 'up')}
                              disabled={index === 0}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Left/Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePage(index, 'down')}
                              disabled={index === pages.length - 1}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Right/Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {!createdPdfFile && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              {isProcessing ? (
                <span className="flex items-center gap-2 text-blue-600 font-semibold animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  {processingStatus}
                </span>
              ) : (
                <span>
                  Destination: <strong className="text-slate-700 dark:text-slate-300">{activeFolder?.name || 'Scanned PDF Submissions'}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompileAndSave}
                disabled={isProcessing || pages.length === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>Compile & Save to Drive Folder</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
