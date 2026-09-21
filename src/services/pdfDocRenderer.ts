/**
 * PDF Document Renderer
 *
 * Exports a student's Google Doc (or uploaded PDF) from Drive as a PDF, then
 * rasterizes each page to a PNG data URL with pdf.js. Those page images become
 * the flat background the Apple Pencil canvas draws on — so the teacher marks on
 * the REAL, fully-formatted document (images, tables, layout), not a text stand-in.
 */

import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a bundled worker URL.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Render a Drive file to an array of PNG data URLs (one per page).
 * Returns [] when the file isn't PDF-renderable (e.g. an image or slides) or on error,
 * so the caller can fall back to the text renderer.
 *
 * @param scale higher = crisper (and heavier). 2 is a good balance for marking.
 */
export async function renderDriveDocToPageImages(
  accessToken: string,
  fileId: string,
  scale: number = 2
): Promise<string[]> {
  try {
    // 1. Figure out how to fetch it.
    let mimeType = 'application/vnd.google-apps.document';
    try {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json().catch(() => ({}));
        if (meta.mimeType) mimeType = meta.mimeType;
      }
    } catch {
      /* default to Google Doc export */
    }

    let url: string;
    if (mimeType === 'application/vnd.google-apps.document') {
      // Native Google Doc → export as PDF (preserves formatting)
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    } else if (mimeType === 'application/pdf') {
      // Already a PDF → download raw
      url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
    } else {
      // Slides/sheets/images/docx: not handled here.
      return [];
    }

    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return [];
    const data = await res.arrayBuffer();
    if (!data || data.byteLength === 0) return [];

    // 2. Rasterize each page.
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // Cast: pdf.js render-params typing differs between versions (canvasContext vs canvas).
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      images.push(canvas.toDataURL('image/png'));

      // Free per-page resources.
      page.cleanup();
    }

    await pdf.destroy();
    return images;
  } catch (err) {
    console.warn('PDF render failed, will fall back to text page renderer:', err);
    return [];
  }
}
