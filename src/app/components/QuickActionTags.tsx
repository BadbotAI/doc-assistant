import React from 'react';

const QUICK_TAGS = [
  { label: '总结文档', text: '请总结这份文档的核心内容，列出关键要点，不超过5条' },
  { label: '提取信息', text: '请从文档中提取关键信息，包括但不限于：涉及的主体、关键日期、金额数据、核心条款编号' },
  { label: '条款解读', text: '请识别这份文档中的核心条款，逐条解释其含义和要注意的风险点' },
  { label: '对比文档', text: '请对比我上传的两份文档，列出内容差异，标注新增、删除和修改的部分' },
  { label: '识别表格', text: '请识别文档中的所有表格，提取表格内容并以结构化格式输出' },
  { label: '数值计算', text: '请计算文档表格中的数值汇总，并检查各数值之间的逻辑关系是否一致' },
];

interface QuickActionTagsProps {
  activeTag: string | null;
  onTagClick: (label: string | null, text: string) => void;
}

export function QuickActionTags({ activeTag, onTagClick }: QuickActionTagsProps) {
  return (
    <div className="w-full max-w-[960px] mx-auto px-4 mb-1">
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_TAGS.map((tag) => {
          const isActive = activeTag === tag.label;
          return (
            <button
              key={tag.label}
              onClick={() => {
                const next = isActive ? null : tag.label;
                onTagClick(next, next ? tag.text : '');
              }}
              className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-colors duration-150 cursor-pointer active:scale-[0.97] ${
                isActive
                  ? 'bg-primary/8 border-primary/30 text-primary shadow-[0_0_0_3px] shadow-primary/6'
                  : 'bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}