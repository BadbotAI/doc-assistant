import { X, Check } from 'lucide-react';

interface AgentOption {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  dotColor?: string;
  activeBg?: string;
}

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentOption[];
  selectedAgent: string | null;
  onSelectAgent: (type: string) => void;
}

export function AgentDrawer({ isOpen, onClose, agents, selectedAgent, onSelectAgent }: AgentDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/15 z-40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-in slide-in-from-bottom duration-200 border-t border-stone-100">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-3">
          <h3 className="text-[15px] font-semibold text-stone-800">选择助手模式</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors text-stone-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Options */}
        <div className="px-5 pb-6 space-y-2">
          {agents.map((agent) => {
            const isSelected = selectedAgent === agent.type;
            return (
              <button
                key={agent.type}
                onClick={() => { onSelectAgent(agent.type); onClose(); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? 'border-teal-300 bg-teal-50/50'
                    : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${agent.activeBg || 'bg-stone-100'}`}>
                    <span className={isSelected ? 'text-teal-600' : 'text-stone-600'}>
                      {agent.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-stone-800">{agent.label}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[12px] text-stone-500 mt-0.5 leading-relaxed line-clamp-1">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
          
          {selectedAgent && (
            <button
              onClick={() => { onSelectAgent(''); onClose(); }}
              className="w-full text-left px-4 py-3 rounded-2xl border border-stone-100 hover:border-red-200 hover:bg-red-50/50 transition-all duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-stone-800">清除选择</span>
                  <p className="text-[12px] text-stone-400 mt-0.5">返回通用对话模式</p>
                </div>
              </div>
            </button>
          )}
        </div>
        
        <div className="h-4" />
      </div>
    </>
  );
}
