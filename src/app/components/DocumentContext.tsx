import { FileText, X, File, FileSpreadsheet, FileImage, Loader2 } from 'lucide-react';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

interface DocumentContextProps {
  documents: Document[];
  onDeleteDocument: (id: string) => void;
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('image')) return FileImage;
  return File;
};

const statusConfig = {
  uploading: { text: '上传中', color: 'text-teal-600', bg: 'bg-teal-50', animate: true },
  processing: { text: '解析中', color: 'text-amber-500', bg: 'bg-amber-50', animate: true },
  ready: { text: '就绪', color: 'text-teal-600', bg: 'bg-teal-50', animate: false },
  error: { text: '失败', color: 'text-red-500', bg: 'bg-red-50', animate: false },
};

export function DocumentContext({ documents, onDeleteDocument }: DocumentContextProps) {
  if (documents.length === 0) return null;

  return (
    <div className="bg-white px-6 py-2 max-w-[960px] mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        {documents.map((doc) => {
          const Icon = getFileIcon(doc.type);
          const status = statusConfig[doc.status];
          return (
            <div
              key={doc.id}
              className="inline-flex items-center gap-2 bg-stone-50 rounded-xl border border-stone-100 px-2.5 py-1.5 group hover:border-stone-200 transition-colors duration-150"
            >
              <div className={`w-5 h-5 rounded-md ${status.bg} flex items-center justify-center flex-shrink-0`}>
                {status.animate ? (
                  <Loader2 className={`w-3 h-3 ${status.color} animate-spin`} />
                ) : (
                  <Icon className={`w-3 h-3 ${status.color}`} />
                )}
              </div>
              <span className="text-[12px] font-medium text-stone-700 max-w-[140px] truncate">
                {doc.name}
              </span>
              <span className={`text-[12px] font-medium ${status.color}`}>
                {status.text}
              </span>
              {doc.status === 'ready' && (
                <button
                  className="w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-stone-200 transition-all"
                  onClick={() => onDeleteDocument(doc.id)}
                >
                  <X className="w-3 h-3 text-stone-400" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
