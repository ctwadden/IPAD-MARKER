import { jsPDF } from 'jspdf';
import { ScannedImagePage } from '../types';

export interface GeneratePdfOptions {
  title: string;
  studentName?: string;
  courseTitle?: string;
  addHeaderFooter?: boolean;
}

/**
 * Preprocess image on a temporary canvas for rotation, grayscale, and contrast boost
 */
export async function processScannedImage(
  dataUrl: string,
  rotation: number = 0,
  grayscale: boolean = false,
  contrastBoost: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Handle 90 or 270 degree rotation
      const isVerticalRotation = rotation === 90 || rotation === 270;
      canvas.width = isVerticalRotation ? img.height : img.width;
      canvas.height = isVerticalRotation ? img.width : img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Apply Grayscale or Contrast boost if requested
      if (grayscale || contrastBoost) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const contrast = contrastBoost ? 1.35 : 1.0;
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          if (grayscale) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray;
            g = gray;
            b = gray;
          }

          if (contrastBoost) {
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;
          }

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }

        ctx.putImageData(imgData, 0, 0);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = dataUrl;
  });
}

/**
 * Compile multiple scanned image pages into a high-quality PDF document
 */
export async function compileImagesToPdf(
  pages: ScannedImagePage[],
  options: GeneratePdfOptions
): Promise<{ blob: Blob; dataUrl: string; pageCount: number; sizeBytes: number }> {
  if (pages.length === 0) {
    throw new Error('At least one image page is required to compile a PDF.');
  }

  // Standard US Letter dimensions in points: 612 x 792 pt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
    compress: true,
  });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 28;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2 - (options.addHeaderFooter ? 40 : 0);

  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];

    if (index > 0) {
      doc.addPage('letter', 'portrait');
    }

    // Process image adjustments
    const processedUrl = await processScannedImage(
      page.dataUrl,
      page.rotation,
      page.grayscale,
      page.contrastBoost
    );

    // Get image dimensions to scale proportionally
    const dims = await getImageDimensions(processedUrl);
    const imgRatio = dims.width / dims.height;
    const boxRatio = printableWidth / printableHeight;

    let targetWidth = printableWidth;
    let targetHeight = printableHeight;
    let posX = margin;
    let posY = margin + (options.addHeaderFooter ? 24 : 0);

    if (imgRatio > boxRatio) {
      targetWidth = printableWidth;
      targetHeight = printableWidth / imgRatio;
      posY += (printableHeight - targetHeight) / 2;
    } else {
      targetHeight = printableHeight;
      targetWidth = printableHeight * imgRatio;
      posX += (printableWidth - targetWidth) / 2;
    }

    // Embed image
    doc.addImage(processedUrl, 'JPEG', posX, posY, targetWidth, targetHeight, undefined, 'FAST');

    // Optional Clean Header and Footer
    if (options.addHeaderFooter) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      
      // Top header
      const headerText = `${options.courseTitle || 'Assessment Document'} • ${options.studentName || 'Student Scan'} • ${options.title}`;
      doc.text(headerText, margin, margin - 8);

      // Bottom footer
      const footerText = `Page ${index + 1} of ${pages.length} — Scanned via Smart Grader Suite (GNSPES District)`;
      doc.text(footerText, pageWidth / 2, pageHeight - margin + 14, { align: 'center' });
    }
  }

  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  return {
    blob,
    dataUrl,
    pageCount: pages.length,
    sizeBytes: blob.size,
  };
}

/**
 * Helper to get natural image dimensions
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 1100 });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 1100 });
    };
    img.src = dataUrl;
  });
}
