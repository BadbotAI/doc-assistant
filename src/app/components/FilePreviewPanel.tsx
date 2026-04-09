import { useState, useMemo, useRef, useCallback } from 'react';
import { X, FileText, FileSpreadsheet, File, Image, Braces, FileCode, Database, Columns2, FolderOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Download, PanelLeftClose, PanelLeft, List, LayoutGrid, ChevronDown } from 'lucide-react';
import { DocumentPreview } from '@/app/components/DocumentPreview';
import type { DocumentAnnotation } from '@/app/components/DocumentPreview';

export interface PreviewFile {
  id: string;
  name: string;
  type: string;
  previewContent?: any;
  annotations?: DocumentAnnotation[];
}

interface FilePreviewPanelProps {
  files: PreviewFile[];
  activeFileId: string;
  onChangeActiveFile: (id: string) => void;
  onClose: () => void;
  onOpenFileManager?: () => void;
}

function getTabIcon(type: string) {
  switch (type) {
    case 'pdf': return FileText;
    case 'docx': case 'doc': return FileText;
    case 'xlsx': case 'csv': return FileSpreadsheet;
    case 'image': case 'png': case 'jpg': return Image;
    case 'json': case 'yaml': return Braces;
    case 'xml': return FileCode;
    case 'parquet': return Database;
    default: return File;
  }
}

function getTabColor(type: string, active: boolean) {
  if (!active) return 'bg-stone-100 text-stone-400';
  switch (type) {
    case 'pdf': return 'bg-red-100 text-red-500';
    case 'docx': case 'doc': return 'bg-blue-100 text-blue-500';
    case 'xlsx': case 'csv': return 'bg-emerald-100 text-emerald-500';
    case 'image': case 'png': case 'jpg': return 'bg-purple-100 text-purple-500';
    case 'json': case 'yaml': return 'bg-amber-100 text-amber-600';
    case 'xml': return 'bg-indigo-100 text-indigo-500';
    case 'parquet': return 'bg-cyan-100 text-cyan-500';
    default: return 'bg-stone-100 text-stone-500';
  }
}

/** Split previewContent sections into "pages" for pagination */
function getPages(previewContent: any, fileType: string): { title: string; sections: any[] }[] {
  if (!previewContent) return [{ title: '第 1 页', sections: [] }];
  
  if (fileType === 'xlsx') {
    // Each sheet = 1 page
    if (previewContent.sheets) {
      return previewContent.sheets.map((s: any, i: number) => ({
        title: s.name || `表格 ${i + 1}`,
        sections: [s],
      }));
    }
    return [{ title: '第 1 页', sections: [] }];
  }

  const sections = previewContent.sections || [];
  if (sections.length === 0) return [{ title: '第 1 页', sections: [] }];

  // Group sections by headings to create pages
  const pages: { title: string; sections: any[] }[] = [];
  let currentPage: any[] = [];
  let currentTitle = previewContent.title || '第 1 页';
  const SECTIONS_PER_PAGE = 5;

  sections.forEach((s: any, idx: number) => {
    currentPage.push({ ...s, _originalIndex: idx });
    if (currentPage.length >= SECTIONS_PER_PAGE) {
      const heading = currentPage.find((p: any) => p.type === 'heading' || p.type === 'subheading');
      pages.push({
        title: heading ? heading.content : `第 ${pages.length + 1} 页`,
        sections: [...currentPage],
      });
      currentPage = [];
    }
  });
  if (currentPage.length > 0) {
    const heading = currentPage.find((p: any) => p.type === 'heading' || p.type === 'subheading');
    pages.push({
      title: heading ? heading.content : `第 ${pages.length + 1} 页`,
      sections: [...currentPage],
    });
  }

  return pages.length > 0 ? pages : [{ title: currentTitle, sections }];
}

/** Generate outline entries from headings */
function getOutline(previewContent: any): { label: string; pageIndex: number }[] {
  if (!previewContent?.sections) return [];
  const sections = previewContent.sections;
  const SECTIONS_PER_PAGE = 5;
  const entries: { label: string; pageIndex: number }[] = [];
  
  sections.forEach((s: any, idx: number) => {
    if (s.type === 'heading' || s.type === 'subheading') {
      entries.push({ label: s.content, pageIndex: Math.floor(idx / SECTIONS_PER_PAGE) });
    }
  });
  return entries;
}

/* ── ToolbarButton ── */
function ToolbarBtn({ onClick, title, children, className = '' }: { onClick?: () => void; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Page Thumbnail ── */
function PageThumbnail({
  page,
  pageIndex,
  isActive,
  onClick,
}: {
  page: { title: string; sections: any[] };
  pageIndex: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center gap-1 group cursor-pointer`}
    >
      <div className={`w-[72px] h-[96px] rounded-md border-2 transition-all duration-150 bg-white flex flex-col p-1.5 overflow-hidden ${
        isActive ? 'border-primary shadow-sm shadow-primary/10' : 'border-stone-200 group-hover:border-stone-300'
      }`}>
        {/* Mini preview lines */}
        {page.sections.slice(0, 6).map((s: any, i: number) => (
          <div key={i} className="flex flex-col gap-[2px] mb-[2px]">
            {s.type === 'heading' ? (
              <div className="h-[4px] bg-stone-400 rounded-full w-[80%]" />
            ) : s.type === 'subheading' ? (
              <div className="h-[3px] bg-stone-300 rounded-full w-[65%]" />
            ) : s.type === 'table' ? (
              <div className="h-[8px] border border-stone-200 rounded-sm bg-stone-50" />
            ) : (
              <>
                <div className="h-[2px] bg-stone-200 rounded-full w-full" />
                <div className="h-[2px] bg-stone-200 rounded-full w-[90%]" />
              </>
            )}
          </div>
        ))}
      </div>
      <span className={`text-[10px] tabular-nums ${isActive ? 'text-primary font-medium' : 'text-stone-400'}`}>
        {pageIndex + 1}
      </span>
    </button>
  );
}

/* ── Document Switcher Dropdown ── */
function DocSwitcher({
  files,
  activeFileId,
  onSelect,
}: {
  files: PreviewFile[];
  activeFileId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const Icon = getTabIcon(activeFile?.type || '');

  if (files.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-stone-500">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${getTabColor(activeFile?.type || '', true)}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${getTabColor(activeFile?.type || '', true)}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-stone-200 shadow-lg z-50 py-1 min-w-[200px]">
            {files.map(file => {
              const FIcon = getTabIcon(file.type);
              const isActive = file.id === activeFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => { onSelect(file.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isActive ? 'bg-accent text-primary' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${getTabColor(file.type, isActive)}`}>
                    <FIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[12px] font-medium truncate max-w-[140px]">{file.name}</span>
                  {isActive && <span className="ml-auto text-[10px] text-primary">当前</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Comparison View — side by side ── */
function ComparisonView({ files, onClose, onOpenFileManager }: { files: PreviewFile[]; onClose: () => void; onOpenFileManager?: () => void }) {
  const leftFile = files[0];
  const rightFile = files[1];
  const LeftIcon = getTabIcon(leftFile.type);
  const RightIcon = getTabIcon(rightFile.type);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Compact header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-3 min-h-[42px]">
        <div className="flex items-center gap-2">
          <Columns2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
          <span className="text-[12px] font-medium text-stone-600">文档对比</span>
          <div className="flex items-center gap-1 text-[12px] text-stone-400 ml-1">
            <span className="flex items-center gap-0.5 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />新增</span>
            <span className="flex items-center gap-0.5 text-rose-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />删除</span>
            <span className="flex items-center gap-0.5 text-violet-600"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" />变更</span>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" title="关闭">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Side by side documents */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left document */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-stone-100">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-stone-50 bg-stone-50/40">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${getTabColor(leftFile.type, true)}`}>
              <LeftIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[12px] font-medium text-stone-600 truncate">{leftFile.name}</span>
            <span className="text-[12px] text-stone-400 flex-shrink-0">原文档</span>
          </div>
          <DocumentPreview key={leftFile.id} fileName={leftFile.name} fileType={leftFile.type} previewContent={leftFile.previewContent} annotations={leftFile.annotations} hideHeader />
        </div>
        {/* Right document */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-stone-50 bg-stone-50/40">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${getTabColor(rightFile.type, true)}`}>
              <RightIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[12px] font-medium text-stone-600 truncate">{rightFile.name}</span>
            <span className="text-[12px] text-stone-400 flex-shrink-0">对比文档</span>
          </div>
          <DocumentPreview key={rightFile.id} fileName={rightFile.name} fileType={rightFile.type} previewContent={rightFile.previewContent} annotations={rightFile.annotations} hideHeader />
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export function FilePreviewPanel({ files, activeFileId, onChangeActiveFile, onClose, onOpenFileManager }: FilePreviewPanelProps) {
  if (activeFileId === '__comparison__' && files.length >= 2) {
    return <ComparisonView files={files} onClose={onClose} onOpenFileManager={onOpenFileManager} />;
  }

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  if (!activeFile) return null;

  return (
    <SingleDocView
      files={files}
      activeFile={activeFile}
      activeFileId={activeFileId}
      onChangeActiveFile={onChangeActiveFile}
      onClose={onClose}
      onOpenFileManager={onOpenFileManager}
    />
  );
}

/* ── Single Doc View with toolbar + sidebar ── */
function SingleDocView({
  files,
  activeFile,
  activeFileId,
  onChangeActiveFile,
  onClose,
  onOpenFileManager,
}: {
  files: PreviewFile[];
  activeFile: PreviewFile;
  activeFileId: string;
  onChangeActiveFile: (id: string) => void;
  onClose: () => void;
  onOpenFileManager?: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'thumbnail' | 'outline'>('thumbnail');
  const [currentPage, setCurrentPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Derive pages and outline from active file
  const pages = useMemo(() => getPages(activeFile.previewContent, activeFile.type), [activeFile]);
  const outline = useMemo(() => getOutline(activeFile.previewContent), [activeFile]);
  const totalPages = pages.length;

  // Reset page when file changes
  const prevFileIdRef = useRef(activeFileId);
  if (prevFileIdRef.current !== activeFileId) {
    prevFileIdRef.current = activeFileId;
    setCurrentPage(0);
  }

  const handlePrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(0, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const handleFitWidth = useCallback(() => {
    setZoom(100);
  }, []);

  const handleDownload = useCallback(() => {
    // Mock download
    const link = document.createElement('a');
    link.href = '#';
    link.download = activeFile.name;
    // In real app, this would download actual file
    alert(`下载文件：${activeFile.name}`);
  }, [activeFile.name]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Top Toolbar ── */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-white px-2 min-h-[42px] gap-1">
        {/* Left section: doc switch + sidebar toggle + page nav */}
        <div className="flex items-center gap-0.5">
          {/* Document switcher */}
          <DocSwitcher
            files={files}
            activeFileId={activeFileId}
            onSelect={onChangeActiveFile}
          />
          
          <div className="w-px h-4 bg-stone-150 mx-0.5" />

          {/* Sidebar toggle */}
          <ToolbarBtn
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? '隐藏侧边栏' : '显示侧边'}
          >
            {showSidebar ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
          </ToolbarBtn>

          {/* Page indicator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[12px] text-stone-500 tabular-nums min-w-[36px] text-center select-none">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right section: fit + zoom + download + close */}
        <div className="flex items-center gap-0.5">
          <ToolbarBtn onClick={handleFitWidth} title="适应宽度">
            <Maximize className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setZoom(z => Math.max(50, z - 10))} title="缩小">
            <ZoomOut className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <span className="text-[11px] text-stone-400 w-9 text-center tabular-nums select-none">{zoom}%</span>
          <ToolbarBtn onClick={() => setZoom(z => Math.min(200, z + 10))} title="放大">
            <ZoomIn className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-stone-150 mx-0.5" />
          <ToolbarBtn onClick={handleDownload} title="下载文档">
            <Download className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-stone-150 mx-0.5" />
          <ToolbarBtn onClick={onClose} title="关闭预览" className="hover:!text-stone-600 hover:!bg-stone-100">
            <X className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </div>
      </div>

      {/* ── Main Area: sidebar + document ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        {showSidebar && (
          <div className="w-[130px] flex-shrink-0 border-r border-stone-100 bg-stone-50/60 flex flex-col overflow-hidden">
            {/* Sidebar mode toggle */}
            <div className="flex items-center border-b border-stone-100 px-2 py-1.5 gap-0.5">
              <button
                onClick={() => setSidebarMode('thumbnail')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  sidebarMode === 'thumbnail' ? 'bg-white text-stone-700 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSidebarMode('outline')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  sidebarMode === 'outline' ? 'bg-white text-stone-700 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <List className="w-3 h-3" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {sidebarMode === 'thumbnail' ? (
                pages.map((page, idx) => (
                  <PageThumbnail
                    key={idx}
                    page={page}
                    pageIndex={idx}
                    isActive={currentPage === idx}
                    onClick={() => setCurrentPage(idx)}
                  />
                ))
              ) : (
                outline.length > 0 ? (
                  outline.map((entry, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(entry.pageIndex)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] leading-snug transition-colors ${
                        currentPage === entry.pageIndex
                          ? 'bg-accent text-primary font-medium'
                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                      }`}
                    >
                      {entry.label}
                    </button>
                  ))
                ) : (
                  <div className="text-[11px] text-stone-400 text-center py-4">暂无大纲</div>
                )
              )}
            </div>
          </div>
        )}

        {/* Document Preview */}
        <div className="flex-1 overflow-hidden" ref={contentRef}>
          <DocumentPreview
            key={`${activeFile.id}-${currentPage}`}
            fileName={activeFile.name}
            fileType={activeFile.type}
            previewContent={activeFile.previewContent}
            annotations={activeFile.annotations}
            hideHeader
            externalZoom={zoom}
            pageIndex={currentPage}
            sectionsPerPage={5}
          />
        </div>
      </div>
    </div>
  );
}