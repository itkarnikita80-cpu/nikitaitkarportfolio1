import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, FilePlus, Edit3, Layers, Image as ImageIcon,
  Download, Upload, AlertCircle, CheckCircle2, ShieldCheck,
  RefreshCw, Trash2, ArrowUp, ArrowDown, RotateCw, Sparkles,
  Info, ExternalLink, Scissors, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Eye, Check, FileCheck
} from 'lucide-react';
import {
  convertPdfToDocx, convertDocxToPdf, loadDocxForEditing,
  exportHtmlToDocx, mergePdfFiles, rotatePdfPages,
  extractPdfPages, removePdfPages, renderPdfToImages,
  convertImagesToPdf, downloadBlob, loadPdfDocument,
  renderPdfPageToCanvas
} from '../utils/documentUtils';

export default function DocumentTools() {
  const [activeTab, setActiveTab] = useState('pdf-viewer'); // Default to PDF & Resume Viewer so users immediately see their uploaded PDFs!
  const [status, setStatus] = useState({ state: 'idle', message: '', progress: 0 });
  const [error, setError] = useState(null);

  // ─── PDF & Resume Viewer State ──────────────────────────────────────────────
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerPdfDoc, setViewerPdfDoc] = useState(null);
  const [viewerPageNum, setViewerPageNum] = useState(1);
  const [viewerTotalPages, setViewerTotalPages] = useState(0);
  const [viewerScale, setViewerScale] = useState(1.1);
  const [viewerBlobUrl, setViewerBlobUrl] = useState(null);
  const [isResume, setIsResume] = useState(false);
  const viewerCanvasRef = useRef(null);
  const blobUrlRef = useRef(null);

  // ─── PDF to DOCX State ──────────────────────────────────────────────────────
  const [pdfDocxFile, setPdfDocxFile] = useState(null);
  const [pdfDocxResult, setPdfDocxResult] = useState(null);
  const [pdfDocxPreviewUrl, setPdfDocxPreviewUrl] = useState(null);
  const pdfDocxCanvasRef = useRef(null);

  // ─── DOCX to PDF State ──────────────────────────────────────────────────────
  const [docxPdfFile, setDocxPdfFile] = useState(null);
  const [docxPdfResult, setDocxPdfResult] = useState(null);

  // ─── DOCX Editor State ──────────────────────────────────────────────────────
  const [editorFile, setEditorFile] = useState(null);
  const [editorHtml, setEditorHtml] = useState('<p>Upload a .docx file or begin typing here...</p>');
  const [wordCount, setWordCount] = useState(0);
  const editorRef = useRef(null);

  // ─── PDF Page Tools State ───────────────────────────────────────────────────
  const [pageToolsSubTab, setPageToolsSubTab] = useState('merge');
  const [mergeFiles, setMergeFiles] = useState([]);
  const [singlePdfFile, setSinglePdfFile] = useState(null);
  const [singlePdfPageCount, setSinglePdfPageCount] = useState(0);
  const [rotateAngle, setRotateAngle] = useState(90);
  const [rotatePagesOption, setRotatePagesOption] = useState('all');
  const [rotateCustomPages, setRotateCustomPages] = useState('');
  const [extractPagesStr, setExtractPagesStr] = useState('');
  const [removePagesStr, setRemovePagesStr] = useState('');
  const [pageToolResult, setPageToolResult] = useState(null);

  // ─── PDF to Images State ────────────────────────────────────────────────────
  const [pdfImgFile, setPdfImgFile] = useState(null);
  const [pdfImages, setPdfImages] = useState([]);
  const [imgFormat, setImgFormat] = useState('image/png');

  // ─── Images to PDF State ────────────────────────────────────────────────────
  const [imagesList, setImagesList] = useState([]);
  const [imgPdfOptions, setImgPdfOptions] = useState({ margin: 'small', orientation: 'auto' });
  const [imgPdfResult, setImgPdfResult] = useState(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Helper reset
  const resetStatus = () => {
    setStatus({ state: 'idle', message: '', progress: 0 });
    setError(null);
  };

  // ─── 1. PDF VIEWER & RESUME INSPECTOR ───────────────────────────────────────
  const handleLoadPdfForViewer = async (fileOrUrl, customFilename = null) => {
    setError(null);
    setStatus({ state: 'processing', message: 'Loading PDF document...', progress: 30 });

    try {
      let doc;
      let filename;
      let fileSize = '';
      let isResumeDoc = false;
      let objectUrl = null;

      if (typeof fileOrUrl === 'string') {
        // Loaded from URL (e.g. Nikita-Itkar-Resume.pdf)
        filename = customFilename || fileOrUrl.split('/').pop();
        const res = await fetch(fileOrUrl);
        if (!res.ok) throw new Error('Could not fetch PDF file.');
        const buffer = await res.arrayBuffer();
        doc = await loadPdfDocument(buffer);
        fileSize = (buffer.byteLength / 1024).toFixed(1) + ' KB';
        const blob = new Blob([buffer], { type: 'application/pdf' });
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        isResumeDoc = true;
        setViewerFile({ name: filename, size: fileSize, blob });
      } else {
        // File object from input
        const file = fileOrUrl;
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          throw new Error('Invalid file format. Please select a valid PDF file (.pdf).');
        }

        filename = file.name;
        fileSize = (file.size / 1024).toFixed(1) + ' KB';
        isResumeDoc = filename.toLowerCase().includes('resume') || filename.toLowerCase().includes('cv');

        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        objectUrl = URL.createObjectURL(file);
        blobUrlRef.current = objectUrl;

        const buffer = await file.arrayBuffer();
        doc = await loadPdfDocument(buffer);
        setViewerFile({ name: filename, size: fileSize, blob: file });
      }

      setViewerBlobUrl(objectUrl);
      setViewerPdfDoc(doc);
      setViewerTotalPages(doc.numPages);
      setViewerPageNum(1);
      setIsResume(isResumeDoc);
      setStatus({ state: 'success', message: `Loaded ${filename} (${doc.numPages} pages)`, progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to open PDF. File may be corrupted or format is unsupported.');
      setStatus({ state: 'error', message: 'Failed to load PDF.', progress: 0 });
    }
  };

  // Re-render viewer canvas when page or scale changes
  useEffect(() => {
    if (viewerPdfDoc && viewerCanvasRef.current) {
      renderPdfPageToCanvas(viewerPdfDoc, viewerPageNum, viewerCanvasRef.current, viewerScale);
    }
  }, [viewerPdfDoc, viewerPageNum, viewerScale]);

  // ─── 2. PDF TO DOCX ────────────────────────────────────────────────────────
  const handlePdfToDocx = async (file) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file type. Please upload a PDF file (.pdf).');
      return;
    }

    setPdfDocxFile(file);
    setPdfDocxResult(null);
    setError(null);
    setStatus({ state: 'processing', message: 'Reading PDF pages...', progress: 15 });

    try {
      const buffer = await file.arrayBuffer();
      // Render quick preview
      const previewDoc = await loadPdfDocument(buffer);
      setTimeout(() => {
        if (pdfDocxCanvasRef.current) {
          renderPdfPageToCanvas(previewDoc, 1, pdfDocxCanvasRef.current, 0.85);
        }
      }, 50);

      const result = await convertPdfToDocx(buffer, (prog) => {
        if (prog.total) {
          const pct = Math.round((prog.current / prog.total) * 90);
          setStatus({ state: 'processing', message: prog.stage, progress: pct });
        }
      });

      setPdfDocxResult(result);
      setStatus({ state: 'success', message: 'Conversion completed successfully!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to convert PDF to DOCX.');
      setStatus({ state: 'error', message: 'Conversion failed.', progress: 0 });
    }
  };

  // ─── 3. DOCX TO PDF ────────────────────────────────────────────────────────
  const handleDocxToPdf = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Please upload a valid Microsoft Word document (.docx).');
      return;
    }

    setDocxPdfFile(file);
    setDocxPdfResult(null);
    setError(null);
    setStatus({ state: 'processing', message: 'Parsing DOCX typography...', progress: 20 });

    try {
      const buffer = await file.arrayBuffer();
      const result = await convertDocxToPdf(buffer, (prog) => {
        setStatus({ state: 'processing', message: prog.stage, progress: 60 });
      });

      setDocxPdfResult(result);
      setStatus({ state: 'success', message: 'PDF generated successfully!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to convert DOCX to PDF.');
      setStatus({ state: 'error', message: 'Conversion failed.', progress: 0 });
    }
  };

  // ─── 4. DOCX EDITOR ────────────────────────────────────────────────────────
  const handleLoadDocxEditor = async (file) => {
    if (!file) return;
    setEditorFile(file);
    setError(null);
    setStatus({ state: 'processing', message: 'Loading document into editor...', progress: 30 });

    try {
      const buffer = await file.arrayBuffer();
      const { html } = await loadDocxForEditing(buffer);
      setEditorHtml(html);
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        updateWordCount(editorRef.current.innerText);
      }
      setStatus({ state: 'success', message: 'Document loaded into editor.', progress: 100 });
    } catch (err) {
      console.error(err);
      setError('Could not load DOCX content into editor.');
      setStatus({ state: 'error', message: 'Load failed.', progress: 0 });
    }
  };

  const updateWordCount = (text) => {
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
  };

  const executeEditorCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
      updateWordCount(editorRef.current.innerText);
    }
  };

  const handleExportEditorDocx = async () => {
    if (!editorRef.current) return;
    try {
      setStatus({ state: 'processing', message: 'Compiling DOCX document...', progress: 40 });
      const blob = await exportHtmlToDocx(editorRef.current.innerHTML);
      const filename = editorFile ? editorFile.name.replace(/\.docx$/i, '-edited.docx') : 'document-edited.docx';
      downloadBlob(blob, filename);
      setStatus({ state: 'success', message: 'DOCX exported and downloaded!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError('Failed to export DOCX.');
    }
  };

  const handleExportEditorPdf = async () => {
    if (!editorRef.current) return;
    try {
      setStatus({ state: 'processing', message: 'Compiling PDF document...', progress: 40 });
      const docxBlob = await exportHtmlToDocx(editorRef.current.innerHTML);
      const buffer = await docxBlob.arrayBuffer();
      const { blob } = await convertDocxToPdf(buffer);
      const filename = editorFile ? editorFile.name.replace(/\.docx$/i, '-edited.pdf') : 'document-edited.pdf';
      downloadBlob(blob, filename);
      setStatus({ state: 'success', message: 'PDF exported and downloaded!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError('Failed to export PDF.');
    }
  };

  // ─── 5. PDF PAGE TOOLS ─────────────────────────────────────────────────────
  const handleSinglePdfUpload = async (file) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document (.pdf).');
      return;
    }
    setSinglePdfFile(file);
    setPageToolResult(null);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const doc = await loadPdfDocument(buffer);
      setSinglePdfPageCount(doc.numPages);
    } catch (err) {
      console.error(err);
      setError('Could not read PDF metadata.');
    }
  };

  const handleMergePdfs = async () => {
    if (mergeFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    setError(null);
    setStatus({ state: 'processing', message: 'Merging PDF files...', progress: 40 });
    try {
      const buffers = await Promise.all(mergeFiles.map((f) => f.arrayBuffer()));
      const mergedBlob = await mergePdfFiles(buffers);
      setPageToolResult({ blob: mergedBlob, filename: 'merged-document.pdf', type: 'merge' });
      setStatus({ state: 'success', message: 'PDFs merged successfully!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to merge PDFs.');
      setStatus({ state: 'error', message: 'Merge failed.', progress: 0 });
    }
  };

  const handleRotatePdf = async () => {
    if (!singlePdfFile) return;
    setError(null);
    setStatus({ state: 'processing', message: 'Rotating pages...', progress: 40 });
    try {
      const buffer = await singlePdfFile.arrayBuffer();
      const range = rotatePagesOption === 'all' ? 'all' : rotateCustomPages;
      const rotatedBlob = await rotatePdfPages(buffer, rotateAngle, range);
      setPageToolResult({
        blob: rotatedBlob,
        filename: singlePdfFile.name.replace(/\.pdf$/i, '-rotated.pdf'),
        type: 'rotate',
      });
      setStatus({ state: 'success', message: 'Pages rotated successfully!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to rotate PDF pages.');
      setStatus({ state: 'error', message: 'Rotate failed.', progress: 0 });
    }
  };

  const handleExtractPdf = async () => {
    if (!singlePdfFile) return;
    if (!extractPagesStr.trim()) {
      setError('Please enter page numbers to extract (e.g. 1, 3-5).');
      return;
    }
    setError(null);
    setStatus({ state: 'processing', message: 'Extracting pages...', progress: 40 });
    try {
      const buffer = await singlePdfFile.arrayBuffer();
      const extractedBlob = await extractPdfPages(buffer, extractPagesStr);
      setPageToolResult({
        blob: extractedBlob,
        filename: singlePdfFile.name.replace(/\.pdf$/i, '-extracted.pdf'),
        type: 'extract',
      });
      setStatus({ state: 'success', message: 'Pages extracted successfully!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract pages.');
      setStatus({ state: 'error', message: 'Extraction failed.', progress: 0 });
    }
  };

  const handleRemovePdfPages = async () => {
    if (!singlePdfFile) return;
    if (!removePagesStr.trim()) {
      setError('Please enter page numbers to remove (e.g. 2, 4).');
      return;
    }
    setError(null);
    setStatus({ state: 'processing', message: 'Removing pages...', progress: 40 });
    try {
      const buffer = await singlePdfFile.arrayBuffer();
      const modifiedBlob = await removePdfPages(buffer, removePagesStr);
      setPageToolResult({
        blob: modifiedBlob,
        filename: singlePdfFile.name.replace(/\.pdf$/i, '-pages-removed.pdf'),
        type: 'remove',
      });
      setStatus({ state: 'success', message: 'Pages removed successfully!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to remove pages.');
      setStatus({ state: 'error', message: 'Removal failed.', progress: 0 });
    }
  };

  // ─── 6. PDF TO IMAGES ──────────────────────────────────────────────────────
  const handlePdfToImages = async (file) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    setPdfImgFile(file);
    setPdfImages([]);
    setError(null);
    setStatus({ state: 'processing', message: 'Rendering pages to images...', progress: 15 });

    try {
      const buffer = await file.arrayBuffer();
      const images = await renderPdfToImages(buffer, imgFormat, (prog) => {
        if (prog.total) {
          const pct = Math.round((prog.current / prog.total) * 90);
          setStatus({ state: 'processing', message: prog.stage, progress: pct });
        }
      });
      setPdfImages(images);
      setStatus({ state: 'success', message: `Rendered ${images.length} page(s) to images.`, progress: 100 });
    } catch (err) {
      console.error(err);
      setError('Failed to render PDF to images.');
      setStatus({ state: 'error', message: 'Rendering failed.', progress: 0 });
    }
  };

  // ─── 7. IMAGES TO PDF ──────────────────────────────────────────────────────
  const handleAddImages = (files) => {
    const newItems = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      preview: URL.createObjectURL(file),
    }));
    setImagesList((prev) => [...prev, ...newItems]);
    setImgPdfResult(null);
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imagesList.length) return;
    const updated = [...imagesList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setImagesList(updated);
  };

  const removeImage = (index) => {
    const updated = [...imagesList];
    const [removed] = updated.splice(index, 1);
    URL.revokeObjectURL(removed.preview);
    setImagesList(updated);
  };

  const handleConvertImagesToPdf = async () => {
    if (imagesList.length === 0) {
      setError('Please add at least one image.');
      return;
    }
    setError(null);
    setStatus({ state: 'processing', message: 'Compiling images into PDF...', progress: 30 });

    try {
      const blob = await convertImagesToPdf(imagesList, imgPdfOptions);
      setImgPdfResult(blob);
      setStatus({ state: 'success', message: 'PDF generated from images!', progress: 100 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to convert images to PDF.');
      setStatus({ state: 'error', message: 'Conversion failed.', progress: 0 });
    }
  };

  return (
    <section id="doc-tools" className="doc-tools-section" aria-label="Free PDF and DOCX Tools">
      <div className="container">
        {/* Section Header */}
        <div className="doc-tools-header">
          <div className="doc-privacy-badge">
            <ShieldCheck size={15} className="shield-icon" aria-hidden="true" />
            <span>100% Client-Side Privacy • No Server Uploads • Zero Tracking</span>
          </div>

          <h2 className="doc-tools-title">
            Document <em>Studio</em> &amp; Toolkit
          </h2>
          <p className="doc-tools-subtitle">
            Fast, browser-local utilities to inspect, convert, and reorganize PDF &amp; DOCX files with zero server storage.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="doc-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pdf-viewer'}
            className={`doc-tab-btn ${activeTab === 'pdf-viewer' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pdf-viewer'); resetStatus(); }}
          >
            <Eye size={16} />
            <span>PDF &amp; Resume Viewer</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pdf-to-docx'}
            className={`doc-tab-btn ${activeTab === 'pdf-to-docx' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pdf-to-docx'); resetStatus(); }}
          >
            <FileText size={16} />
            <span>PDF to DOCX</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'docx-to-pdf'}
            className={`doc-tab-btn ${activeTab === 'docx-to-pdf' ? 'active' : ''}`}
            onClick={() => { setActiveTab('docx-to-pdf'); resetStatus(); }}
          >
            <FilePlus size={16} />
            <span>DOCX to PDF</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'docx-editor'}
            className={`doc-tab-btn ${activeTab === 'docx-editor' ? 'active' : ''}`}
            onClick={() => { setActiveTab('docx-editor'); resetStatus(); }}
          >
            <Edit3 size={16} />
            <span>DOCX Editor</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'page-tools'}
            className={`doc-tab-btn ${activeTab === 'page-tools' ? 'active' : ''}`}
            onClick={() => { setActiveTab('page-tools'); resetStatus(); }}
          >
            <Layers size={16} />
            <span>PDF Page Tools</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pdf-to-img'}
            className={`doc-tab-btn ${activeTab === 'pdf-to-img' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pdf-to-img'); resetStatus(); }}
          >
            <ImageIcon size={16} />
            <span>PDF to Images</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'img-to-pdf'}
            className={`doc-tab-btn ${activeTab === 'img-to-pdf' ? 'active' : ''}`}
            onClick={() => { setActiveTab('img-to-pdf'); resetStatus(); }}
          >
            <Sparkles size={16} />
            <span>Images to PDF</span>
          </button>
        </div>

        {/* Global Progress & Notification Banner */}
        {status.state === 'processing' && (
          <div className="doc-status-card processing" role="status">
            <RefreshCw size={18} className="spinner" />
            <div className="status-text">
              <span>{status.message}</span>
              <div className="doc-progress-bar">
                <div className="doc-progress-fill" style={{ width: `${status.progress}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {status.state === 'success' && (
          <div className="doc-status-card success" role="status">
            <CheckCircle2 size={18} />
            <span>{status.message}</span>
          </div>
        )}

        {error && (
          <div className="doc-status-card error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── TAB 1: PDF & RESUME VIEWER ────────────────────────────────────────── */}
        {activeTab === 'pdf-viewer' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3>Interactive PDF &amp; Resume Viewer</h3>
                  <p>Upload any PDF document or preview Nikita's verified resume with in-browser page controls.</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleLoadPdfForViewer('/Nikita-Itkar-Resume.pdf', 'Nikita-Itkar-Resume.pdf')}
                  title="Load Nikita's official verified resume"
                >
                  <FileCheck size={15} />
                  <span>Load Nikita's Resume</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div className="doc-dropzone">
              <input
                type="file"
                accept=".pdf,application/pdf"
                id="pdf-viewer-input"
                onChange={(e) => e.target.files?.[0] && handleLoadPdfForViewer(e.target.files[0])}
                className="file-input-hidden"
              />
              <label htmlFor="pdf-viewer-input" className="dropzone-label">
                <Upload size={36} />
                <span className="dropzone-title">
                  {viewerFile ? `Selected: ${viewerFile.name}` : 'Click or drag PDF / Resume here'}
                </span>
                <span className="dropzone-hint">Accepts .pdf files (instant client-side render)</span>
              </label>
            </div>

            {/* Selected File Card & Resume Action Controls */}
            {viewerFile && (
              <div className="pdf-preview-controls-card">
                <div className="pdf-meta-left">
                  <div className="pdf-doc-icon-wrap">
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="pdf-filename-heading">{viewerFile.name}</div>
                    <div className="pdf-filesize-sub">
                      <span>{viewerFile.size}</span>
                      <span>•</span>
                      <span>{viewerTotalPages} {viewerTotalPages === 1 ? 'Page' : 'Pages'}</span>
                      {isResume && <span className="resume-badge-tag">Verified Resume</span>}
                    </div>
                  </div>
                </div>

                <div className="pdf-actions-right">
                  {/* Working controls for Preview, Open PDF in new tab, and Download */}
                  {viewerBlobUrl && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => window.open(viewerBlobUrl, '_blank')}
                      title="Open PDF in a new browser tab"
                    >
                      <ExternalLink size={14} />
                      <span>Open PDF</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => downloadBlob(viewerFile.blob, viewerFile.name)}
                    title="Download this PDF directly to device"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )}

            {/* In-Browser PDF Canvas Viewer */}
            {viewerPdfDoc && (
              <div className="pdf-canvas-viewer-container">
                {/* Toolbar */}
                <div className="pdf-viewer-toolbar">
                  <div className="page-nav-controls">
                    <button
                      type="button"
                      onClick={() => setViewerPageNum((p) => Math.max(1, p - 1))}
                      disabled={viewerPageNum <= 1}
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="page-counter-text">
                      Page {viewerPageNum} of {viewerTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewerPageNum((p) => Math.min(viewerTotalPages, p + 1))}
                      disabled={viewerPageNum >= viewerTotalPages}
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="zoom-controls">
                    <button
                      type="button"
                      onClick={() => setViewerScale((s) => Math.max(0.7, s - 0.15))}
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="zoom-level-text">{Math.round(viewerScale * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setViewerScale((s) => Math.min(1.8, s + 0.15))}
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                  </div>
                </div>

                {/* PDF Page Canvas */}
                <div className="pdf-canvas-stage">
                  <canvas ref={viewerCanvasRef} className="pdf-rendered-page-canvas" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PDF TO DOCX ────────────────────────────────────────────────── */}
        {activeTab === 'pdf-to-docx' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <h3>Convert PDF to Editable DOCX</h3>
              <p>Extracts formatted text, headings, and paragraphs directly in your browser. Runs locally via Web Workers.</p>
            </div>

            <div className="doc-dropzone">
              <input
                type="file"
                accept=".pdf,application/pdf"
                id="pdf-to-docx-input"
                onChange={(e) => e.target.files?.[0] && handlePdfToDocx(e.target.files[0])}
                className="file-input-hidden"
              />
              <label htmlFor="pdf-to-docx-input" className="dropzone-label">
                <Upload size={36} />
                <span className="dropzone-title">
                  {pdfDocxFile ? `Selected: ${pdfDocxFile.name}` : 'Click or drag PDF file here'}
                </span>
                <span className="dropzone-hint">Standard PDF files with selectable text layer</span>
              </label>
            </div>

            {/* Selected File & Live Page 1 Preview */}
            {pdfDocxFile && (
              <div className="pdf-upload-preview-card">
                <div className="preview-canvas-box">
                  <canvas ref={pdfDocxCanvasRef} className="thumbnail-mini-canvas" />
                </div>
                <div className="preview-info-box">
                  <div className="pdf-filename-heading">{pdfDocxFile.name}</div>
                  <div className="pdf-filesize-sub">{(pdfDocxFile.size / 1024).toFixed(1)} KB • Ready for conversion</div>
                  {pdfDocxResult ? (
                    <div className="conversion-ready-status">
                      <CheckCircle2 size={15} color="#10B981" />
                      <span>Converted ({pdfDocxResult.numPages} pages, ~{pdfDocxResult.totalWordCount} words)</span>
                    </div>
                  ) : (
                    <div className="conversion-ready-status">
                      <RefreshCw size={15} className="spinner" />
                      <span>Analyzing text layout...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scanned/Limitation Disclaimer */}
            <div className="doc-disclaimer-pill">
              <Info size={16} />
              <span>
                <strong>Client-Side Note:</strong> Complex tables, vector graphics, and scanned document images (non-selectable text) may have simplified layouts. OCR is excluded for privacy and speed.
              </span>
            </div>

            {pdfDocxResult && (
              <div className="doc-result-card">
                <div className="result-meta">
                  <span className="meta-badge">Pages: {pdfDocxResult.numPages}</span>
                  <span className="meta-badge">Words: ~{pdfDocxResult.totalWordCount}</span>
                  {pdfDocxResult.isScannedWarning && (
                    <span className="meta-badge warning">Rasterized/Scanned Notice Added</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => downloadBlob(pdfDocxResult.blob, pdfDocxFile.name.replace(/\.pdf$/i, '.docx'))}
                >
                  <Download size={16} />
                  <span>Download .DOCX Document</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: DOCX TO PDF ────────────────────────────────────────────────── */}
        {activeTab === 'docx-to-pdf' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <h3>Convert DOCX to Standard PDF</h3>
              <p>Parses Word XML typography, headings, and lists to generate clean, portable PDF documents.</p>
            </div>

            <div className="doc-dropzone">
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                id="docx-to-pdf-input"
                onChange={(e) => e.target.files?.[0] && handleDocxToPdf(e.target.files[0])}
                className="file-input-hidden"
              />
              <label htmlFor="docx-to-pdf-input" className="dropzone-label">
                <Upload size={36} />
                <span className="dropzone-title">
                  {docxPdfFile ? `Selected: ${docxPdfFile.name}` : 'Click or drag .DOCX file here'}
                </span>
                <span className="dropzone-hint">Microsoft Word .docx documents</span>
              </label>
            </div>

            <div className="doc-disclaimer-pill">
              <Info size={16} />
              <span>
                <strong>Layout Notice:</strong> In-browser rendering maps standard fonts (Helvetica, Times) and clean line heights. Custom desktop fonts are normalized for consistency.
              </span>
            </div>

            {docxPdfResult && (
              <div className="doc-result-card">
                <div className="result-meta">
                  <span className="meta-badge">Document: {docxPdfFile?.name}</span>
                  <span className="meta-badge">Status: Ready</span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => downloadBlob(docxPdfResult.blob, docxPdfFile.name.replace(/\.docx$/i, '.pdf'))}
                >
                  <Download size={16} />
                  <span>Download Generated PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: DOCX EDITOR ────────────────────────────────────────────────── */}
        {activeTab === 'docx-editor' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <h3>Browser DOCX Rich Text Editor</h3>
              <p>Open DOCX files, make quick revisions, format text, and download either as an updated DOCX or clean PDF.</p>
            </div>

            <div className="editor-controls-row">
              <div className="editor-upload-btn-wrap">
                <input
                  type="file"
                  accept=".docx"
                  id="docx-editor-input"
                  onChange={(e) => e.target.files?.[0] && handleLoadDocxEditor(e.target.files[0])}
                  className="file-input-hidden"
                />
                <label htmlFor="docx-editor-input" className="btn-secondary btn-sm">
                  <Upload size={14} />
                  <span>Open .DOCX</span>
                </label>
                {editorFile && <span className="active-file-label">{editorFile.name}</span>}
              </div>

              <div className="editor-export-group">
                <button type="button" className="btn-secondary btn-sm" onClick={handleExportEditorDocx}>
                  <Download size={14} />
                  <span>Export .DOCX</span>
                </button>
                <button type="button" className="btn-primary btn-sm" onClick={handleExportEditorPdf}>
                  <Download size={14} />
                  <span>Export .PDF</span>
                </button>
              </div>
            </div>

            {/* Rich Text Toolbar */}
            <div className="editor-toolbar" role="toolbar" aria-label="Text Formatting">
              <button type="button" onClick={() => executeEditorCommand('bold')} title="Bold"><b>B</b></button>
              <button type="button" onClick={() => executeEditorCommand('italic')} title="Italic"><i>I</i></button>
              <button type="button" onClick={() => executeEditorCommand('underline')} title="Underline"><u>U</u></button>
              <span className="toolbar-divider"></span>
              <button type="button" onClick={() => executeEditorCommand('formatBlock', '<h1>')} title="Heading 1">H1</button>
              <button type="button" onClick={() => executeEditorCommand('formatBlock', '<h2>')} title="Heading 2">H2</button>
              <button type="button" onClick={() => executeEditorCommand('formatBlock', '<p>')} title="Paragraph">P</button>
              <span className="toolbar-divider"></span>
              <button type="button" onClick={() => executeEditorCommand('insertUnorderedList')} title="Bullet List">• List</button>
              <button type="button" onClick={() => executeEditorCommand('insertOrderedList')} title="Numbered List">1. List</button>
              <span className="toolbar-divider"></span>
              <button type="button" onClick={() => executeEditorCommand('justifyLeft')} title="Align Left">Left</button>
              <button type="button" onClick={() => executeEditorCommand('justifyCenter')} title="Align Center">Center</button>
              <button type="button" onClick={() => executeEditorCommand('justifyRight')} title="Align Right">Right</button>
              <button type="button" onClick={() => executeEditorCommand('removeFormat')} title="Clear Formatting">Clear</button>
            </div>

            {/* ContentEditable Sheet */}
            <div
              ref={editorRef}
              className="editor-canvas"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                setEditorHtml(e.currentTarget.innerHTML);
                updateWordCount(e.currentTarget.innerText);
              }}
              aria-label="Document Content Editor"
              role="textbox"
            />

            <div className="editor-footer-status">
              <span>Words: {wordCount}</span>
              <span>Estimated Pages: {Math.max(1, Math.ceil(wordCount / 350))}</span>
            </div>
          </div>
        )}

        {/* ── TAB 5: PDF PAGE TOOLS ─────────────────────────────────────────────── */}
        {activeTab === 'page-tools' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <h3>PDF Page Tools</h3>
              <p>Merge multiple PDF files, rotate page orientations, extract select page sets, or delete unneeded pages.</p>
            </div>

            {/* Subtabs */}
            <div className="page-subtabs">
              <button
                type="button"
                className={`page-subtab ${pageToolsSubTab === 'merge' ? 'active' : ''}`}
                onClick={() => { setPageToolsSubTab('merge'); setPageToolResult(null); }}
              >
                Merge PDFs
              </button>
              <button
                type="button"
                className={`page-subtab ${pageToolsSubTab === 'rotate' ? 'active' : ''}`}
                onClick={() => { setPageToolsSubTab('rotate'); setPageToolResult(null); }}
              >
                Rotate Pages
              </button>
              <button
                type="button"
                className={`page-subtab ${pageToolsSubTab === 'extract' ? 'active' : ''}`}
                onClick={() => { setPageToolsSubTab('extract'); setPageToolResult(null); }}
              >
                Extract Pages
              </button>
              <button
                type="button"
                className={`page-subtab ${pageToolsSubTab === 'remove' ? 'active' : ''}`}
                onClick={() => { setPageToolsSubTab('remove'); setPageToolResult(null); }}
              >
                Remove Pages
              </button>
            </div>

            {/* SUBTAB 4A: MERGE */}
            {pageToolsSubTab === 'merge' && (
              <div className="page-subpanel">
                <div className="doc-dropzone">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    id="merge-pdf-input"
                    onChange={(e) => {
                      if (e.target.files) {
                        const valid = Array.from(e.target.files).filter(f => f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf'));
                        if (valid.length !== e.target.files.length) {
                          setError('Some non-PDF files were skipped.');
                        }
                        setMergeFiles((prev) => [...prev, ...valid]);
                      }
                    }}
                    className="file-input-hidden"
                  />
                  <label htmlFor="merge-pdf-input" className="dropzone-label">
                    <FilePlus size={36} />
                    <span className="dropzone-title">Select multiple PDFs to merge</span>
                    <span className="dropzone-hint">Add 2 or more PDF documents</span>
                  </label>
                </div>

                {mergeFiles.length > 0 && (
                  <div className="files-order-list">
                    <h4>Files to merge ({mergeFiles.length}):</h4>
                    {mergeFiles.map((file, idx) => (
                      <div key={idx} className="file-order-row">
                        <span className="file-order-name">{idx + 1}. {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <div className="file-order-actions">
                          <button
                            type="button"
                            onClick={() => {
                              if (idx > 0) {
                                const copy = [...mergeFiles];
                                const temp = copy[idx - 1];
                                copy[idx - 1] = copy[idx];
                                copy[idx] = temp;
                                setMergeFiles(copy);
                              }
                            }}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (idx < mergeFiles.length - 1) {
                                const copy = [...mergeFiles];
                                const temp = copy[idx + 1];
                                copy[idx + 1] = copy[idx];
                                copy[idx] = temp;
                                setMergeFiles(copy);
                              }
                            }}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMergeFiles((prev) => prev.filter((_, i) => i !== idx))}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn-primary" onClick={handleMergePdfs} style={{ marginTop: '1rem' }}>
                      <Layers size={16} />
                      <span>Merge {mergeFiles.length} PDFs</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 4B: ROTATE */}
            {pageToolsSubTab === 'rotate' && (
              <div className="page-subpanel">
                <div className="doc-dropzone">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    id="rotate-pdf-input"
                    onChange={(e) => e.target.files?.[0] && handleSinglePdfUpload(e.target.files[0])}
                    className="file-input-hidden"
                  />
                  <label htmlFor="rotate-pdf-input" className="dropzone-label">
                    <RotateCw size={36} />
                    <span className="dropzone-title">{singlePdfFile ? singlePdfFile.name : 'Choose PDF to rotate'}</span>
                    <span className="dropzone-hint">{singlePdfPageCount ? `${singlePdfPageCount} pages detected` : 'Upload target PDF'}</span>
                  </label>
                </div>

                {singlePdfFile && (
                  <div className="tool-form-card">
                    <div className="form-group">
                      <label>Rotation Angle:</label>
                      <select value={rotateAngle} onChange={(e) => setRotateAngle(Number(e.target.value))}>
                        <option value={90}>90° Clockwise</option>
                        <option value={180}>180° Flip</option>
                        <option value={270}>270° Counter-Clockwise</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Pages:</label>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            name="rotate-opt"
                            checked={rotatePagesOption === 'all'}
                            onChange={() => setRotatePagesOption('all')}
                          />
                          All Pages (1 - {singlePdfPageCount})
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="rotate-opt"
                            checked={rotatePagesOption === 'custom'}
                            onChange={() => setRotatePagesOption('custom')}
                          />
                          Select Pages
                        </label>
                      </div>
                    </div>

                    {rotatePagesOption === 'custom' && (
                      <div className="form-group">
                        <label>Page range (e.g. 1, 3-5):</label>
                        <input
                          type="text"
                          placeholder="e.g. 1, 3, 5-7"
                          value={rotateCustomPages}
                          onChange={(e) => setRotateCustomPages(e.target.value)}
                        />
                      </div>
                    )}

                    <button type="button" className="btn-primary" onClick={handleRotatePdf}>
                      <RotateCw size={16} />
                      <span>Rotate and Save PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 4C: EXTRACT */}
            {pageToolsSubTab === 'extract' && (
              <div className="page-subpanel">
                <div className="doc-dropzone">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    id="extract-pdf-input"
                    onChange={(e) => e.target.files?.[0] && handleSinglePdfUpload(e.target.files[0])}
                    className="file-input-hidden"
                  />
                  <label htmlFor="extract-pdf-input" className="dropzone-label">
                    <Scissors size={36} />
                    <span className="dropzone-title">{singlePdfFile ? singlePdfFile.name : 'Choose PDF to extract pages from'}</span>
                    <span className="dropzone-hint">{singlePdfPageCount ? `${singlePdfPageCount} pages detected` : 'Upload target PDF'}</span>
                  </label>
                </div>

                {singlePdfFile && (
                  <div className="tool-form-card">
                    <div className="form-group">
                      <label>Enter pages to extract (1 - {singlePdfPageCount}):</label>
                      <input
                        type="text"
                        placeholder="e.g. 1, 2-4"
                        value={extractPagesStr}
                        onChange={(e) => setExtractPagesStr(e.target.value)}
                      />
                      <span className="input-hint">Example: '1, 3-5' extracts pages 1, 3, 4, and 5 into a new PDF.</span>
                    </div>

                    <button type="button" className="btn-primary" onClick={handleExtractPdf}>
                      <Scissors size={16} />
                      <span>Extract Selected Pages</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 4D: REMOVE */}
            {pageToolsSubTab === 'remove' && (
              <div className="page-subpanel">
                <div className="doc-dropzone">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    id="remove-pdf-input"
                    onChange={(e) => e.target.files?.[0] && handleSinglePdfUpload(e.target.files[0])}
                    className="file-input-hidden"
                  />
                  <label htmlFor="remove-pdf-input" className="dropzone-label">
                    <Trash2 size={36} />
                    <span className="dropzone-title">{singlePdfFile ? singlePdfFile.name : 'Choose PDF to remove pages from'}</span>
                    <span className="dropzone-hint">{singlePdfPageCount ? `${singlePdfPageCount} pages detected` : 'Upload target PDF'}</span>
                  </label>
                </div>

                {singlePdfFile && (
                  <div className="tool-form-card">
                    <div className="form-group">
                      <label>Enter pages to delete (1 - {singlePdfPageCount}):</label>
                      <input
                        type="text"
                        placeholder="e.g. 2, 4"
                        value={removePagesStr}
                        onChange={(e) => setRemovePagesStr(e.target.value)}
                      />
                      <span className="input-hint">Example: '2, 4' deletes page 2 and page 4 from the PDF.</span>
                    </div>

                    <button type="button" className="btn-primary" onClick={handleRemovePdfPages}>
                      <Trash2 size={16} />
                      <span>Remove Pages &amp; Save PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Page Tool Download Card */}
            {pageToolResult && (
              <div className="doc-result-card" style={{ marginTop: '1.5rem' }}>
                <div className="result-meta">
                  <span className="meta-badge">Operation: {pageToolResult.type}</span>
                  <span className="meta-badge">Status: Ready</span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => downloadBlob(pageToolResult.blob, pageToolResult.filename)}
                >
                  <Download size={16} />
                  <span>Download {pageToolResult.filename}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: PDF TO IMAGES ──────────────────────────────────────────────── */}
        {activeTab === 'pdf-to-img' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <h3>Render PDF Pages as Images</h3>
              <p>Renders each page of your PDF at crisp resolution to PNG or JPEG format for instant preview and download.</p>
            </div>

            <div className="doc-dropzone">
              <input
                type="file"
                accept=".pdf,application/pdf"
                id="pdf-to-img-input"
                onChange={(e) => e.target.files?.[0] && handlePdfToImages(e.target.files[0])}
                className="file-input-hidden"
              />
              <label htmlFor="pdf-to-img-input" className="dropzone-label">
                <ImageIcon size={36} />
                <span className="dropzone-title">
                  {pdfImgFile ? `Selected: ${pdfImgFile.name}` : 'Click or drag PDF file here'}
                </span>
                <span className="dropzone-hint">Renders high-resolution image previews</span>
              </label>
            </div>

            <div className="format-picker-row">
              <label>Image Format:</label>
              <select value={imgFormat} onChange={(e) => setImgFormat(e.target.value)}>
                <option value="image/png">PNG (Lossless &amp; Sharp)</option>
                <option value="image/jpeg">JPEG (Compact)</option>
              </select>
            </div>

            {pdfImages.length > 0 && (
              <div className="rendered-images-grid">
                <div className="rendered-grid-header">
                  <h4>Pages Rendered ({pdfImages.length})</h4>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      pdfImages.forEach((img) => {
                        const a = document.createElement('a');
                        a.href = img.dataUrl;
                        a.download = `page-${img.pageNumber}.${imgFormat === 'image/png' ? 'png' : 'jpg'}`;
                        a.click();
                      });
                    }}
                  >
                    <Download size={14} />
                    <span>Download All Pages</span>
                  </button>
                </div>

                <div className="images-cards-list">
                  {pdfImages.map((img) => (
                    <div key={img.pageNumber} className="image-preview-card">
                      <div className="card-img-wrap">
                        <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} loading="lazy" />
                      </div>
                      <div className="card-info-row">
                        <span>Page {img.pageNumber}</span>
                        <a
                          href={img.dataUrl}
                          download={`page-${img.pageNumber}.${imgFormat === 'image/png' ? 'png' : 'jpg'}`}
                          className="btn-sm-download"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 7: IMAGES TO PDF ──────────────────────────────────────────────── */}
        {activeTab === 'img-to-pdf' && (
          <div className="doc-tool-panel">
            <div className="doc-tool-intro">
              <h3>Convert Images to a Single PDF</h3>
              <p>Combine multiple JPG, PNG, or WebP images into an aligned, publication-ready PDF document.</p>
            </div>

            <div className="doc-dropzone">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                id="images-to-pdf-input"
                onChange={(e) => e.target.files && handleAddImages(e.target.files)}
                className="file-input-hidden"
              />
              <label htmlFor="images-to-pdf-input" className="dropzone-label">
                <Upload size={36} />
                <span className="dropzone-title">Add images (JPG, PNG, WebP)</span>
                <span className="dropzone-hint">Select one or multiple images</span>
              </label>
            </div>

            {imagesList.length > 0 && (
              <div className="img-pdf-workflow">
                <div className="options-row">
                  <div className="opt-group">
                    <label>Page Margins:</label>
                    <select
                      value={imgPdfOptions.margin}
                      onChange={(e) => setImgPdfOptions({ ...imgPdfOptions, margin: e.target.value })}
                    >
                      <option value="none">None (0pt Full Bleed)</option>
                      <option value="small">Small (20pt)</option>
                      <option value="normal">Normal (40pt)</option>
                    </select>
                  </div>

                  <div className="opt-group">
                    <label>Page Orientation:</label>
                    <select
                      value={imgPdfOptions.orientation}
                      onChange={(e) => setImgPdfOptions({ ...imgPdfOptions, orientation: e.target.value })}
                    >
                      <option value="auto">Auto-Fit to Image Dimensions</option>
                      <option value="portrait">Standard Portrait A4</option>
                      <option value="landscape">Standard Landscape A4</option>
                    </select>
                  </div>
                </div>

                <div className="images-reorder-grid">
                  {imagesList.map((item, idx) => (
                    <div key={item.id} className="reorder-card">
                      <div className="reorder-thumb">
                        <img src={item.preview} alt={item.name} />
                      </div>
                      <div className="reorder-meta">
                        <span className="reorder-name">{idx + 1}. {item.name}</span>
                        <span className="reorder-size">{item.size}</span>
                      </div>
                      <div className="reorder-actions">
                        <button type="button" onClick={() => moveImage(idx, -1)} disabled={idx === 0} title="Move Left">
                          <ArrowUp size={13} style={{ transform: 'rotate(-90deg)' }} />
                        </button>
                        <button type="button" onClick={() => moveImage(idx, 1)} disabled={idx === imagesList.length - 1} title="Move Right">
                          <ArrowDown size={13} style={{ transform: 'rotate(-90deg)' }} />
                        </button>
                        <button type="button" onClick={() => removeImage(idx)} title="Delete Image">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn-primary" onClick={handleConvertImagesToPdf} style={{ marginTop: '1.5rem' }}>
                  <Layers size={16} />
                  <span>Generate PDF from {imagesList.length} Image(s)</span>
                </button>

                {imgPdfResult && (
                  <div className="doc-result-card" style={{ marginTop: '1rem' }}>
                    <div className="result-meta">
                      <span className="meta-badge">Images: {imagesList.length}</span>
                      <span className="meta-badge">Status: PDF Ready</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => downloadBlob(imgPdfResult, 'converted-images.pdf')}
                    >
                      <Download size={16} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
