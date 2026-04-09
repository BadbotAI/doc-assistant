import { X, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { Document } from '@/app/components/DocumentContext';

interface DocumentComparisonViewerProps {
  documents: Document[];
  onClose: () => void;
}

export function DocumentComparisonViewer({ documents, onClose }: DocumentComparisonViewerProps) {
  const doc1 = documents[0];
  const doc2 = documents[1];
  if (!doc1 || !doc2) return null;

  const mockOriginalContent = [
    { text: '第一章 财务概况', highlight: false },
    { text: '本年度公司总收入达到 5000 万元', highlight: true, type: 'changed' },
    { text: '较上年增长 15%', highlight: false },
    { text: '净利润为 800 万元', highlight: true, type: 'changed' },
    { text: '运营成本控制在合理范围内', highlight: false },
    { text: '', highlight: false },
    { text: '第二章 业务发展', highlight: false },
    { text: '新增客户 120 家', highlight: false },
    { text: '市场份额提升 3%', highlight: true, type: 'removed' },
    { text: '产品线拓展至 5 个领域', highlight: false },
    { text: '', highlight: false },
    { text: '第三章 展望', highlight: false },
    { text: '预计下年度将继续保持增长态势', highlight: false },
  ];

  const mockNewContent = [
    { text: '第一章 财务概况', highlight: false },
    { text: '本年度公司总收入达到 5200 万元', highlight: true, type: 'changed' },
    { text: '较上年增长 15%', highlight: false },
    { text: '净利润为 850 万元', highlight: true, type: 'changed' },
    { text: '运营成本控制在合理范围内', highlight: false },
    { text: '', highlight: false },
    { text: '第二章 业务发展', highlight: false },
    { text: '新增客户 120 家', highlight: false },
    { text: '市场份额提升至行业前三', highlight: true, type: 'added' },
    { text: '产品线拓展至 5 个领域', highlight: false },
    { text: '新开拓海外市场 2 个', highlight: true, type: 'added' },
    { text: '', highlight: false },
    { text: '第三章 展望', highlight: false },
    { text: '预计下年度将继续保持增长态势', highlight: false },
  ];

  const getHighlightClass = (type?: string) => {
    switch (type) {
      case 'added': return 'bg-emerald-50 border-l-2 border-emerald-400';
      case 'removed': return 'bg-red-50 border-l-2 border-red-400';
      case 'changed': return 'bg-amber-50 border-l-2 border-amber-400';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-[15px] font-semibold text-stone-800">文档对比</h2>
            <p className="text-[12px] text-stone-500 mt-0.5">
              {doc1.name} vs {doc2.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-stone-500">新增</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-stone-500">修改</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-stone-500">删除</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel */}
          <div className="flex-1 border-r border-stone-100 flex flex-col">
            <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-stone-700 truncate">{doc1.name}</div>
                  <div className="text-[11px] text-stone-400">原文件</div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-white p-5">
              <div className="max-w-2xl mx-auto space-y-0.5 font-mono text-[13px]">
                {mockOriginalContent.map((line, index) => (
                  <div key={index} className={`px-3 py-1.5 rounded ${line.highlight ? getHighlightClass(line.type) : ''}`}>
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-stone-700 truncate">{doc2.name}</div>
                  <div className="text-[11px] text-stone-400">新文件</div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-white p-5">
              <div className="max-w-2xl mx-auto space-y-0.5 font-mono text-[13px]">
                {mockNewContent.map((line, index) => (
                  <div key={index} className={`px-3 py-1.5 rounded ${line.highlight ? getHighlightClass(line.type) : ''}`}>
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 flex items-center justify-between">
          <div className="text-[12px] text-stone-500">
            <span className="text-emerald-600 font-medium">2 处新增</span>
            <span className="mx-2 text-stone-300">·</span>
            <span className="text-amber-600 font-medium">2 处修改</span>
            <span className="mx-2 text-stone-300">·</span>
            <span className="text-red-500 font-medium">1 处删除</span>
          </div>
          <Button onClick={onClose} className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-9 px-4 text-[13px] rounded-lg">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
