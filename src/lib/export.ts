'use client';

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/** Client-side invoice export.
 *
 *  Why html2canvas-pro (not html2canvas/html2pdf.js): Tailwind v4 emits
 *  modern CSS color functions (oklch/color-mix) which legacy html2canvas
 *  cannot parse — it throws and the download silently never happens.
 *  html2canvas-pro supports them; jsPDF assembles the PDF pages.
 */

async function renderPaper(el: HTMLElement) {
  // Wait for the Persian webfont so canvas text isn't fallback-rendered.
  try {
    await document.fonts.ready;
  } catch {
    /* older engines — proceed anyway */
  }
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
}

function download(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportInvoicePNG(el: HTMLElement, filename: string): Promise<void> {
  let canvas;
  try {
    canvas = await renderPaper(el);
  } catch (e) {
    console.error('[export] png render failed:', e);
    throw new Error('ساخت تصویر ناموفق بود؛ دوباره امتحان کن.');
  }
  download(canvas.toDataURL('image/png'), filename.endsWith('.png') ? filename : `${filename}.png`);
}

export async function exportInvoicePDF(el: HTMLElement, filename: string): Promise<void> {
  let canvas;
  try {
    canvas = await renderPaper(el);
  } catch (e) {
    console.error('[export] pdf render failed:', e);
    throw new Error('ساخت PDF ناموفق بود؛ دوباره امتحان کن.');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const name = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (imgH <= pageH - margin * 2) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgW, imgH);
    pdf.save(name);
    return;
  }

  // Multi-page: slice the canvas into A4-height strips.
  const pxPerMm = canvas.width / imgW;
  const stripPx = Math.floor((pageH - margin * 2) * pxPerMm);
  let rendered = 0;
  let page = 0;
  while (rendered < canvas.height) {
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.min(stripPx, canvas.height - rendered);
    const ctx = slice.getContext('2d');
    if (!ctx) throw new Error('ساخت PDF ناموفق بود؛ دوباره امتحان کن.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, rendered, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (page > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.95),
      'JPEG',
      margin,
      margin,
      imgW,
      (slice.height * imgW) / canvas.width,
    );
    rendered += slice.height;
    page += 1;
  }
  pdf.save(name);
}
