import React, { useState, useEffect } from 'react';
import { Submission, Annotation } from '../types';
import { GradingCanvas } from './GradingCanvas';
import { User, switchGoogleAccount, getAccessToken } from '../lib/googleAuth';
import { renderDriveDocToPageImages } from '../services/pdfDocRenderer';
import { ensureSubmissionDocumentImages } from '../services/documentRenderer';
import {
  FileText,
  ExternalLink,
  Eye,
  PenTool,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Globe,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface GoogleDocViewerProps {
  submission: Submission;
  authUser?: User | null;
  onUpdateSubmission: (updated: Submission) => void;
  onOpenClassroomModal?: () => void;
}

export const GoogleDocViewer: React.FC<GoogleDocViewerProps> = ({
  submission,
  authUser,
  onUpdateSubmission,
  onOpenClassroomModal,
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'embed_preview' | 'doc_reader'>('canvas');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);

  // Real document pages (rendered from the actual Doc/PDF) for the marking canvas.
  const [pdfPages, setPdfPages] = useState<string[] | null>(null);
  const [isRenderingPdf, setIsRenderingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const docId = submission.driveFileId || (submission.alternateLink ? submission.alternateLink.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] : '');
  const alternateLink = submission.alternateLink || (docId ? `https://docs.google.com/document/d/${docId}/edit` : undefined);
  
  // Prefer direct preview embed
  const previewUrl = submission.gdocPreviewUrl || (docId ? `https://docs.google.com/document/d/${docId}/preview` : undefined);

  // Link that explicitly forces cwadden@gnspes.ca in Google's authuser parameter
  const gnspesDeepLink = alternateLink
    ? `${alternateLink}${alternateLink.includes('?') ? '&' : '?'}authuser=cwadden@gnspes.ca`
    : undefined;

  const isPersonalAccount = authUser?.email && !authUser.email.endsWith('@gnspes.ca');

  // Reset rendered pages when we switch to a different student's submission.
  useEffect(() => {
    setPdfPages(null);
    setCurrentPage(0);
    setPdfError(false);
    setIsRenderingPdf(false);
  }, [submission.id]);

  // When the marking canvas is opened, render the REAL document to page images
  // so the teacher marks on the actual formatted pages (not a text stand-in).
  useEffect(() => {
    if (activeTab !== 'canvas') return;
    if (!docId) return;
    if (pdfPages !== null || isRenderingPdf) return;

    let cancelled = false;
    (async () => {
      setIsRenderingPdf(true);
      setPdfError(false);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('No Google access token available');
        const images = await renderDriveDocToPageImages(token, docId);
        if (cancelled) return;
        if (images.length > 0) {
          setPdfPages(images);
          // Cache onto the submission so other views reuse the real pages.
          onUpdateSubmission({ ...submission, documentImageUrls: images });
        } else {
          setPdfPages([]); // signals "tried, nothing usable" → fall back to text pages
          setPdfError(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Could not render real document pages:', err);
          setPdfPages([]);
          setPdfError(true);
        }
      } finally {
        if (!cancelled) setIsRenderingPdf(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, docId, pdfPages, isRenderingPdf]);

  // Pages to mark on: real rendered pages when available, else the text fallback.
  const markingPages =
    pdfPages && pdfPages.length > 0 ? pdfPages : ensureSubmissionDocumentImages(submission);
  const totalPages = markingPages.length || 1;
  const safePage = Math.min(Math.max(currentPage, 0), totalPages - 1);

  const handleSwitchToGnspes = async () => {
    setIsSwitchingAccount(true);
    try {
      await switchGoogleAccount('cwadden@gnspes.ca');
    } catch (err: any) {
      console.warn('Switch account warning:', err);
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const wordCount = submission.ocrText ? submission.ocrText.trim().split(/\s+/).length : 0;
  const paragraphCount = submission.ocrText ? submission.ocrText.split('\n\n').filter(Boolean).length : 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Account & Domain Diagnostic Notice (if signed in as macchady@gmail.com) */}
      {isPersonalAccount && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Connected with personal Google account: <span className="font-mono underline">{authUser?.email}</span>
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                Google Classroom assignments from <span className="font-semibold">gnspes.ca</span> require GNSPES school domain permissions. If the embedded preview shows permission required, open the document directly or connect with your teacher account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSwitchToGnspes}
              disabled={isSwitchingAccount}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isSwitchingAccount ? 'animate-spin' : ''}`} />
              <span>{isSwitchingAccount ? 'Connecting...' : 'Connect cwadden@gnspes.ca'}</span>
            </button>

            {alternateLink && (
              <a
                href={gnspesDeepLink || alternateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-bold text-xs border border-amber-300 dark:border-amber-700 transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3 text-amber-600" />
                <span>Open in GNSPES Tab</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Sub-toolbar: View Modes (Apple Pencil vs Interactive GDoc vs Reader) + Open in Docs */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Apple Pencil Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('embed_preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'embed_preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Google Doc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doc_reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'doc_reader'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Document Reader</span>
          </button>
        </div>

        {/* Action Controls & External Direct Link */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{paragraphCount} paragraphs</span>
          </div>

          {alternateLink ? (
            <a
              href={gnspesDeepLink || alternateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              title="Opens in a new browser tab directly authenticated with cwadden@gnspes.ca"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Docs</span>
            </a>
          ) : (
            <span className="text-xs text-slate-400">Classroom Google Doc Attached</span>
          )}
        </div>
      </div>

      {/* VIEW 1: Apple Pencil & Stylus Marking Canvas (Directly on top of the REAL rendered Doc page) */}
      {activeTab === 'canvas' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Google Doc Markup Canvas — {submission.gdocTitle || submission.assignmentTitle}
            </h3>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {isRenderingPdf && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rendering real document…
                </span>
              )}
              {!isRenderingPdf && pdfError && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Showing text version (couldn't render the original)
                </span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={safePage <= 0}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 font-medium tabular-nums whitespace-nowrap">
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <GradingCanvas
            key={`page-${safePage}`}
            documentImageUrl={markingPages[safePage] || ''}
            annotations={submission.annotations}
            pageIndex={safePage}
            onAnnotationsChange={(updatedAnn: Annotation[]) => {
              onUpdateSubmission({
                ...submission,
                annotations: updatedAnn,
                draftSavedAt: new Date().toISOString(),
              });
            }}
          />
        </div>
      )}

      {/* VIEW 2: Interactive Google Doc Preview (iframe with fallback) */}
      {activeTab === 'embed_preview' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Google Docs Embedded Preview
              </h3>
            </div>
            {alternateLink && (
              <a
                href={gnspesDeepLink || alternateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Pop-out to Full Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {previewUrl && !iframeError ? (
            <div className="relative w-full h-[650px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
              <iframe
                src={previewUrl}
                title="Google Docs Document Preview"
                className="w-full h-full border-0"
                onError={() => setIframeError(true)}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          ) : (
            <div className="w-full h-[450px] rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Google Docs Secure Preview
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Google protects student work in domain <span className="font-semibold text-slate-700 dark:text-slate-200">gnspes.ca</span> by restricting third-party cookie access in iframes. You can open the live document directly with your GNSPES account in a new tab, or use the Apple Pencil Markup tab.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {alternateLink && (
                  <a
                    href={gnspesDeepLink || alternateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Google Docs (cwadden@gnspes.ca)</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('canvas')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
                >
                  Switch to Apple Pencil Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Clean Document Reader Layout */}
      {activeTab === 'doc_reader' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
          {/* Header of paper */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Student: <strong className="text-slate-900 dark:text-white">{submission.studentName}</strong></span>
              <span>Classroom Course Work: <strong className="text-slate-900 dark:text-white">{submission.assignmentTitle}</strong></span>
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              {submission.gdocTitle || submission.assignmentTitle}
            </h2>
          </div>

          {/* Formatted body text */}
          <div className="max-w-3xl mx-auto w-full py-4 text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 space-y-4 select-text">
            {submission.ocrText.split('\n\n').map((paragraph, pIdx) => (
              <p key={pIdx} className="indent-6 leading-7">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Footer stats */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Readability: High School Standard • Lexile Score: 1040L</span>
            <span>Estimated Reading Time: {Math.max(1, Math.ceil(wordCount / 200))} min</span>
          </div>
        </div>
      )}
    </div>
  );
};
