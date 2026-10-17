import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, degrees } from 'pdf-lib';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { jsPDF } from 'jspdf';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Helper to download Blob as file in browser
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Load PDF Document from ArrayBuffer, Uint8Array or URL using PDF.js
 */
export async function loadPdfDocument(source) {
  let loadingTask;
  if (typeof source === 'string') {
    loadingTask = pdfjsLib.getDocument(source);
  } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
    loadingTask = pdfjsLib.getDocument({ data: source });
  } else {
    throw new Error('Unsupported PDF data format.');
  }
  return await loadingTask.promise;
}

/**
 * Render a single PDF page directly to a canvas element
 */
export async function renderPdfPageToCanvas(pdfDoc, pageNum, canvas, scale = 1.2) {
  if (!pdfDoc || !canvas) return;

  // Cancel any prior in-flight render task on this canvas and wait for cancellation to settle
  if (canvas._activeRenderTask) {
    try {
      const priorTask = canvas._activeRenderTask;
      canvas._activeRenderTask = null;
      priorTask.cancel();
      await priorTask.promise.catch(() => {});
    } catch { /* ignore */ }
  }

  if (!canvas) return;

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    canvas._activeRenderTask = renderTask;

    await renderTask.promise;
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.warn('PDF page render warning:', err);
    }
  } finally {
    if (canvas._activeRenderTask) {
      canvas._activeRenderTask = null;
    }
  }
}


/**
 * PDF to DOCX Conversion
 * Extracts structured text from PDF pages and builds a clean .docx document
 */
export async function convertPdfToDocx(arrayBuffer, onProgress = () => {}) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const docxParagraphs = [];
  let totalWordCount = 0;
  let hasExtractedText = false;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress({ current: pageNum, total: numPages, stage: `Extracting page ${pageNum} of ${numPages}` });
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    if (pageNum > 1) {
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '', break: 1 })],
          pageBreakBefore: true,
        })
      );
    }

    // Group text items by Y coordinate to form lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      hasExtractedText = true;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push(item);
    }

    // Sort descending by Y (top of page first)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    if (sortedY.length === 0) {
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${pageNum}: No selectable text found. Scanned or image-only content.]`,
              italics: true,
              color: '888888',
            }),
          ],
        })
      );
    } else {
      for (const y of sortedY) {
        const lineItems = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = lineItems.map((item) => item.str).join(' ');
        const fontSize = lineItems[0]?.height || 12;

        totalWordCount += lineText.split(/\s+/).filter(Boolean).length;

        if (fontSize >= 18) {
          docxParagraphs.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: lineText, bold: true, size: 32 })],
              spacing: { before: 240, after: 120 },
            })
          );
        } else if (fontSize >= 14) {
          docxParagraphs.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: lineText, bold: true, size: 28 })],
              spacing: { before: 180, after: 90 },
            })
          );
        } else {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: lineText, size: 22 })],
              spacing: { after: 100 },
            })
          );
        }
      }
    }
  }

  // If no selectable text across whole document
  if (!hasExtractedText) {
    docxParagraphs.unshift(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: 'Notice: Scanned or Rasterized PDF',
            bold: true,
            color: 'AA3333',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This document contains rasterized/scanned page images without embedded text layers. Pure client-side OCR is excluded for privacy and bundle-size reasons.',
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return {
    blob,
    numPages,
    totalWordCount,
    isScannedWarning: !hasExtractedText,
  };
}

/**
 * DOCX to PDF Conversion
 * Parses DOCX into structured HTML, then renders clean PDF using jsPDF
 */
export async function convertDocxToPdf(arrayBuffer, onProgress = () => {}) {
  onProgress({ stage: 'Reading DOCX document...' });
  const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = mammothResult.value;

  onProgress({ stage: 'Generating PDF...' });
  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const pageWidth = pdfDoc.internal.pageSize.getWidth();
  const pageHeight = pdfDoc.internal.pageSize.getHeight();
  const margin = 50;
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const children = Array.from(tempDiv.children);

  if (children.length === 0 && tempDiv.textContent.trim()) {
    children.push(tempDiv);
  }

  for (const el of children) {
    const tagName = el.tagName ? el.tagName.toLowerCase() : 'p';
    const text = el.textContent.trim();
    if (!text) continue;

    let fontSize = 11;
    let isBold = false;
    let isItalic = false;
    let spacingAfter = 10;

    if (tagName === 'h1') {
      fontSize = 18;
      isBold = true;
      spacingAfter = 16;
    } else if (tagName === 'h2') {
      fontSize = 15;
      isBold = true;
      spacingAfter = 14;
    } else if (tagName === 'h3') {
      fontSize = 13;
      isBold = true;
      spacingAfter = 12;
    } else if (tagName === 'blockquote') {
      isItalic = true;
      fontSize = 10;
    }

    pdfDoc.setFont('helvetica', isBold ? 'bold' : isItalic ? 'italic' : 'normal');
    pdfDoc.setFontSize(fontSize);

    const lines = pdfDoc.splitTextToSize(text, maxLineWidth);
    const lineHeight = fontSize * 1.35;

    for (const line of lines) {
      if (cursorY + lineHeight > pageHeight - margin) {
        pdfDoc.addPage();
        cursorY = margin;
      }
      pdfDoc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
    cursorY += spacingAfter;
  }

  const pdfBlob = pdfDoc.output('blob');
  return {
    blob: pdfBlob,
    htmlPreview: html,
    messages: mammothResult.messages,
  };
}

/**
 * Load DOCX file into HTML for editing
 */
export async function loadDocxForEditing(arrayBuffer) {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return {
    html: result.value || '<p>Start typing your content here...</p>',
    messages: result.messages,
  };
}

/**
 * Export HTML string back to DOCX
 */
export async function exportHtmlToDocx(htmlContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const paragraphs = [];
  const nodes = Array.from(tempDiv.childNodes);

  for (const node of nodes) {
    const text = node.textContent?.trim();
    if (!text) continue;

    const tagName = node.tagName?.toLowerCase();
    if (tagName === 'h1') {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text, bold: true, size: 32 })],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (tagName === 'h2') {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text, bold: true, size: 28 })],
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (tagName === 'h3') {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text, bold: true, size: 24 })],
          spacing: { before: 120, after: 60 },
        })
      );
    } else if (tagName === 'ul' || tagName === 'ol') {
      const lis = Array.from(node.querySelectorAll('li'));
      for (const li of lis) {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: li.textContent.trim(), size: 22 })],
            spacing: { after: 60 },
          })
        );
      }
    } else {
      // Normal paragraph or div
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22 })],
          spacing: { after: 100 },
        })
      );
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: 'Empty document', size: 22 })] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  return await Packer.toBlob(doc);
}

/**
 * PDF Page Operations via pdf-lib
 */
export async function mergePdfFiles(arrayBuffers) {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of arrayBuffers) {
    const doc = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function rotatePdfPages(arrayBuffer, angle = 90, selectedPages = 'all') {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();

  let targetIndices = [];
  if (selectedPages === 'all') {
    targetIndices = pdfDoc.getPageIndices();
  } else {
    // Parse e.g. "1, 3-5"
    const parsed = parsePageRange(selectedPages, pageCount);
    targetIndices = parsed.map((p) => p - 1);
  }

  for (const index of targetIndices) {
    if (index >= 0 && index < pageCount) {
      const page = pdfDoc.getPage(index);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function extractPdfPages(arrayBuffer, pageRangeStr) {
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = srcDoc.getPageCount();
  const targetPages = parsePageRange(pageRangeStr, pageCount);

  if (targetPages.length === 0) {
    throw new Error('Please specify valid page numbers to extract.');
  }

  const newDoc = await PDFDocument.create();
  const indices = targetPages.map((p) => p - 1).filter((i) => i >= 0 && i < pageCount);
  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function removePdfPages(arrayBuffer, pageRangeStr) {
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = srcDoc.getPageCount();
  const pagesToRemove = new Set(parsePageRange(pageRangeStr, pageCount));

  if (pagesToRemove.size === 0) {
    throw new Error('Please specify valid page numbers to remove.');
  }
  if (pagesToRemove.size >= pageCount) {
    throw new Error('Cannot remove all pages from the document.');
  }

  const newDoc = await PDFDocument.create();
  const indicesToKeep = [];
  for (let i = 1; i <= pageCount; i++) {
    if (!pagesToRemove.has(i)) {
      indicesToKeep.push(i - 1);
    }
  }

  const copiedPages = await newDoc.copyPages(srcDoc, indicesToKeep);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Render PDF Pages to Image Data URLs
 */
export async function renderPdfToImages(arrayBuffer, format = 'image/png', onProgress = () => {}) {
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;
  const images = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress({ current: pageNum, total: numPages, stage: `Rendering page ${pageNum} of ${numPages}` });
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL(format, 0.92);
    images.push({
      pageNumber: pageNum,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return images;
}

/**
 * Convert Image files to Single PDF
 */
export async function convertImagesToPdf(imageItems, options = { margin: 'small', orientation: 'auto' }) {
  const pdfDoc = await PDFDocument.create();

  const marginMap = {
    none: 0,
    small: 20,
    normal: 40,
  };
  const margin = marginMap[options.margin] ?? 20;

  for (const item of imageItems) {
    let embeddedImage;
    let imgWidth = item.width;
    let imgHeight = item.height;

    // Convert file or dataUrl to Uint8Array
    let imgBytes;
    if (item.file) {
      imgBytes = await item.file.arrayBuffer();
    } else if (item.dataUrl) {
      const base64 = item.dataUrl.split(',')[1];
      const binaryStr = atob(base64);
      imgBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        imgBytes[i] = binaryStr.charCodeAt(i);
      }
    }

    const type = item.file ? item.file.type : 'image/jpeg';

    try {
      if (type.includes('png')) {
        embeddedImage = await pdfDoc.embedPng(imgBytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imgBytes);
      }
    } catch {
      // Fallback: draw image to canvas and export as JPEG
      const dataUrl = await fileToJpegDataUrl(item.file);
      const base64 = dataUrl.split(',')[1];
      const binaryStr = atob(base64);
      const fallbackBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        fallbackBytes[i] = binaryStr.charCodeAt(i);
      }
      embeddedImage = await pdfDoc.embedJpg(fallbackBytes);
    }

    const dims = embeddedImage.scale(1);
    imgWidth = dims.width;
    imgHeight = dims.height;

    let pageWidth = imgWidth + margin * 2;
    let pageHeight = imgHeight + margin * 2;

    if (options.orientation === 'portrait' && pageWidth > pageHeight) {
      // Scale down to fit portrait A4 (595 x 842 pt)
      const scale = Math.min((595 - margin * 2) / imgWidth, (842 - margin * 2) / imgHeight);
      pageWidth = 595;
      pageHeight = 842;
      const drawW = imgWidth * scale;
      const drawH = imgHeight * scale;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: (pageWidth - drawW) / 2,
        y: (pageHeight - drawH) / 2,
        width: drawW,
        height: drawH,
      });
      continue;
    } else if (options.orientation === 'landscape' && pageHeight > pageWidth) {
      const scale = Math.min((842 - margin * 2) / imgWidth, (595 - margin * 2) / imgHeight);
      pageWidth = 842;
      pageHeight = 595;
      const drawW = imgWidth * scale;
      const drawH = imgHeight * scale;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: (pageWidth - drawW) / 2,
        y: (pageHeight - drawH) / 2,
        width: drawW,
        height: drawH,
      });
      continue;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: margin,
      y: margin,
      width: imgWidth,
      height: imgHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Utility: Convert file to JPEG DataURL via canvas
 */
function fileToJpegDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility: Parse page range strings like "1, 3-5, 8"
 */
function parsePageRange(rangeStr, maxPages) {
  const pages = new Set();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let i = min; i <= max; i++) pages.add(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
