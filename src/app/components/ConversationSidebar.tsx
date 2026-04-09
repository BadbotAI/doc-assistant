import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  User,
  FolderOpen,
  Settings,
  Search,
  X,
  MessageSquare,
  File,
  Clock,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  date: Date;
}

interface SidebarDocument {
  name: string;
  id: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeAgentType?: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenFileManager: () => void;
  onSelectAgent: (agentType: string) => void;
  hidden?: boolean;
  documents?: SidebarDocument[];
  isFileManagerActive?: boolean;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenFileManager,
  hidden,
  documents = [],
  isFileManagerActive = false,
}: ConversationSidebarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'conversations' | 'files'>('conversations');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const filteredFiles = searchQuery.trim()
    ? documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchTab('conversations');
    }
  }, [showSearch]);

  const searchOverlay = showSearch ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh] bg-black/50 backdrop-blur-sm"
        onClick={() => setShowSearch(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[680px] bg-[#1e2028] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
            <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchTab === 'conversations' ? '搜索对话...' : '搜索文件...'}
              className="flex-1 bg-transparent text-[15px] text-white/90 placeholder:text-white/30 outline-none"
            />
            <button
              onClick={() => setShowSearch(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/8 px-5">
            <button
              onClick={() => setSearchTab('conversations')}
              className={`py-2.5 px-4 text-[13px] transition-colors relative ${
                searchTab === 'conversations'
                  ? 'text-white/90'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              对话
              {searchTab === 'conversations' && (
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setSearchTab('files')}
              className={`py-2.5 px-4 text-[13px] transition-colors relative ${
                searchTab === 'files'
                  ? 'text-white/90'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              文件
              {searchTab === 'files' && (
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[480px] overflow-y-auto">
            {/* Recent section - show when no search query, filtered by active tab */}
            {!searchQuery.trim() && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-1.5 mb-3 px-1">
                  <Clock className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-[12px] text-white/40 font-medium tracking-wide">
                    {searchTab === 'conversations' ? '最近对话' : '最近文件'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {searchTab === 'conversations' ? (
                    <>
                      {conversations.length === 0 ? (
                        <div className="py-10 text-center text-[13px] text-white/40">
                          暂无对话
                        </div>
                      ) : conversations.slice(0, 8).map((conv) => (
                        <div
                          key={`recent-${conv.id}`}
                          className="group/item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
                          onClick={() => {
                            onSelectConversation(conv.id);
                            setShowSearch(false);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span className="text-[13px] text-white/80 truncate flex-1">{conv.title}</span>
                          <span className="text-[12px] text-white/30 flex-shrink-0 group-hover/item:hidden">{conv.timestamp}</span>
                          <button
                            className="hidden group-hover/item:flex w-6 h-6 items-center justify-center rounded-md text-white/30 hover:text-red-400 hover:bg-white/8 transition-colors flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {documents.length === 0 ? (
                        <div className="py-10 text-center text-[13px] text-white/40">
                          暂无文件
                        </div>
                      ) : (
                        documents.slice(0, 8).map((file) => (
                          <div
                            key={`recent-file-${file.id}`}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
                            onClick={() => {
                              onOpenFileManager();
                              setShowSearch(false);
                            }}
                          >
                            <File className="w-4 h-4 text-white/40 flex-shrink-0" />
                            <span className="text-[13px] text-white/80 truncate flex-1">{file.name}</span>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Search results - show when has query */}
            {searchQuery.trim() && (
              searchTab === 'conversations' ? (
                <>
                  {filteredConversations.length === 0 ? (
                    <div className="px-5 py-12 text-center text-[13px] text-white/40">
                      未找到匹配的对话
                    </div>
                  ) : (
                    <div className="py-2 px-4">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.id}
                          className="group/item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
                          onClick={() => {
                            onSelectConversation(conv.id);
                            setShowSearch(false);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span className="text-[13px] text-white/80 truncate flex-1">{conv.title}</span>
                          <span className="text-[12px] text-white/30 flex-shrink-0 group-hover/item:hidden">{conv.timestamp}</span>
                          <button
                            className="hidden group-hover/item:flex w-6 h-6 items-center justify-center rounded-md text-white/30 hover:text-red-400 hover:bg-white/8 transition-colors flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {filteredFiles.length === 0 ? (
                    <div className="px-5 py-12 text-center text-[13px] text-white/40">
                      未找到匹配的文件
                    </div>
                  ) : (
                    <div className="py-2 px-4">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
                          onClick={() => {
                            onOpenFileManager();
                            setShowSearch(false);
                          }}
                        >
                          <File className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span className="text-[13px] text-white/80 truncate flex-1">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  const isCollapsed = !!hidden;

  return (
    <>
      {searchOverlay}
      <div
        className="h-screen bg-[#1e2028] flex flex-col flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
        style={{ width: isCollapsed ? 52 : 252 }}
      >
        {/* Header / Home icon */}
        <div className="px-[7px] pt-5 pb-1 flex-shrink-0 h-[54px] flex items-center">
          {isCollapsed ? (
            <button
              onClick={onNewConversation}
              className="w-[38px] h-[38px] flex items-center justify-center rounded-lg text-white/60 hover:bg-white/7 hover:text-white/90 transition-colors duration-150"
              title="回到首页"
            >
              <Home className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <span className="text-[17px] font-semibold text-white tracking-tight pl-[5px] whitespace-nowrap" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              通用文档助手
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-[7px] pt-3 pb-1 space-y-0.5">
          <button
            onClick={onNewConversation}
            className="w-full h-[38px] flex items-center gap-2.5 px-[10px] rounded-lg text-white/60 hover:bg-white/7 hover:text-white/80 transition-colors duration-150"
            title="新建对话"
          >
            <Plus className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
            {!isCollapsed && <span className="text-[13.5px] whitespace-nowrap">新建对话</span>}
          </button>
          <button
            onClick={onOpenFileManager}
            className={`w-full h-[38px] flex items-center gap-2.5 px-[10px] rounded-lg transition-colors duration-150 ${
              isFileManagerActive
                ? 'bg-white/12 text-white/90'
                : 'text-white/60 hover:bg-white/7 hover:text-white/80'
            }`}
            title="管理文件"
          >
            <FolderOpen className="w-[18px] h-[18px] flex-shrink-0" />
            {!isCollapsed && <span className="text-[13.5px] whitespace-nowrap">管理文件</span>}
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="w-full h-[38px] flex items-center gap-2.5 px-[10px] rounded-lg text-white/60 hover:bg-white/7 hover:text-white/80 transition-colors duration-150"
            title="搜索"
          >
            <Search className="w-[18px] h-[18px] flex-shrink-0" />
            {!isCollapsed && <span className="text-[13.5px] whitespace-nowrap">搜索</span>}
          </button>
        </div>

        {/* Conversations List — hidden when collapsed */}
        {!isCollapsed ? (
          <div className="flex-1 overflow-y-auto px-2.5 pt-5 sidebar-scroll">
            <div className="px-3 pb-2">
              <span className="text-[12px] text-white/30 tracking-wide">最近对话</span>
            </div>
            <div className="space-y-0.5 pb-3">
              {conversations.map((conversation) => {
                const isActive = activeConversationId === conversation.id;
                return (
                  <div
                    key={conversation.id}
                    className={`
                      group/conv relative flex items-center px-3 py-[9px] rounded-lg cursor-pointer
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-white/12 text-white'
                        : 'text-white/50 hover:bg-white/7 hover:text-white/75'
                      }
                    `}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <span className={`text-[13px] truncate flex-1 min-w-0 ${isActive ? 'text-white/95' : ''}`}>{conversation.title}</span>
                    <span className="text-[10px] text-white/20 flex-shrink-0 tabular-nums ml-1 group-hover/conv:hidden">{conversation.timestamp}</span>
                    <button
                      className="hidden group-hover/conv:flex flex-shrink-0 w-5 h-5 items-center justify-center rounded-md hover:bg-white/10 transition-colors ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-white/40 hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Bottom Section - User */}
        <div className="flex-shrink-0 px-[7px] py-3.5">
          {isCollapsed ? (
            <div className="w-[38px] h-[38px] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-[3px] py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] text-white/60 truncate whitespace-nowrap">Demo User</div>
              </div>
              <Settings className="w-4 h-4 text-white/25 hover:text-white/50 cursor-pointer transition-colors flex-shrink-0" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}