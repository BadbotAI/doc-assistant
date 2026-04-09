import { useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Paperclip, X, File, FileText, FileSpreadsheet, FileImage, Loader2, ArrowUp, PenLine, GitCompareArrows } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import { getFileTypePresetQueries } from '@/app/components/filePresetQueries';

export type AgentType = 'business' | 'compliance' | 'calculation' | null;

import type { MessageAttachment } from '@/app/components/MessageStream';

function getAttachmentIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv') || type.includes('xls')) return FileSpreadsheet;
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('webp')) return FileImage;
  if (type.includes('word') || type.includes('doc')) return FileText;
  return File;
}

function getAttachmentColor(type: string) {
  if (type.includes('pdf')) return { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-100' };
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv') || type.includes('xls')) return { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-100' };
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' };
  if (type.includes('word') || type.includes('doc')) return { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-100' };
  return { bg: 'bg-stone-50', icon: 'text-stone-500', border: 'border-stone-100' };
}

interface InputAreaProps {
  onSendMessage: (message: string, agentType: AgentType, attachments?: MessageAttachment[]) => void;
  onUploadDocuments: (files: FileList) => void;
  disabled?: boolean;
  defaultAgentType?: AgentType;
  onSetMessage?: (message: string) => void;
  isDocumentMode?: boolean;
  isCompact?: boolean;
}

export interface InputAreaRef {
  setInputMessage: (message: string) => void;
  addPendingAttachments: (attachments: MessageAttachment[]) => void;
}

export const InputArea = forwardRef<InputAreaRef, InputAreaProps>(
  ({ onSendMessage, onUploadDocuments, disabled, defaultAgentType, isCompact }, ref) => {
    const [message, setMessage] = useState('');
    const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      setInputMessage: (msg: string) => {
        setMessage(msg);
        setTimeout(() => textareaRef.current?.focus(), 0);
      },
      addPendingAttachments: (attachments: MessageAttachment[]) => {
        setPendingAttachments(prev => [...prev, ...attachments]);
        attachments.forEach((att, index) => {
          setTimeout(() => {
            setPendingAttachments(prev =>
              prev.map(a => a.id === att.id ? { ...a, status: 'ready' as const } : a)
            );
          }, 1200 + index * 600);
        });
        setTimeout(() => textareaRef.current?.focus(), 0);
      },
    }));

    const handleSend = () => {
      const readyAttachments = pendingAttachments.filter(a => a.status === 'ready');
      if ((message.trim() || readyAttachments.length > 0) && !disabled) {
        onSendMessage(message, defaultAgentType || 'business', readyAttachments.length > 0 ? readyAttachments : undefined);
        setMessage('');
        setPendingAttachments([]);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUploadDocuments(e.target.files);
        e.target.value = '';
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            const allowedTypes = [
              'application/pdf', 'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/plain', 'text/csv',
              'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
            ];
            if (allowedTypes.includes(file.type) || file.name.match(/\.(pdf|doc|docx|xls|xlsx|txt|csv|png|jpg|jpeg|gif|webp)$/i)) {
              files.push(file);
            }
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        onUploadDocuments(dataTransfer.files);
      }
    };

    const handleDeletePendingAttachment = (id: string) => {
      setPendingAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handlePresetQueryClick = (query: string) => {
      setMessage(query);
      setTimeout(() => textareaRef.current?.focus(), 0);
    };

    // 计算预设查询：所有附件就绪且用户未输入内容时显示
    const allReady = pendingAttachments.length > 0 && pendingAttachments.every(a => a.status === 'ready');
    const showPresetQueries = allReady && !message.trim();
    const presetQueries = useMemo(() => {
      if (!allReady) return [];
      return getFileTypePresetQueries(pendingAttachments);
    }, [allReady, pendingAttachments]);

    const canSend = (message.trim() || pendingAttachments.length > 0) && !disabled;

    return (
      <div className={isCompact ? "px-3 py-3" : "px-6 py-4"}>
        <div className={`${isCompact ? 'max-w-none' : 'max-w-[960px]'} mx-auto space-y-2`}>
          {/* Input Box */}
          <div className="relative rounded-xl border transition-colors duration-200 shadow-xs border-border bg-white focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/6">
            {/* Pending Attachments */}
            {pendingAttachments.length > 0 && (
              <div className="flex items-start gap-2 flex-wrap px-4 pt-3">
                {pendingAttachments.map((att) => {
                  const isUploading = att.status === 'uploading';
                  const Icon = getAttachmentIcon(att.type);
                  const colors = getAttachmentColor(att.type);
                  return (
                    <div key={att.id} className={`relative w-[110px] rounded-xl border overflow-hidden group/chip transition-colors duration-200 ${
                      isUploading ? `${colors.border} animate-pulse` : att.status === 'ready' ? `${colors.border} hover:shadow-sm` : 'border-red-200'
                    }`}>
                      <div className={`w-full h-[72px] ${colors.bg} flex items-center justify-center`}>
                        {isUploading ? <Loader2 className={`w-6 h-6 ${colors.icon} animate-spin`} /> : <Icon className={`w-6 h-6 ${colors.icon}`} />}
                      </div>
                      <div className="px-2.5 py-2 bg-transparent">
                        <p className="text-[12px] font-medium text-stone-700 truncate">{att.name}</p>
                        <span className={`text-[12px] ${isUploading ? 'text-primary' : att.status === 'ready' ? 'text-stone-400' : 'text-red-500'}`}>
                          {isUploading ? '上传中...' : att.status === 'ready' ? att.type.toUpperCase() : '失败'}
                        </span>
                      </div>
                      {att.status === 'ready' && (
                        <button className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center bg-white/80 text-stone-300 hover:text-stone-500 opacity-0 group-hover/chip:opacity-100 transition-all" onClick={() => handleDeletePendingAttachment(att.id)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Preset Query Chips */}
            {showPresetQueries && presetQueries.length > 0 && !isCompact && (
              <div className="flex items-center gap-1.5 px-4 pt-2.5 overflow-x-auto scrollbar-none">
                {presetQueries.map((query, index) => {
                  const isRevisionMode = query.includes('修订模式');
                  const isCompareMode = query.includes('对比模式');
                  const isSpecialMode = isRevisionMode || isCompareMode;
                  return (
                    <button
                      key={index}
                      onClick={() => handlePresetQueryClick(query)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-[0.97] flex-shrink-0 ${
                        isSpecialMode
                          ? 'bg-primary/8 hover:bg-primary/14 text-primary'
                          : 'bg-slate-50 hover:bg-slate-100 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isRevisionMode && <PenLine className="w-3 h-3 flex-shrink-0" />}
                      {isCompareMode && <GitCompareArrows className="w-2.5 h-2.5 flex-shrink-0" />}
                      <span>{query}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="描述你想要分析的内容..."
              disabled={disabled}
              className={`${isCompact ? 'min-h-[56px]' : 'min-h-[80px]'} max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px] text-foreground placeholder:text-muted-foreground/60 px-4 pt-3 pb-0`}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.json,.yaml,.yml,.xml" />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>上传</span>
                </button>
              </div>

              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 active:scale-95 disabled:active:scale-100 ${
                  canSend
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          {!isCompact && (
            <div className="text-[12px] text-muted-foreground/50 text-center">
              <span className="text-muted-foreground/40">Enter</span> 发送 · <span className="text-muted-foreground/40">Shift+Enter</span> 换行
            </div>
          )}
        </div>
      </div>
    );
  }
);

InputArea.displayName = 'InputArea';