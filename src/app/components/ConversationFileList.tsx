import { FileText, FileSpreadsheet, Image, Braces, FileCode, Database, Presentation, X } from 'lucide-react';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import type { PreviewFile } from '@/app/components/FilePreviewPanel';

interface ConversationFileListProps {
  files: PreviewFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onClose: () => void;
}

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': case 'docx': return FileText;
    case 'xlsx': return FileSpreadsheet;
    case 'image': return Image;
    case 'json': case 'yaml': return Braces;
    case 'xml': return FileCode;
    case 'parquet': return Database;
    case 'pptx': return Presentation;
    default: return FileText;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'pdf': return 'PDF';
    case 'docx': return 'Word';
    case 'xlsx': return 'Excel';
    case 'image': return 'IMG';
    case 'json': return 'JSON';
    case 'yaml': return 'YAML';
    case 'xml': return 'XML';
    case 'pptx': return 'PPT';
    case 'parquet': return 'Data';
    default: return type.toUpperCase();
  }
}

export function ConversationFileList({ files, activeFileId, onSelectFile, onClose }: ConversationFileListProps) {
  // Filter out comparison sentinel
  const realFiles = files.filter(f => f.id !== '__comparison__');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
        <span className="text-[12px] font-medium text-foreground">
          对话文件
          <span className="ml-1.5 text-[10.5px] text-muted-foreground">{realFiles.length}</span>
        </span>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="py-1.5">
          {realFiles.map((file) => {
            const Icon = getFileIcon(file.type);
            const isActive = file.id === activeFileId;
            return (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                  isActive
                    ? 'bg-primary/[0.06] border-l-2 border-primary'
                    : 'hover:bg-accent/40 border-l-2 border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  <Icon className="w-3 h-3" />
                </div>
                <p className={`text-[11.5px] truncate flex-1 min-w-0 ${isActive ? 'font-medium text-primary' : 'text-foreground'}`}>
                  {file.name}
                </p>
                <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-primary/50' : 'text-muted-foreground/40'}`}>
                  {getTypeBadge(file.type)}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
