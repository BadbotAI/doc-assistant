import { Sparkles, Copy, Check, FileText, File, FileSpreadsheet, FileImage, X, Loader2, CheckCircle2, ThumbsUp, ThumbsDown, RotateCcw, ArrowRight, Download } from 'lucide-react';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { useState, useEffect, useRef } from 'react';

export interface ParsingFile {
  id: string;
  name: string;
  type: string;
  progress: number;
}

export interface ParsingState {
  files: ParsingFile[];
  stage: string;
  isComplete: boolean;
}

export interface CapabilityCard {
  title: string;
  description: string;
  query?: string;
  icon?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'uploading' | 'ready' | 'error';
  isAiGenerated?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentType?: string;
  capabilities?: CapabilityCard[];
  attachments?: MessageAttachment[];
  followUpSuggestions?: string[];
}

interface MessageStreamProps {
  messages: Message[];
  onCapabilityClick?: (capability: CapabilityCard) => void;
  onDeleteAttachment?: (messageId: string, attachmentId: string) => void;
  onOpenFile?: (attachment: MessageAttachment) => void;
  parsingState?: ParsingState | null;
  thinkingStatus?: string | null;
  onSuggestionClick?: (query: string) => void;
  compact?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-primary hover:bg-slate-100 transition-colors"
      title={copied ? '已复制' : '复制'}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function getAttachmentIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('webp')) return FileImage;
  if (type.includes('word') || type.includes('doc')) return FileText;
  return File;
}

function getAttachmentColor(_type: string) {
  return { bg: 'bg-primary/[0.06]', icon: 'text-primary', border: 'border-primary/15' };
}

function AttachmentCard({ attachment, messageId, onDelete }: { attachment: MessageAttachment; messageId: string; onDelete?: (messageId: string, attachmentId: string) => void }) {
  const Icon = getAttachmentIcon(attachment.type);
  const colors = getAttachmentColor(attachment.type);
  const isLoading = attachment.status === 'uploading';
  const isReady = attachment.status === 'ready';

  return (
    <div className={`relative w-[110px] rounded-xl border transition-colors duration-200 group overflow-hidden ${
      isLoading ? `${colors.bg} ${colors.border} animate-pulse` : isReady ? `bg-white ${colors.border} hover:shadow-sm` : 'bg-red-50 border-red-200'
    }`}>
      {/* Icon area */}
      <div className={`w-full h-[72px] ${colors.bg} flex items-center justify-center relative`}>
        {isLoading ? <Loader2 className={`w-6 h-6 ${colors.icon} animate-spin`} /> : <Icon className={`w-6 h-6 ${colors.icon}`} />}
        {attachment.isAiGenerated && (
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-violet-500 text-white rounded-md leading-none">AI</span>
        )}
      </div>
      {/* Info area */}
      <div className="px-2.5 py-2">
        <p className="text-[12px] font-medium text-stone-700 truncate">{attachment.name.replace(/^.*[\\/]/, '')}</p>
      </div>
      {/* Loading bar */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-200/60 overflow-hidden">
          <div className={`h-full ${colors.icon.replace('text-', 'bg-')}`} style={{ width: '60%', animation: 'loading 1.5s ease-in-out infinite' }} />
        </div>
      )}
      {/* Delete button */}
      {isReady && onDelete && (
        <button onClick={() => onDelete(messageId, attachment.id)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center bg-white/80 text-stone-300 hover:text-stone-500 opacity-0 group-hover:opacity-100 transition-all">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function ParsingIndicator({ parsingState }: { parsingState: ParsingState }) {
  return (
    <div className="max-w-none">
      <div className="space-y-2.5">
        <div className="text-[13px] text-slate-400 font-medium">文档助手</div>
        <div className="flex flex-wrap gap-2">
          {parsingState.files.map((file) => {
            const Icon = getAttachmentIcon(file.type);
            const colors = getAttachmentColor(file.type);
            const isDone = file.progress >= 100;
            return (
              <div key={file.id} className={`relative w-[110px] rounded-xl border overflow-hidden transition-colors duration-200 ${
                isDone ? `bg-white ${colors.border} hover:shadow-sm` : `${colors.border} animate-pulse`
              }`}>
                <div className={`w-full h-[72px] ${colors.bg} flex items-center justify-center relative`}>
                  {isDone
                    ? <Icon className={`w-6 h-6 ${colors.icon}`} />
                    : <Loader2 className={`w-6 h-6 ${colors.icon} animate-spin`} />
                  }
                  {!isDone && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/40">
                      <div className={`h-full ${colors.icon.replace('text-', 'bg-')} transition-all duration-700 ease-out`} style={{ width: `${file.progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-[12px] font-medium text-stone-700 truncate">{file.name.replace(/^.*[\\/]/, '')}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          {!parsingState.isComplete ? (
            <>
              <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
              <span className="text-[12px] text-slate-400">{parsingState.stage}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-[12px] text-primary font-medium">文档解析完成</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageStream({ messages, onCapabilityClick, onDeleteAttachment, onOpenFile, parsingState, thinkingStatus, onSuggestionClick, compact }: MessageStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, parsingState]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-stone-300" />
          </div>
          <div>
            <div className="text-[14px] font-medium text-stone-500">开始新对话</div>
            <div className="text-[12.5px] text-stone-400 mt-1">上传文档或输入问题开始分析</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-hidden">
    <ScrollArea className="h-full">
      <div className={`mx-auto space-y-6 ${compact ? 'px-4 py-5 max-w-none' : 'px-6 py-6 max-w-[880px]'}`}>
        {messages.map((message) => (
          <div key={message.id}>
            {/* System file upload cards */}
            {message.role === 'system' && message.attachments && message.attachments.length > 0 ? (
              <div className="space-y-3">
                {message.content && (
                  <div className="flex justify-center py-1">
                    <div className="bg-slate-100 text-slate-500 rounded-full px-3.5 py-1 text-[12px] font-medium">{message.content}</div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((attachment) => (
                    <AttachmentCard key={attachment.id} attachment={attachment} messageId={message.id} onDelete={onDeleteAttachment} />
                  ))}
                </div>
              </div>
            ) : message.role === 'user' ? (
              /* User message — Claude style: right-aligned soft bubble, no avatar */
              <div className="flex justify-end">
                <div className="max-w-[80%] w-fit space-y-2 ml-auto">
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {message.attachments.map((attachment) => {
                        const Icon = getAttachmentIcon(attachment.type);
                        const colors = getAttachmentColor(attachment.type);
                        return (
                          <div key={attachment.id} className={`w-[110px] rounded-xl border overflow-hidden ${colors.border}`}>
                            <div className={`w-full h-[72px] ${colors.bg} flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 ${colors.icon}`} />
                            </div>
                            <div className="px-2.5 py-2 bg-white">
                              <p className="text-[12px] font-medium text-stone-700 truncate">{attachment.name.replace(/^.*[\\/]/, '')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {message.content && (
                    <div className="bg-primary/10 text-foreground rounded-2xl rounded-tr-md px-4 py-3 border border-primary/15">
                      <div className="text-[14px] leading-[1.7] whitespace-pre-wrap break-words">{message.content}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : message.role === 'system' ? (
              /* System message */
              <div className="flex justify-center py-1">
                <div className="bg-slate-100 text-slate-500 rounded-full px-3.5 py-1 text-[12px] font-medium">{message.content}</div>
              </div>
            ) : (
              /* AI assistant message — left-aligned, clean text */
              <div className="group/ai space-y-2">
                {/* Message content */}
                <div className="text-[14px] text-slate-700 whitespace-pre-wrap break-words leading-[1.8]">
                  {message.content}
                </div>

                {/* AI-generated file cards — horizontal bar style */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((attachment) => {
                      const FileIcon = getAttachmentIcon(attachment.type);
                      return (
                        <button
                          key={attachment.id}
                          onClick={() => onOpenFile?.(attachment)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:border-primary/30 hover:bg-primary/[0.03] transition-all group/file cursor-pointer text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-4.5 h-4.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{attachment.name}</p>
                            <p className="text-[11px] text-muted-foreground">{attachment.size}</p>
                          </div>
                          {attachment.isAiGenerated && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-violet-500 text-white rounded-md leading-none flex-shrink-0">AI</span>
                          )}
                          <Download className="w-4 h-4 text-stone-300 group-hover/file:text-primary transition-colors flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Capability Cards */}
                {message.capabilities && message.capabilities.length > 0 && (
                  <div className="mt-5 flex flex-col gap-2">
                    {message.capabilities.map((capability, index) => (
                      <button
                        key={index}
                        className="text-left rounded-xl px-4 py-3 border border-border bg-slate-50/40 hover:bg-accent hover:border-primary/20 transition-colors duration-150 cursor-pointer group/cap active:scale-[0.99]"
                        onClick={() => onCapabilityClick && onCapabilityClick(capability)}
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-[13px] text-slate-500 group-hover/cap:text-slate-700 transition-colors flex-1 min-w-0 truncate leading-normal">
                            {capability.query || capability.description}
                          </p>
                          <div className="w-5 h-5 rounded-md bg-slate-200/50 group-hover/cap:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover/cap:text-white transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                  <div className="mt-5 flex flex-col gap-2">
                    {message.followUpSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="px-4 py-2.5 rounded-2xl border border-stone-200/80 hover:border-primary/25 bg-white hover:bg-accent/50 transition-colors duration-150 cursor-pointer group/sug active:scale-[0.99] text-left w-fit"
                        onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                      >
                        <span className="text-[13px] text-stone-500 group-hover/sug:text-primary transition-colors leading-snug">
                          {suggestion}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions row — visible on hover */}
                <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover/ai:opacity-100 transition-opacity duration-150">
                  <CopyButton text={message.content} />
                  <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-primary hover:bg-slate-100 transition-colors" title="有帮助">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-400 hover:bg-slate-100 transition-colors" title="没有帮助">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-primary hover:bg-slate-100 transition-colors" title="重新生成">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {parsingState && <ParsingIndicator parsingState={parsingState} />}

        {/* AI thinking status */}
        {thinkingStatus && !parsingState && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[13px] text-muted-foreground">{thinkingStatus}</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
    </div>
  );
}