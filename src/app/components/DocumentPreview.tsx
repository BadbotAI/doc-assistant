import { FileText, FileSpreadsheet, FileCode, Database, Braces, File, Download, ZoomIn, ZoomOut, AlertTriangle, AlertCircle, Info, Lightbulb, MessageSquareWarning, ChevronDown, ChevronUp, Plus, Minus, RefreshCw, FolderOpen, X } from 'lucide-react';
import { useState, useRef } from 'react';

export interface DocumentAnnotation {
  sectionIndex: number;
  riskLevel: 'high' | 'medium' | 'low' | 'diff-added' | 'diff-removed' | 'diff-changed';
  title: string;
  comment: string;
  suggestion?: string;
  highlightText?: string;
}

interface DocumentPreviewProps {
  fileName: string;
  fileType: string;
  previewContent?: any;
  hideHeader?: boolean;
  annotations?: DocumentAnnotation[];
  onClose?: () => void;
  onOpenFileManager?: () => void;
  externalZoom?: number;
  pageIndex?: number;
  sectionsPerPage?: number;
}

const riskConfig: Record<string, {
  highlight: string;
  markerBg: string;
  markerText: string;
  badge: string;
  icon: any;
  iconColor: string;
  label: string;
  cardBorder: string;
  cardBg: string;
  dot: string;
  // diff-specific
  border?: string;
  bg?: string;
}> = {
  high: {
    highlight: 'bg-red-100/70',
    markerBg: 'bg-red-500',
    markerText: 'text-white',
    badge: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    label: '高风险',
    cardBorder: 'border-red-200',
    cardBg: 'bg-white',
    dot: 'bg-red-500',
  },
  medium: {
    highlight: 'bg-amber-100/70',
    markerBg: 'bg-amber-500',
    markerText: 'text-white',
    badge: 'bg-amber-100 text-amber-700',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    label: '中风险',
    cardBorder: 'border-amber-200',
    cardBg: 'bg-white',
    dot: 'bg-amber-500',
  },
  low: {
    highlight: 'bg-blue-100/50',
    markerBg: 'bg-blue-500',
    markerText: 'text-white',
    badge: 'bg-blue-100 text-blue-600',
    icon: Info,
    iconColor: 'text-blue-500',
    label: '低风险',
    cardBorder: 'border-blue-200',
    cardBg: 'bg-white',
    dot: 'bg-blue-500',
  },
  'diff-added': {
    highlight: 'bg-emerald-100/60',
    markerBg: 'bg-emerald-500',
    markerText: 'text-white',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: Plus,
    iconColor: 'text-emerald-600',
    label: '新增内容',
    cardBorder: 'border-emerald-200',
    cardBg: 'bg-white',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/60',
  },
  'diff-removed': {
    highlight: 'bg-rose-100/50',
    markerBg: 'bg-rose-500',
    markerText: 'text-white',
    badge: 'bg-rose-100 text-rose-700',
    icon: Minus,
    iconColor: 'text-rose-500',
    label: '已删除',
    cardBorder: 'border-rose-200',
    cardBg: 'bg-white',
    dot: 'bg-rose-500',
    border: 'border-l-rose-400',
    bg: 'bg-rose-50/50',
  },
  'diff-changed': {
    highlight: 'bg-violet-100/50',
    markerBg: 'bg-violet-500',
    markerText: 'text-white',
    badge: 'bg-violet-100 text-violet-700',
    icon: RefreshCw,
    iconColor: 'text-violet-500',
    label: '内容变更',
    cardBorder: 'border-violet-200',
    cardBg: 'bg-white',
    dot: 'bg-violet-500',
    border: 'border-l-violet-400',
    bg: 'bg-violet-50/50',
  },
};

/* ── Inline highlight with numbered marker ── */
function HighlightedText({
  text,
  highlightText,
  riskLevel,
  markerNumber,
  onMarkerClick,
}: {
  text: string;
  highlightText?: string;
  riskLevel: string;
  markerNumber?: number;
  onMarkerClick?: (n: number) => void;
}) {
  if (!highlightText) return <>{text}</>;
  const config = riskConfig[riskLevel];
  const idx = text.indexOf(highlightText);
  if (idx === -1) return <>{text}</>;

  const isDiff = riskLevel.startsWith('diff-');

  return (
    <>
      {text.slice(0, idx)}
      <mark className={`${config?.highlight || 'bg-yellow-100/60'} rounded-sm px-0.5 ${isDiff && riskLevel === 'diff-removed' ? 'line-through' : ''}`}>
        {text.slice(idx, idx + highlightText.length)}
        {markerNumber !== undefined && (
          <sup
            className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[9px] font-bold ml-0.5 cursor-pointer relative -top-1 ${config?.markerBg || 'bg-stone-500'} ${config?.markerText || 'text-white'} hover:scale-110 transition-transform`}
            onClick={(e) => { e.stopPropagation(); onMarkerClick?.(markerNumber); }}
          >
            {markerNumber}
          </sup>
        )}
      </mark>
      {text.slice(idx + highlightText.length)}
    </>
  );
}

/* ── Annotation sidebar card ── */
function SidebarAnnotationCard({
  annotation,
  index,
  isActive,
  onClick,
}: {
  annotation: DocumentAnnotation;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = riskConfig[annotation.riskLevel];
  const RiskIcon = config?.icon || Info;

  return (
    <div
      id={`annotation-card-${index}`}
      className={`rounded-xl border transition-all duration-200 cursor-pointer ${
        isActive
          ? `${config?.cardBorder || 'border-stone-200'} shadow-sm ring-1 ${config?.cardBorder?.replace('border-', 'ring-') || 'ring-stone-200'}`
          : 'border-stone-100 hover:border-stone-200'
      } ${config?.cardBg || 'bg-white'}`}
      onClick={onClick}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[10px] font-bold flex-shrink-0 ${config?.markerBg || 'bg-stone-500'} ${config?.markerText || 'text-white'}`}>
          {index}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${config?.badge || ''}`}>
          {config?.label || ''}
        </span>
        <span className="text-[12px] font-medium text-stone-700 flex-1 truncate">{annotation.title}</span>
        <button
          className="p-0.5 rounded text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Card body */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[11.5px] text-stone-600 leading-relaxed">
            <MessageSquareWarning className="w-3 h-3 inline mr-1 text-stone-400 relative -top-px" />
            {annotation.comment}
          </p>
          {annotation.suggestion && (
            <div className="flex items-start gap-1.5 bg-teal-50/60 rounded-lg px-2.5 py-2">
              <Lightbulb className="w-3 h-3 text-[#0d9488] flex-shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-[#0d9488] leading-relaxed">{annotation.suggestion}</p>
            </div>
          )}
          {annotation.highlightText && (
            <div className="text-[10.5px] text-stone-400 truncate">
              "{annotation.highlightText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Diff-mode section wrapper (only for diff annotations) ── */
function DiffSection({ annotation, children }: { annotation: DocumentAnnotation; children: React.ReactNode }) {
  const config = riskConfig[annotation.riskLevel];
  return (
    <div className={`relative rounded-md border-l-[3px] ${config?.border || ''} ${config?.bg || ''} px-3 py-2 -mx-1`}>
      {children}
    </div>
  );
}

/* ── Main component ── */
export function DocumentPreview({
  fileName,
  fileType,
  previewContent,
  hideHeader = false,
  annotations,
  onClose,
  onOpenFileManager,
  externalZoom,
  pageIndex,
  sectionsPerPage,
}: DocumentPreviewProps) {
  const [internalZoom, setInternalZoom] = useState(100);
  const zoom = externalZoom ?? internalZoom;
  const setZoom = (v: number | ((prev: number) => number)) => {
    if (externalZoom === undefined) {
      setInternalZoom(v as any);
    }
  };
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': case 'docx': return FileText;
      case 'xlsx': return FileSpreadsheet;
      case 'json': case 'yaml': return Braces;
      case 'xml': return FileCode;
      case 'parquet': return Database;
      default: return File;
    }
  };
  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-50 text-red-500';
      case 'docx': return 'bg-blue-50 text-blue-500';
      case 'xlsx': return 'bg-emerald-50 text-emerald-500';
      case 'json': case 'yaml': return 'bg-amber-50 text-amber-600';
      case 'xml': return 'bg-indigo-50 text-indigo-500';
      case 'parquet': return 'bg-cyan-50 text-cyan-500';
      default: return 'bg-stone-100 text-stone-500';
    }
  };

  const FileIcon = getFileIcon(fileType);
  const fileColor = getFileColor(fileType);

  // Build a numbered index for annotations
  const sortedAnnotations = annotations ? [...annotations].sort((a, b) => a.sectionIndex - b.sectionIndex) : [];
  const annotationNumberMap = new Map<number, number>(); // sectionIndex → display number (1-based)
  sortedAnnotations.forEach((ann, i) => {
    if (!annotationNumberMap.has(ann.sectionIndex)) {
      annotationNumberMap.set(ann.sectionIndex, i + 1);
    }
  });

  const getAnnotation = (idx: number): DocumentAnnotation | undefined => annotations?.find(a => a.sectionIndex === idx);

  const isDiffMode = annotations?.some(a => a.riskLevel.startsWith('diff-'));
  const isRiskMode = annotations?.some(a => !a.riskLevel.startsWith('diff-'));
  const hasAnnotations = sortedAnnotations.length > 0;

  // Scroll sidebar annotation into view when marker is clicked
  const scrollToAnnotation = (num: number) => {
    setActiveAnnotation(num);
    const el = document.getElementById(`annotation-card-${num}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleMarkerClick = (num: number) => {
    scrollToAnnotation(num);
  };

  /* ── Render a content section ── */
  const renderSection = (section: any, idx: number, type: 'pdf' | 'docx') => {
    const annotation = getAnnotation(idx);
    const markerNum = annotationNumberMap.get(idx);
    let content: React.ReactNode = null;

    if (section.type === 'heading') {
      content = <h3 key={idx} className="text-[1.05em] font-bold text-stone-800 mt-5 mb-2">{section.content}</h3>;
    } else if (section.type === 'subheading') {
      content = <h4 key={idx} className="text-[0.95em] font-semibold text-stone-700 mt-3 mb-1.5">{section.content}</h4>;
    } else if (section.type === 'text') {
      content = (
        <p key={idx} className="text-[0.85em] leading-relaxed text-stone-600">
          {annotation?.highlightText ? (
            <HighlightedText
              text={section.content}
              highlightText={annotation.highlightText}
              riskLevel={annotation.riskLevel}
              markerNumber={markerNum}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            section.content
          )}
          {/* If annotation exists on this section but no specific highlight text, show marker after */}
          {annotation && !annotation.highlightText && markerNum !== undefined && (
            <sup
              className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[9px] font-bold ml-1 cursor-pointer relative -top-1 ${riskConfig[annotation.riskLevel]?.markerBg || 'bg-stone-500'} ${riskConfig[annotation.riskLevel]?.markerText || 'text-white'} hover:scale-110 transition-transform`}
              onClick={() => handleMarkerClick(markerNum)}
            >
              {markerNum}
            </sup>
          )}
        </p>
      );
    } else if (section.type === 'list') {
      content = (
        <div key={idx}>
          <ul className={`list-disc list-inside space-y-1 text-[0.85em] text-stone-600 ${type === 'docx' ? 'ml-4' : ''}`}>
            {section.content.map((item: string, i: number) => <li key={i}>{item}</li>)}
          </ul>
          {annotation && markerNum !== undefined && (
            <sup
              className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[9px] font-bold ml-1 cursor-pointer relative -top-1 ${riskConfig[annotation.riskLevel]?.markerBg || 'bg-stone-500'} ${riskConfig[annotation.riskLevel]?.markerText || 'text-white'} hover:scale-110 transition-transform`}
              onClick={() => handleMarkerClick(markerNum)}
            >
              {markerNum}
            </sup>
          )}
        </div>
      );
    } else if (section.type === 'table') {
      content = (
        <div key={idx} className="overflow-x-auto my-3 relative">
          <table className="min-w-full border border-stone-200 text-[0.85em]">
            <thead className="bg-stone-50">
              <tr>{section.content[0].map((h: string, i: number) => <th key={i} className="border border-stone-200 px-3 py-2 text-left font-semibold text-stone-700">{h}</th>)}</tr>
            </thead>
            <tbody>
              {section.content.slice(1).map((row: string[], i: number) => (
                <tr key={i} className="hover:bg-stone-50">
                  {row.map((cell: string, j: number) => <td key={j} className="border border-stone-200 px-3 py-2 text-stone-600">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {annotation && markerNum !== undefined && (
            <sup
              className={`absolute -top-1 -right-1 inline-flex items-center justify-center w-[16px] h-[16px] rounded-full text-[9px] font-bold cursor-pointer ${riskConfig[annotation.riskLevel]?.markerBg || 'bg-stone-500'} ${riskConfig[annotation.riskLevel]?.markerText || 'text-white'} hover:scale-110 transition-transform shadow-sm`}
              onClick={() => handleMarkerClick(markerNum)}
            >
              {markerNum}
            </sup>
          )}
        </div>
      );
    } else if (section.type === 'metadata') {
      content = <pre key={idx} className="text-[0.8em] text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-100 whitespace-pre-line">{section.content}</pre>;
    }

    if (!content) return null;

    // For diff annotations, wrap in DiffSection
    if (annotation && annotation.riskLevel.startsWith('diff-')) {
      return <DiffSection key={`diff-${idx}`} annotation={annotation}>{content}</DiffSection>;
    }

    return content;
  };

  /* ── Render xlsx with annotation markers ── */
  const renderXlsx = () => {
    if (!previewContent?.sheets) return null;
    const sheetAnnotations = annotations?.filter(a => a.sectionIndex >= 1000) || [];
    return previewContent.sheets.map((sheet: any, sheetIdx: number) => (
      <div key={sheetIdx}>
        <h3 className="text-[1em] font-semibold text-stone-700 mb-3">{sheet.name}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-stone-200 text-[0.85em]">
            <thead className="bg-emerald-50/70">
              <tr>{sheet.headers.map((h: string, i: number) => <th key={i} className="border border-stone-200 px-3 py-2 text-left font-semibold text-emerald-800">{h}</th>)}</tr>
            </thead>
            <tbody>
              {sheet.rows.map((row: string[], i: number) => {
                const rowAnnotation = sheetAnnotations.find(a => a.sectionIndex === 1000 + i);
                const markerNum = rowAnnotation ? annotationNumberMap.get(rowAnnotation.sectionIndex) : undefined;
                const rowBg = rowAnnotation
                  ? rowAnnotation.riskLevel === 'high' || rowAnnotation.riskLevel === 'diff-removed'
                    ? 'bg-red-50/40'
                    : rowAnnotation.riskLevel === 'medium' || rowAnnotation.riskLevel === 'diff-changed'
                      ? 'bg-amber-50/40'
                      : rowAnnotation.riskLevel === 'diff-added'
                        ? 'bg-emerald-50/40'
                        : 'bg-blue-50/30'
                  : i === sheet.rows.length - 1
                    ? 'bg-emerald-50/50 font-semibold'
                    : 'hover:bg-stone-50';
                return (
                  <tr key={i} className={rowBg}>
                    {row.map((cell: string, j: number) => (
                      <td key={j} className="border border-stone-200 px-3 py-2 text-stone-600 relative">
                        {cell}
                        {j === row.length - 1 && markerNum !== undefined && (
                          <sup
                            className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[9px] font-bold ml-1.5 cursor-pointer ${riskConfig[rowAnnotation!.riskLevel]?.markerBg || 'bg-stone-500'} ${riskConfig[rowAnnotation!.riskLevel]?.markerText || 'text-white'} hover:scale-110 transition-transform`}
                            onClick={() => handleMarkerClick(markerNum)}
                          >
                            {markerNum}
                          </sup>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  /* ── Summary bar ── */
  const annotationSummary = hasAnnotations ? (
    <div className="bg-white border-b border-stone-100 px-5 py-2">
      <div className="flex items-center gap-3 flex-wrap">
        {isDiffMode && (
          <>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-[12px] font-medium text-stone-600">差异对比</span>
            </div>
            {(() => {
              const added = sortedAnnotations.filter(a => a.riskLevel === 'diff-added').length;
              const removed = sortedAnnotations.filter(a => a.riskLevel === 'diff-removed').length;
              const changed = sortedAnnotations.filter(a => a.riskLevel === 'diff-changed').length;
              return (
                <div className="flex items-center gap-2">
                  {added > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" />{added} 新增</span>}
                  {removed > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-400" />{removed} 删除</span>}
                  {changed > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-violet-600"><span className="w-2 h-2 rounded-full bg-violet-400" />{changed} 变更</span>}
                </div>
              );
            })()}
          </>
        )}
        {isRiskMode && (
          <>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[12px] font-medium text-stone-600">审核标注</span>
            </div>
            {(() => {
              const high = sortedAnnotations.filter(a => a.riskLevel === 'high').length;
              const medium = sortedAnnotations.filter(a => a.riskLevel === 'medium').length;
              const low = sortedAnnotations.filter(a => a.riskLevel === 'low').length;
              return (
                <div className="flex items-center gap-2">
                  {high > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-red-600"><span className="w-2 h-2 rounded-full bg-red-500" />{high} 高风险</span>}
                  {medium > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500" />{medium} 中风险</span>}
                  {low > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500" />{low} 低风险</span>}
                </div>
              );
            })()}
          </>
        )}
        <span className="text-[11px] text-stone-400 ml-auto">共 {sortedAnnotations.length} 处</span>
      </div>
    </div>
  ) : null;

  /* ── Document body content ── */
  // Compute paginated sections if pageIndex is provided
  const paginatedSections = (() => {
    if (pageIndex === undefined || sectionsPerPage === undefined || !previewContent?.sections) return null;
    const start = pageIndex * sectionsPerPage;
    const end = start + sectionsPerPage;
    return previewContent.sections.slice(start, end).map((s: any, i: number) => ({
      ...s,
      _originalIndex: start + i,
    }));
  })();

  const documentBody = (
    <div className="flex-1 overflow-auto p-6" style={{ fontSize: `${zoom}%` }}>
      {fileType === 'pdf' && previewContent ? (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8 max-w-4xl mx-auto border border-stone-100">
          {(!paginatedSections || pageIndex === 0) && (
            <h2 className="text-[1.4em] font-bold text-stone-800 mb-5">{previewContent.title}</h2>
          )}
          <div className="space-y-3 text-stone-600 leading-relaxed">
            {(paginatedSections || previewContent.sections).map((section: any, idx: number) => {
              const originalIdx = section._originalIndex ?? idx;
              return renderSection(section, originalIdx, 'pdf');
            })}
          </div>
        </div>
      ) : fileType === 'docx' && previewContent ? (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-10 max-w-4xl mx-auto border border-stone-100">
          {(!paginatedSections || pageIndex === 0) && (
            <h2 className="text-[1.4em] font-bold text-stone-800 mb-5 text-center">{previewContent.title}</h2>
          )}
          <div className="space-y-3 text-stone-600 leading-relaxed">
            {(paginatedSections || previewContent.sections).map((section: any, idx: number) => {
              const originalIdx = section._originalIndex ?? idx;
              return renderSection(section, originalIdx, 'docx');
            })}
          </div>
        </div>
      ) : fileType === 'xlsx' && previewContent ? (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 max-w-6xl mx-auto border border-stone-100">
          {renderXlsx()}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-2xl ${fileColor} flex items-center justify-center mb-4`}><FileIcon className="w-10 h-10" /></div>
            <p className="text-[13px] text-stone-400">文档预览加载中...</p>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Annotation sidebar panel ── */
  const annotationSidebar = hasAnnotations && isRiskMode ? (
    <div ref={sidebarRef} className="w-[280px] min-w-[240px] flex-shrink-0 border-l border-stone-100 bg-stone-50/50 flex flex-col overflow-hidden">
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-stone-100 bg-white">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[12px] font-semibold text-stone-700">审核标注</span>
          <span className="ml-auto text-[11px] text-stone-400">{sortedAnnotations.length} 处</span>
        </div>
      </div>
      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedAnnotations.map((ann, i) => (
          <SidebarAnnotationCard
            key={i}
            annotation={ann}
            index={i + 1}
            isActive={activeAnnotation === i + 1}
            onClick={() => setActiveAnnotation(activeAnnotation === i + 1 ? null : i + 1)}
          />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/80">
      {/* Header */}
      {!hideHeader && (
        <div className="bg-white border-b border-stone-100 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl ${fileColor} flex items-center justify-center flex-shrink-0`}><FileIcon className="w-4 h-4" /></div>
              <div className="min-w-0">
                <h2 className="text-[14px] font-semibold text-stone-800 truncate">{fileName}</h2>
                <p className="text-[11px] text-stone-400">{isDiffMode ? '差异对比视图' : isRiskMode ? '合规审核视图' : '文档预览'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-[11px] text-stone-400 w-10 text-center tabular-nums">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>
              <div className="w-px h-4 bg-stone-200 mx-1" />
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" title="下载文档"><Download className="w-3.5 h-3.5" /></button>
              {onOpenFileManager && (
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-teal-600 hover:bg-teal-50 transition-colors" onClick={onOpenFileManager} title="打开文档管理器"><FolderOpen className="w-3.5 h-3.5" /></button>
              )}
              {onClose && (
                <>
                  <div className="w-px h-4 bg-stone-200 mx-0.5" />
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" onClick={onClose} title="关闭预览"><X className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary bar — hidden in comparison mode (hideHeader) since parent already shows legend */}
      {!hideHeader && annotationSummary}

      {/* Main content area: document (+ optional sidebar) */}
      <div className="flex-1 flex overflow-hidden">
        {documentBody}
        {annotationSidebar}
      </div>
    </div>
  );
}