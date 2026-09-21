/**
 * Document Renderer for Google Docs & Digital Text Submissions
 * Converts student essay text, Google Docs, and typed coursework into high-resolution
 * rendered document page SVG data URLs so the Apple Pencil canvas and document preview
 * never display a blank screen. Long submissions are split across multiple flippable pages.
 */

import { Submission } from '../types';

// ~32 wrapped lines fit the body area of one letter-size page (y 215 → ~1000, 24px line height).
const LINES_PER_PAGE = 32;

/**
 * Split text into wrapped lines for SVG rendering
 */
function wrapTextToLines(text: string, maxCharsPerLine: number = 72): string[] {
  const paragraphs = text.split('\n');
  const resultLines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      resultLines.push(''); // blank line between paragraphs
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) resultLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}

/**
 * Escape XML characters for SVG text
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a single Google-Docs-styled page SVG from a slice of already-wrapped lines.
 */
function buildDocPageSvg(
  lines: string[],
  cleanTitle: string,
  studentName: string,
  dateStr: string,
  pageNum: number,
  totalPages: number
): string {
  const isFirstPage = pageNum === 1;
  const titleText = isFirstPage ? cleanTitle : `${cleanTitle} (continued)`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 816 1056" width="816" height="1056">
    <defs>
      <!-- Subtle paper drop shadow -->
      <filter id="docShadow" x="-2%" y="-1%" width="104%" height="104%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.08"/>
      </filter>
      <!-- Google Doc header icon -->
      <linearGradient id="gdocBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4285f4"/>
        <stop offset="100%" stop-color="#1a73e8"/>
      </linearGradient>
    </defs>

    <!-- Google Docs Page Background (Standard Letter: 8.5 x 11 inch ratio) -->
    <rect width="816" height="1056" fill="#ffffff" filter="url(#docShadow)" />

    <!-- Top Accent Bar (Google Docs Branding) -->
    <rect x="0" y="0" width="816" height="6" fill="#4285f4" opacity="0.9" />

    <!-- Google Docs Top Header Tag -->
    <g transform="translate(68, 48)">
      <!-- GDoc Mini Icon -->
      <rect x="0" y="0" width="16" height="20" rx="2" fill="url(#gdocBlue)" />
      <rect x="3" y="5" width="10" height="2" fill="#ffffff" />
      <rect x="3" y="9" width="10" height="2" fill="#ffffff" />
      <rect x="3" y="13" width="7" height="2" fill="#ffffff" />
      <text x="24" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#4285f4" letter-spacing="0.8">GOOGLE DOCS ASSIGNMENT PREVIEW</text>
      <text x="590" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" fill="#70757a">${escapeXml(dateStr)}</text>
    </g>

    <!-- Document Info Header Box (Student, Course, Date) -->
    <g transform="translate(68, 86)">
      <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#202124">Student: ${escapeXml(studentName)}</text>
      <text x="0" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#5f6368">Format: Google Document (.gdoc)</text>
      <line x1="0" y1="36" x2="680" y2="36" stroke="#e8eaed" stroke-width="1.5" />
    </g>

    <!-- Document Title -->
    <g transform="translate(68, 168)">
      <text x="0" y="0" font-family="Georgia, 'Times New Roman', Times, serif" font-size="24" font-weight="bold" fill="#202124">${escapeXml(titleText)}</text>
    </g>

    <!-- Body Paragraphs (Rendered in Google Docs Style 11pt, 1.5 line height) -->
    <g transform="translate(68, 215)">
      ${lines
        .map((line, idx) => {
          if (!line) {
            return ''; // Empty spacing
          }
          return `<text x="0" y="${idx * 24}" font-family="Georgia, 'Times New Roman', Times, serif" font-size="14.5" fill="#202124" letter-spacing="0.2">${escapeXml(line)}</text>`;
        })
        .join('\n')}
    </g>

    <!-- Document Footer: Page numbering & gnspes badge -->
    <g transform="translate(68, 1010)">
      <line x1="0" y1="0" x2="680" y2="0" stroke="#dadce0" stroke-width="1" />
      <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" fill="#80868b">Google Classroom • GNSPES Education Cloud</text>
      <text x="620" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" fill="#80868b">Page ${pageNum} of ${totalPages}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate a single Google Doc styled page SVG Data URL (first/only page).
 * Kept for backwards compatibility; use createGoogleDocRenderedPages for multi-page docs.
 */
export function createGoogleDocRenderedSvg(
  text: string,
  docTitle: string,
  studentName: string,
  dateStr: string = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
): string {
  const cleanTitle = docTitle.replace(/\.gdoc$/i, '').trim();
  const wrappedLines = wrapTextToLines(text, 68).slice(0, LINES_PER_PAGE);
  return buildDocPageSvg(wrappedLines, cleanTitle, studentName, dateStr, 1, 1);
}

/**
 * Generate one Google Doc styled page SVG per LINES_PER_PAGE chunk of the text,
 * so a full multi-page essay can be flipped through and annotated page-by-page.
 */
export function createGoogleDocRenderedPages(
  text: string,
  docTitle: string,
  studentName: string,
  dateStr: string = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
): string[] {
  const cleanTitle = docTitle.replace(/\.gdoc$/i, '').trim();
  const allLines = wrapTextToLines(text, 68);

  const pageChunks: string[][] = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    pageChunks.push(allLines.slice(i, i + LINES_PER_PAGE));
  }
  if (pageChunks.length === 0) {
    pageChunks.push([]); // always render at least one page
  }

  const totalPages = pageChunks.length;
  return pageChunks.map((lines, idx) =>
    buildDocPageSvg(lines, cleanTitle, studentName, dateStr, idx + 1, totalPages)
  );
}

/**
 * Ensure a submission has at least one valid document image to render on the canvas.
 * If empty or missing, it dynamically generates the Google Doc / essay page SVGs so the canvas
 * NEVER shows a blank screen. Returns one entry per page.
 */
export function ensureSubmissionDocumentImages(submission: Submission): string[] {
  if (submission.documentImageUrls && submission.documentImageUrls.length > 0) {
    return submission.documentImageUrls;
  }

  // Generate Google Doc page images from text and title
  const dateFormatted = submission.submissionDate
    ? new Date(submission.submissionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Term 2026';

  const defaultContent =
    submission.ocrText && !submission.ocrText.startsWith('[Google Classroom Submission Attached')
      ? submission.ocrText
      : `Assignment Title: ${submission.assignmentTitle}\n\nStudent: ${submission.studentName}\nStatus: Turned In (Google Classroom)\n\nThis Google Doc submission has been imported directly from Google Classroom. It is ready for Apple Pencil markup, scoring with the course rubric, and instant grade passback.\n\nYou can annotate directly on this digital paper using the Pen, Highlighter, and Stamp tools above, or open the document directly in Google Docs with your GNSPES account.`;

  return createGoogleDocRenderedPages(
    defaultContent,
    submission.gdocTitle || submission.assignmentTitle,
    submission.studentName,
    dateFormatted
  );
}
