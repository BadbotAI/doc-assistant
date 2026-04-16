import { useState, useRef } from 'react';
import { ConversationSidebar } from '@/app/components/ConversationSidebar';
import { MessageStream } from '@/app/components/MessageStream';
import type { Message, CapabilityCard, MessageAttachment, ParsingState } from '@/app/components/MessageStream';
import type { Document } from '@/app/components/DocumentContext';
import { InputArea } from '@/app/components/InputArea';
import type { AgentType, InputAreaRef } from '@/app/components/InputArea';
import { QuickActionTags } from '@/app/components/QuickActionTags';
import { FileManager } from '@/app/components/FileManager';
import { DocumentComparisonViewer } from '@/app/components/DocumentComparisonViewer';
import { DocumentPreview } from '@/app/components/DocumentPreview';
import type { DocumentAnnotation } from '@/app/components/DocumentPreview';
import { FilePreviewPanel } from '@/app/components/FilePreviewPanel';
import type { PreviewFile } from '@/app/components/FilePreviewPanel';
import { ConversationFileList } from '@/app/components/ConversationFileList';
import { FolderOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  date: Date;
  messages: Message[];
  documents: Document[];
  isFavorited?: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/** Generate a concise conversation title from user query + optional file name */
function generateTitle(query: string, fileName?: string): string {
  const q = query.trim();
  // If query is short enough, use it directly
  if (q.length > 0 && q.length <= 16) return q;
  // Extract core action from longer queries
  if (q.length > 16) {
    // Try to extract "verb + object" pattern
    const patterns = [
      /(?:帮我|请|麻烦)?(分析|审核|校验|总结|对比|解读|提取|整理|检查|翻译|计算|优化|评估|审查|梳理|归纳)(?:一下)?(.{2,10})/,
      /(.{2,10})(?:的)?(分析|审核|校验|总结|对比|解读|整理|检查|翻译|计算|优化|评估|审查)/,
    ];
    for (const p of patterns) {
      const m = q.match(p);
      if (m) return `${m[2] || m[1]}${m[1] === m[2] ? '' : m[1] || m[2]}`;
    }
    return q.slice(0, 16) + '...';
  }
  // Fallback to file name
  if (fileName) {
    const nameOnly = fileName.replace(/\.[^.]+$/, '');
    return nameOnly.length > 16 ? nameOnly.slice(0, 14) + '...' : nameOnly;
  }
  return '新对话';
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Mock响应数据库 - 根据关键词匹配返回不同的回复
const mockResponsesByKeyword: Record<string, string> = {
  // 信息分析相关
  '业务流程': '关于业务流程信息的分析，我建议从以下几个维度入手：\n\n**信息梳理**\n- 流程节点信息：识别关键环节和数据点\n- 数据流向分析：追踪信息在流程中的传递\n- 瓶颈识别：找出信息流通的阻塞点\n\n**分析输出**\n- 流程图谱：可视化展示信息流向\n- 效率指标：量化分析处理时间\n- 改进建议：基于数据提供优化方案\n\n需要我详细展开某个方面吗？',
  '信息': '信息提取与分析结果：\n\n**信息类型识别**\n- 结构化数据：表格、数值、指标\n- 非结构化数据：文本、描述、评论\n- 关联信息：引用、链接、依赖关系\n\n**关键信息提取**\n- 核心要点：3个主要观点\n- 支撑数据：5组关键数据\n- 结论建议：2条行动建议\n\n**分析洞察**\n基于提取的信息，我发现了几个值得关注的趋势和模式。',
  '市场': '市场趋势洞察分析：\n\n**当前市场态势**\n- 行业增长率：15-20%年增长\n- 用户需求变化：个性化、智能化趋势明显\n- 竞争格局：市场集中度提升\n\n**机会点识别**\n- 细分市场：垂直领域存在机会\n- 技术创新：AI、大数据应用空间大\n- 用户体验：体验优化是核心竞争力\n\n建议您重点关注用户需求变化和技术创新结合点。',
  '资源': '资源优化配置建议：\n\n**人力资源**\n- 技能匹配度分析\n- 培训体系建设\n- 激励机制优化\n\n**资金资源**\n- 投入产出比评估\n- 成本结构优化\n- 现金流管理\n\n**技术资源**\n- 系统整合与优化\n- 技术债务清理\n- 基础设施升级\n\n您希望深入了解哪个资源类型？',
  '风险': '风险评估与管理方案：\n\n**风险识别**\n- 市场风险：需求波动、竞争加剧\n- 运营风险：流程断点、人员流失\n- 技术风险：系统故障、安全漏洞\n- 合规风险：政策变化、法律纠纷\n\n**应对策略**\n- 建立风险预警机制\n- 制定应急预案\n- 定期风险评审\n- 购买商业保险\n\n建议优先处理高概率、高影响的风险项。',

  // 合规相关
  '合规': '合规性审查详细报告：\n\n**符合项**\n- 数据处理流程符合GDPR要求\n- 安全措施达到行业标准\n- 文档记录完整规范\n\n**需改进项**\n- 用户知情同意流程需细化\n- 数据备份策略需加强\n- 应急响应预案需完善\n\n**改进建议**\n1. 建立数据分类分级制度\n2. 加强员工合规培训\n3. 完善审计追踪机制\n\n整体评估：中低风险，建议3个月内完成改进。',
  '政策': '最新政策解读：\n\n**政策要点**\n- 数据安全法：加强数据生命周期管理\n- 个人信息保护法：强化用户权益保护\n- 网络安全法：提升安全防护能力\n\n**应对措施**\n- 建立首席数据官(CDO)制度\n- 完善隐私政策和用户协议\n- 加强安全技术投入\n- 定期开展合规审计\n\n建议尽快启动合规体系建设项目。',

  // 数值校验相关
  '计算': '数值校验报告：\n\n**校验项目**\n- 样本数量核验：1,250 通过\n- 平均值校验：12,568.05 通过\n- 中位数校验：11,200.00 通过\n- 标准差校验：3,456.78 通过\n\n**数据质量评估**\n- 完整性：98.5%\n- 准确性：99.2%\n- 一致性：97.8%\n\n**异常检测**\n- 发现离群值：5个\n- 缺失数据：12条\n- 逻辑错误：0处\n\n建议：对标记的离群值进行人工复核。',
  '校验': '数据准确性校验完成：\n\n**通过项**\n- 数值格式验证：100%通过\n- 计算逻辑验证：无错误\n- 关联性检查：数据一致\n\n**需确认项**\n- 异常值检测：发现3处异常\n- 数据范围检查：2处超出预期范围\n\n**校验详情**\n异常1：数值偏离均值3倍标准差\n异常2：时间序列出现突变\n异常3：与历史数据趋势不符\n\n建议逐项核实异常数据的来源和准确性。',
  '财务': '财务数据分析报告：\n\n**收入分析**\n- 总收入：8,560,000\n- 主营收入：7,820,000 (91.4%)\n- 其他收入：740,000 (8.6%)\n\n**成本分析**\n- 总成本：5,230,000\n- 成本率：61.1%\n- 较上期：-3.2%\n\n**利润分析**\n- 毛利润：3,330,000\n- 毛利率：38.9%\n- 净利润：2,150,000\n- 净利率：25.1%\n\n财务状况良好，建议继续保持成本控制。',

  // 文档相关
  '文档': '文档分析完成：\n\n**文档信息**\n- 格式：PDF\n- 页数：45页\n- 字数：约12,000字\n- 章节：6个主要章节\n\n**内容摘要**\n本文档详细阐述了产品规划、市场定位、技术架构、运营策略等内容。重点关注用户体验优化和技术创新。\n\n**关键发现**\n- 目标用户群体明确\n- 技术方案可行性高\n- 运营策略较完善\n- 风险评估需补充\n\n建议补充竞品分析和风险应对方案。',
  '分析': '深度分析结果：\n\n核心观点\n基于文档内容和市场环境，我识别出3个关键机会点和2个主要风险点。\n\n机会点\n1. 市场空白：垂直领域竞争较少\n2. 技术优势：AI能力领先同行\n3. 用户粘性：高频使用场景\n\n风险点\n1. 资金需求：初期投入较大\n2. 团队能力：需要补强技术团队\n\n可行性评分\n- 市场可行性：85分\n- 技术可行性：90分\n- 商业可行性：78分\n\n综合评估：建议推进，但需做好风险管控。',
};

// 默认响应
const mockResponses: Record<string, string> = {
  business: '从信息分析的角度来看，这个问题包含多个关键维度。我建议您关注以下几点：\n\n1. 信息提取与整理：识别核心数据\n2. 趋势分析：发现数据变化规律\n3. 决策支持：基于分析提供建议\n\n需要我深入分析其中某个方面吗？',
  compliance: '合规审核结果如下：\n\n[通过] 符合行业标准要求\n[通过] 满足监管政策规定\n[注意] 建议关注以下风险点：\n  - 数据隐私保护措施\n  - 操作流程记录完整性\n\n整体评估：低风险',
  calculation: '数值校验完成：\n\n[通过] 数据准确性检查：通过\n[通过] 一致性验证：通过\n[注意] 发现潜在问题：2处\n\n校验结果：\n- 总计核验：125,680.50 通过\n- 平均值核：12,568.05 通过\n- 增长率核验：15.8% 通过\n\n建议进一步核查标记的问题项。',
  document: '我已经完成了对文档的分析，以下是关键发现：\n\n文档概要\n- 文档类型已识别\n- 主要内容已提取\n- 关键信息已整理\n\n分析建议\n如需深入了解特定内容，请告诉我您关注的重点方向。',
};

// 根据消息内容获取智能响应
function getSmartResponse(message: string, agentType: AgentType): string {
  // 检查是否匹配关键词
  for (const [keyword, response] of Object.entries(mockResponsesByKeyword)) {
    if (message.includes(keyword)) {
      return response;
    }
  }
  
  // 返回默认响应
  return mockResponses[agentType || 'business'] || mockResponses['business'];
}

const agentNames: Record<string, string> = {
  business: '通用文档助手',
  compliance: '通用文档助手',
  calculation: '通用文档助手',
  document: '通用文档助手',
};

// Agent欢迎消息配置
interface AgentConfig {
  message: string;
  capabilities: Array<{ title: string; description: string; query: string }>;
}

const agentWelcomeConfig: Record<string, AgentConfig> = {
  business: {
    message: '你好！我是通用文档助手，专注于帮助您分析各类文档、提取关键洞察。我可以为您提供专业的信息整理、数据解读和决策支持。',
    capabilities: [
      { 
        title: '信息提取与整理', 
        description: '从海量信息中提取关键内容',
        query: '帮我从文档中提取关键信息，并按主题分类整理，突出重点内容和核心观点'
      },
      { 
        title: '数据趋势分析', 
        description: '分析数据变化趋势和规律',
        query: '请分析文档中的数据趋势，识别变化规律、拐点和异常波动，并给出趋势预测'
      },
      { 
        title: '报告生成', 
        description: '生成结构化的分析报告',
        query: '帮我生成一份内容详尽、逻辑严谨、结构清晰的分析报告，包含摘要、关键发现和建议'
      },
      { 
        title: '决策建议', 
        description: '基于信息分析提供决策建议',
        query: '基于当前信息分析，为我提供可行的决策方案，包括优劣势分析和风险评估'
      },
    ],
  },
  compliance: {
    message: '你好！我是通用文档助手，致力于帮助您确保业务符合相关法律法规和行业标准。我会为您提供全面的合规检查和风险评估。',
    capabilities: [
      { 
        title: '合规性审查', 
        description: '检查文档和流程的合规性',
        query: '请对文档进行全面的合规性审查，检查是否符合相关法律法规和行业标准要求'
      },
      { 
        title: '风险识别', 
        description: '发现潜在的合规风险点',
        query: '帮我识别文档和流程中的潜在合规风险，评估风险等级并提供预警建议'
      },
      { 
        title: '政策解读', 
        description: '解读最新法规政策要求',
        query: '请解读相关的最新法规政策，说明核心要求、适用范围和合规要点'
      },
      { 
        title: '整改建议', 
        description: '提供具体的合规整改方案',
        query: '针对发现的合规问题，提供详细的整改方案，包括具体措施、时间节点和责任分工'
      },
    ],
  },
  calculation: {
    message: '你好！我是通用文档助手，擅长进行数据准确性校验和数值核查。我可以帮助您验证数据的正确性、发现异常值、确保数据质量。',
    capabilities: [
      { 
        title: '数据准确性校验', 
        description: '验证数据计算的正确性',
        query: '请校验文档中的数据计算，验证公式准确性、逻辑正确性和结果一致性'
      },
      { 
        title: '异常值检测', 
        description: '识别数据中的异常和错误',
        query: '帮我检测数据中的异常值、离群点和可疑数据，分析异常原因并提供处理建议'
      },
      { 
        title: '数值一致性核查', 
        description: '检查不同来源数据的一致性',
        query: '核查不同来源、不同时间点的数据一致性，发现差异并分析产生原因'
      },
      { 
        title: '质量评估报告', 
        description: '生成数据质量评估报告',
        query: '生成完整的数据质量评估报告，包含准确性、完整性、一致性评分和改进建议'
      },
    ],
  },
  document: {
    message: '你好！我是通用文档助手，专门帮助您理解和分析各类文档内容。我可以快速提取关键信息、总结要点，让您高效处理文档工作。',
    capabilities: [
      { 
        title: '内容提取', 
        description: '快速提取文档关键信息',
        query: '请快速提取文档中的关键信息，包括核心数据、重要观点、关键人物和时间节点'
      },
      { 
        title: '文档摘要', 
        description: '生成精炼的文档摘要',
        query: '帮我生成精炼的文档摘要，概括主要内容、核心结论，控制在300字以内'
      },
      { 
        title: '对比分析', 
        description: '对比多个文档的异同',
        query: '对比分析多个文档的内容差异，找出相同点、不同点和矛盾之处，并提供统一建议'
      },
      { 
        title: '问答解析', 
        description: '基于文档内容回答问题',
        query: '基于文档内容，回答我关于具体细节、背景信息、数据来源等方面的问题'
      },
    ],
  },
};

// 生成模拟的文档预览内容
function generateMockPreviewContent(fileName: string, mimeType: string): any {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    return {
      title: baseName,
      sections: [
        { type: 'heading', content: '一、概述' },
        { type: 'text', content: `本文档"${baseName}"包含详细的业务分析数据和关键指标信息。以下为主要内容摘要，数据采集周期为2024年10月至12月。` },
        { type: 'heading', content: '二、核心内容' },
        { type: 'text', content: '根据最新数据统计，本季度各项指标表现稳定，主要业务线均保持正增长态势。其中核心业务收入占比保持在85%以上，显示出良好的业务结构稳定性。' },
        { type: 'subheading', content: '2.1 关键财务指标' },
        { type: 'table', content: [
          ['指标', '本期', '上期', '变动'],
          ['营业收入', '8,560万', '7,420万', '+15.3%'],
          ['净利润', '2,150万', '1,905万', '+12.8%'],
          ['毛利率', '38.9%', '36.2%', '+2.7pp'],
          ['经营现金流', '2,010万', '1,750万', '+14.9%'],
        ]},
        { type: 'subheading', content: '2.2 业务板块拆分' },
        { type: 'text', content: '核心业务持续保持行业领先地位，本季度收入5,820万，占总收入68.0%。拓展业务增长强劲，同比增幅22.5%，收入达1,450万。服务收入保持稳定增长态势，同比+8.3%。' },
        { type: 'heading', content: '三、运营分析' },
        { type: 'text', content: '运营效率整体保持在行业前列。人均产出同比提升7.2%，单位获客成本同比下降9.8%。客户留存率维持在82.1%的较高水平，客户满意度评分4.3/5.0。' },
        { type: 'list', content: [
          '人均产出：26.8万/人/季（同比+7.2%）',
          '获客成本：3,120元/人（同比-9.8%）',
          '客户留存率：82.1%',
          '活跃客户数：10,720（+14.5%）',
        ]},
        { type: 'heading', content: '四、总结与建议' },
        { type: 'text', content: '综合以上分析，当前整体运营状况良好。建议继续保持现有业务优势，同时关注新兴市场机会，优化资源配置效率。' },
        { type: 'text', content: '下一步重点工作：（1）推进核心业务的精细化运营；（2）加快拓展业务在二三线城市的布局；（3）持续优化成本结构，提升整体利润率水平。' },
      ]
    };
  }
  if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return {
      title: baseName,
      sections: [
        { type: 'heading', content: '1. 文档概述' },
        { type: 'text', content: `本文档"${baseName}"旨在提供全面的业务说明和操作指南，帮助相关人员理解核心流程和规范要求。` },
        { type: 'heading', content: '2. 主要内容' },
        { type: 'list', content: [
          '业务流程标准化管理方案',
          '关键质量控制措施',
          '跨部门协作机制与接口规范',
          '异常处理流程与应急预案',
        ]},
        { type: 'subheading', content: '2.1 质量控制措施' },
        { type: 'text', content: '质量管理采用分级管控策略：A级事项实行实时监控，发现异常60分钟内响应；B级事项每日巡检，发现问题8小时内处理；C级事项按周汇总复核。' },
        { type: 'subheading', content: '2.2 跨部门协作' },
        { type: 'text', content: '各部门间通过内部工单系统进行协作，需求方提交申请后，供给方应在3个工作日内完成响应。紧急事项走快速通道，2小时内响应。' },
        { type: 'heading', content: '3. 实施计划' },
        { type: 'text', content: '建议按照三个阶段实施：准备阶段（2周）、试运行阶段（4周）、正式运行阶段（持续优化）。各阶段需要明确负责人和交付物。' },
        { type: 'table', content: [
          ['阶段', '时长', '关键产出', '负责人'],
          ['准备阶段', '2周', '需求文档+技术方案', '产品部'],
          ['试运行', '4周', '测试报告+优化清单', '运营部'],
          ['正式运行', '持续', '月度运营报告', '运营部'],
        ]},
        { type: 'heading', content: '4. 变更记录' },
        { type: 'text', content: '上一次修订为2024年9月，主要更新了异常处理流程和跨部门协作时效要求。' },
      ]
    };
  }
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
    return {
      sheets: [{
        name: '数据汇总',
        headers: ['项目', '数值', '占比', '同比变动', '状态'],
        rows: [
          ['核心业务', '5,820万', '68.0%', '+16.2%', '增长'],
          ['拓展业务', '1,450万', '16.9%', '+22.5%', '快速增长'],
          ['服务收入', '890万', '10.4%', '+8.3%', '稳定'],
          ['其他收入', '400万', '4.7%', '-2.1%', '下降'],
          ['合计', '8,560万', '100%', '+15.3%', '—'],
        ]
      }]
    };
  }
  if (mimeType.includes('image')) {
    return null;
  }
  return {
    title: baseName,
    sections: [
      { type: 'heading', content: '文档内容' },
      { type: 'text', content: `正在展示"${baseName}"的解析内容。文档已成功识别和提取关键信息。` },
    ]
  };
}

// 从MIME类型获取简单文件类型
function getSimpleFileType(mimeType: string, fileName: string): string {
  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) return 'pdf';
  if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'docx';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) return 'xlsx';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('json') || fileName.endsWith('.json')) return 'json';
  return 'pdf';
}

// 检测是否为审核请求
function isReviewRequest(message: string): boolean {
  return /审核|审查|合规|检查风险|风险审查|修订模式|分析风险点|review/.test(message);
}

// 生成模拟的合规审核标注
function generateReviewAnnotations(fileType: string, previewContent: any): DocumentAnnotation[] {
  if (!previewContent) return [];

  if (fileType === 'pdf' && previewContent.sections) {
    const annotations: DocumentAnnotation[] = [];
    const sections = previewContent.sections;

    // 遍历sections找出text类型并标注
    sections.forEach((section: any, idx: number) => {
      if (section.type === 'text' && idx === 1) {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'medium',
          title: '信息披露不完整',
          comment: '文档概述部分缺少关键信息披露：未说明数据统计周期、样本范围和数据来源。根据《信息披露管理办法》第十二条，需确保信息完整性。',
          suggestion: '建议补充数据统计的起止时间、覆盖的业务范围、数据采集方式和来源系统等关键信息。',
          highlightText: '详细的业务分析数据和关键指标信息',
        });
      }
      if (section.type === 'text' && idx === 3) {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'high',
          title: '数据准确性存疑',
          comment: '核心业务收入占比"85%以上"为模糊表述，不符合财务报告准确性要求。根据《企业会计准则》第三十条，财务数据应精确到小数点后两位。',
          suggestion: '建议将"85%以上"替换为精确数值（如85.23%），并注明计算口径和对应科目。',
          highlightText: '核心业务收入占比保持在85%以上',
        });
      }
      if (section.type === 'table') {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'low',
          title: '表格数据格式建议',
          comment: '财务指标表中变动列使用百分比格式一致性良好，但缺少绝对值变动额，可能影响阅读者对变动幅度的直观判断。',
          suggestion: '建议增加"变动额"列，同时展示绝对值变化和百分比变化，提升数据可读性。',
        });
      }
      if (section.type === 'text' && idx === sections.length - 1) {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'high',
          title: '风险提示缺失',
          comment: '总结部分仅提及正面评价，未包含任何风险提示或不利因素说明。根据《上市公司信息披露管理办法》，报告应当包含前瞻性陈述的风险警示。',
          suggestion: '建议增加风险因素章节，包括：市场风险、政策风险、运营风险等，并说明可能对业务产生的影响。',
          highlightText: '建议继续保持现有业务优势',
        });
      }
    });
    return annotations;
  }

  if (fileType === 'docx' && previewContent.sections) {
    const annotations: DocumentAnnotation[] = [];
    const sections = previewContent.sections;

    sections.forEach((section: any, idx: number) => {
      if (section.type === 'text' && idx === 1) {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'medium',
          title: '适用范围不明确',
          comment: '文档提到"帮助相关人员理解核心流程"，但未明确界定"相关人员"的具体范围和权限级别，可能导致敏感信息泄露。',
          suggestion: '建议增加"适用对象"章节，明确规定文档的阅读权限、分发范围和保密级别。',
          highlightText: '帮助相关人员理解核心流程和规范要求',
        });
      }
      if (section.type === 'list' && idx === 3) {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'high',
          title: '应急预案合规缺陷',
          comment: '"异常处理流程与应急预案"作为列表项过于简略，缺少具体的响应时效、上报机制和责任人指定。根据ISO 27001标准第A.16条，应急预案需要详细的执行步骤。',
          suggestion: '建议将应急预案独立成章，包含：事件分级标准、响应时限要求、上报流程图、恢复步骤和事后评估机制。',
        });
      }
      if (section.type === 'text' && idx === sections.length - 1) {
        annotations.push({
          sectionIndex: idx,
          riskLevel: 'low',
          title: '时间节点缺少约束',
          comment: '实施计划提到"各阶段需要明确负责人和交付物"，但未给出具体的里程碑日期和验收标准。',
          suggestion: '建议附加甘特图或时间表，为每个阶段指定具体的完成日期、负责人和可量化的交付标准。',
        });
      }
    });
    return annotations;
  }

  if (fileType === 'xlsx' && previewContent.sheets) {
    // 对表格数据做行级别标注
    return [
      {
        sectionIndex: 1003, // row index 3 (其他收入)
        riskLevel: 'high',
        title: '异常下降需关注',
        comment: '"其他收入"同比下降2.1%，是唯一出现负增长的业务线。连续两个季度下降可能触发内部审计关注阈值。',
        suggestion: '建议补充该收入类别下降的详细原因分析，并评估是否为结构性问题或一次性因素。',
      },
      {
        sectionIndex: 1001, // row index 1 (拓展业务)
        riskLevel: 'medium',
        title: '增速异常偏高',
        comment: '"拓展业务"同比增长22.5%显著高于其他业务线，需验证是否存在收入确认时点不当的风险。',
        suggestion: '建议复核拓展业务的收入确认政策，确认是否符合权责发生制原则，特别关注跨期交易。',
      },
      {
        sectionIndex: 1004, // 合计行
        riskLevel: 'low',
        title: '汇总数据校验',
        comment: '合计行数值与各项分项加总结果一致，校验通过。但建议保留计算审计痕迹。',
        suggestion: '建议在数据源中增加自动校验公式，并在报告附注中说明数据汇总规则。',
      },
    ];
  }

  return [];
}

// 生成审核风险摘要（用于对话流）
function generateReviewSummaryResponse(files: PreviewFile[], allAnnotations: Map<string, DocumentAnnotation[]>): string {
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;

  const fileResults: string[] = [];

  files.forEach(file => {
    const anns = allAnnotations.get(file.id) || [];
    const high = anns.filter(a => a.riskLevel === 'high');
    const medium = anns.filter(a => a.riskLevel === 'medium');
    const low = anns.filter(a => a.riskLevel === 'low');
    totalHigh += high.length;
    totalMedium += medium.length;
    totalLow += low.length;

    if (anns.length > 0) {
      const items = anns.map(a => {
        const tag = a.riskLevel === 'high' ? '[高]' : a.riskLevel === 'medium' ? '[中]' : '[低]';
        return `  ${tag} **${a.title}**：${a.comment.slice(0, 60)}...`;
      }).join('\n');
      fileResults.push(`**${file.name}**\n${items}`);
    }
  });

  const riskScore = totalHigh >= 3 ? '高风险' : totalHigh >= 1 ? '中高风险' : totalMedium >= 2 ? '中风险' : '低风险';

  return `合规审核报告已完成。我已在左侧文档预览中标注了所有发现的风险条款。\n\n**整体风险评级：${riskScore}**\n\n**风险概览**\n- 高风险：${totalHigh} 项\n- 中风险：${totalMedium} 项\n- 低风险：${totalLow} 项\n\n---\n\n${fileResults.join('\n\n')}\n\n---\n\n**整改建议优先级**\n1. 立即处理：${totalHigh} 项高风险问题（数据准确性、风险提示缺失等）\n2. 计划整改：${totalMedium} 项中风险问题（信息披露、适用范围等）\n3. 持续优化：${totalLow} 项低风险建议（格式规范、校验增强等）\n\n您可以点击左侧预览面板中的标注查看每条风险的详细描述和整改建议。如需针对某项风险进一步讨论，请随时告诉我。`;
}

// 生成跟进建议（根据AI回复内容和Agent类型）
function generateFollowUpSuggestions(message: string, _agentType: string): string[] {
  if (message.includes('风险评级') || message.includes('风险概览')) {
    return [
      '详细解释高风险项的法规依据',
      '生成合规整改行动计划',
      '评估整改后的合规性等级',
    ];
  }
  if (message.includes('审核') || message.includes('合规')) {
    return [
      '对标注的风险项逐条分析',
      '生成完整的审核报告文档',
      '列出需要优先处理的合规问题',
    ];
  }
  if (message.includes('校验') || message.includes('数值')) {
    return [
      '请给出异常值的详细计算过程',
      '按重要程度排序所有校验结果',
      '生成可视化的校验对比图表',
    ];
  }
  if (message.includes('文档') || message.includes('分析')) {
    return [
      '对关键数据进行深度解读',
      '帮我总结核心结论和建议',
      '生成结构化的分析报告',
    ];
  }
  if (message.includes('对比') || message.includes('差异')) {
    return [
      '哪些差异点需要重点关注？',
      '帮我合并两份文档的优势内容',
      '生成差异分析报告',
    ];
  }
  // 默认建议
  return [
    '请进一步展开详细分析',
    '帮我整理成结构化报告',
    '还有哪些值得关注的重点？',
  ];
}

// 生成对比模式的差异标注
function generateComparisonAnnotations(fileType: string, previewContent: any, side: 'left' | 'right'): DocumentAnnotation[] {
  if (!previewContent) return [];

  if ((fileType === 'pdf' || fileType === 'docx') && previewContent.sections) {
    if (side === 'left') {
      return [
        {
          sectionIndex: 1,
          riskLevel: 'diff-changed' as const,
          title: '概述表述差异',
          comment: '概述部分的描述角度不同 -- 本文档侧重数据采集说明，对比文档侧重战略定位。',
          highlightText: previewContent.sections[1]?.content?.slice(0, 20),
        },
        {
          sectionIndex: 3,
          riskLevel: 'diff-changed' as const,
          title: '核心数据差异',
          comment: '核心业务描述的数据口径不同。本文档强调结构稳定性，对比文档强调增速变化。',
          highlightText: previewContent.sections[3]?.content?.slice(0, 25),
        },
        {
          sectionIndex: 8,
          riskLevel: 'diff-removed' as const,
          title: '运营数据差异',
          comment: '本文档的运营指标（人均产出26.8万、获客成本3,120元）与对比文档（28.6万、2,850元）存在差异，需确认数据来源。',
          highlightText: previewContent.sections[8]?.content?.slice(0, 20),
        },
      ];
    } else {
      return [
        {
          sectionIndex: 1,
          riskLevel: 'diff-changed' as const,
          title: '概述表述差异',
          comment: '概述部分的描述角度不同 -- 本文档侧重战略定位，对比文档侧重数据采集说明。',
          highlightText: previewContent.sections[1]?.content?.slice(0, 20),
        },
        {
          sectionIndex: 8,
          riskLevel: 'diff-changed' as const,
          title: '运营数据差异',
          comment: '运营指标数据与对比文档存在差异，本文档数据更新，建议以本文档为准。',
          highlightText: previewContent.sections[8]?.content?.slice(0, 20),
        },
        {
          sectionIndex: 10,
          riskLevel: 'diff-added' as const,
          title: '新增风险章节',
          comment: '本文档独有"风险与挑战"章节，对比文档中未包含。建议评估是否需要补充到对比文档。',
          highlightText: previewContent.sections[10]?.content?.slice(0, 20),
        },
        {
          sectionIndex: previewContent.sections.length - 1,
          riskLevel: 'diff-added' as const,
          title: '新增具体措施',
          comment: '本文档在战略展望后新增了具体执行措施清单，比对比文档更加完整。',
          highlightText: previewContent.sections[previewContent.sections.length - 1]?.content?.slice(0, 20),
        },
      ];
    }
  }

  if (fileType === 'xlsx' && previewContent.sheets) {
    if (side === 'left') {
      return [
        { sectionIndex: 1001, riskLevel: 'diff-changed' as const, title: '数值差异', comment: '拓展业务数值与对比文档存在差异：本文档为1,450万，对比文档为1,380万，偏差5.1%。' },
        { sectionIndex: 1003, riskLevel: 'diff-removed' as const, title: '仅本文档包含', comment: '"其他收入"行仅出现在本文档，对比文档中无此分类项。' },
      ];
    } else {
      return [
        { sectionIndex: 1001, riskLevel: 'diff-changed' as const, title: '数值差异', comment: '拓展业务数值与对比文档存在差异：本文档为1,380万，对比文档为1,450万，偏差5.1%。' },
        { sectionIndex: 1002, riskLevel: 'diff-added' as const, title: '本文档新增行', comment: '"创新业务"为本文档新增分类，对比文档中按不同方式归类。' },
      ];
    }
  }

  return [];
}

// 生成对比用的第二份文档预览内容（模拟数据变体）
function generateVariantPreviewContent(fileName: string, mimeType: string): any {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    return {
      title: baseName,
      sections: [
        { type: 'heading', content: '一、概述' },
        { type: 'text', content: `本文档"${baseName}"聚焦业务发展趋势和战略规划，以下为关键数据和分析结论。报告期为2024年第四季度，数据覆盖全部业务板块。` },
        { type: 'heading', content: '二、业绩综述' },
        { type: 'text', content: '本季度整体业绩呈上升趋势，各业务板块均实现正增长。核心业务增速放缓至12%，但拓展业务保持高速增长，同比增幅达到22.5%，成为新的增长引擎。' },
        { type: 'subheading', content: '2.1 关键财务指标' },
        { type: 'table', content: [
          ['指标', '本期', '上期', '变动'],
          ['营业收入', '8,280万', '7,150万', '+15.8%'],
          ['净利润', '2,080万', '1,830万', '+13.7%'],
          ['毛利率', '37.5%', '35.8%', '+1.7pp'],
          ['经营现金流', '1,920万', '1,680万', '+14.3%'],
        ]},
        { type: 'subheading', content: '2.2 业务板块拆分' },
        { type: 'text', content: '拓展业务本季度贡献收入1,380万，占总收入16.7%，较上季度提升2.3个百分点。创新业务虽然体量较小（480万），但同比增速达到45.2%，预计下一季度将突破600万规模。' },
        { type: 'heading', content: '三、运营分析' },
        { type: 'text', content: '运营效率方面，人均产出同比提升8.6%，单位获客成本下降12.3%。客户留存率从82.1%提升至85.7%，主要得益于新推出的会员服务体系和精细化运营策略。' },
        { type: 'list', content: [
          '人均产出：28.6万/人/季（同比+8.6%）',
          '获客成本：2,850元/人（同比-12.3%）',
          '客户留存率：85.7%（+3.6pp）',
          '活跃客户数：12,680（+18.2%）',
        ]},
        { type: 'heading', content: '四、风险与挑战' },
        { type: 'text', content: '当前面临的主要风险包括：市场竞争加剧导致核心业务增速放缓；原材料成本波动影响毛利率稳定性；部分新兴市场的政策不确定性增大。' },
        { type: 'heading', content: '五、战略展望' },
        { type: 'text', content: '展望下一阶段，建议加大对拓展业务的投入力度，同时完善风险管理体系。重点关注市场竞争态势变化和政策法规更新，确保业务可持续增长。' },
        { type: 'text', content: '具体措施包括：（1）设立创新业务专项基金，预算不低于总收入的5%；（2）建立市场预警机制，提前应对行业政策变化；（3）推进数字化转型，年内完成核心业务系统升级。' },
      ]
    };
  }
  if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return {
      title: baseName,
      sections: [
        { type: 'heading', content: '1. 文档概述' },
        { type: 'text', content: `本文档"${baseName}"定义了业务运营的标准操作规程，适用于全体运营团队成员。本次修订重点更新了质量管理与监控体系章节。` },
        { type: 'heading', content: '2. 核心流程' },
        { type: 'list', content: [
          '业务流程标准化管理方案',
          '质量管理与监控体系',
          '跨部门数据共享协议',
          '应急响应与灾难恢复预案',
        ]},
        { type: 'subheading', content: '2.1 质量管理体系（修订）' },
        { type: 'text', content: '质量管理采用分级管控策略：A级事项实行实时监控，发现异常30分钟内响应；B级事项每日巡检，发现问题4小时内处理；C级事项按周汇总复核。' },
        { type: 'subheading', content: '2.2 跨部门协作机制' },
        { type: 'text', content: '各部门间建立标准化数据接口，通过统一的数据中台实现信息共享。需求方提交数据申请后，供给方应在2个工作日内完成响应。' },
        { type: 'heading', content: '3. 执行时间表' },
        { type: 'text', content: '分三个阶段推进：第一阶段（1个月）完成基础搭建，第二阶段（3个月）完成试运行和优化，第三阶段进入正式运营并建立持续改进机制。' },
        { type: 'table', content: [
          ['阶段', '时长', '关键产出', '负责人'],
          ['基础搭建', '1个月', '系统部署+流程文档', '技术部'],
          ['试运行', '3个月', '试运行报告+优化方案', '运营部'],
          ['正式运营', '持续', '月度运营报告', '运营部'],
        ]},
        { type: 'heading', content: '4. 变更记录' },
        { type: 'text', content: '本次修订主要变更：更新质量管理响应时效要求（A级从60分钟缩短至30分钟）；新增数据中台协作流程；调整试运行阶段时长（从2个月延长至3个月）。' },
      ]
    };
  }
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
    return {
      sheets: [{
        name: '数据汇总（修订版）',
        headers: ['项目', '数值', '占比', '同比变动', '状态'],
        rows: [
          ['核心业务', '5,620万', '67.9%', '+14.8%', '增长'],
          ['拓展业务', '1,380万', '16.7%', '+20.1%', '快速增长'],
          ['创新业务', '480万', '5.8%', '+45.2%', '高速增长'],
          ['服务收入', '790万', '9.6%', '+6.5%', '稳定'],
          ['合计', '8,270万', '100%', '+14.8%', '—'],
        ]
      }]
    };
  }
  return generateMockPreviewContent(fileName, mimeType);
}

export default function App() {
  // 创建一些模拟的对话历史数据
  const createMockConversations = (): Conversation[] => {
    const now = new Date();
    
    return [
      {
        id: '2',
        title: '2024年度财务报告分析',
        timestamp: '15:30',
        date: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2小时前
        isFavorited: true,
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: '帮我分析一下2024年度财务报告',
            timestamp: '15:30',
            attachments: [
              { id: 'a-d1', name: '2024年度财务报告.pdf', type: 'application/pdf', size: '2.3 MB', status: 'ready' as const },
            ],
          },
          {
            id: 'm2',
            role: 'assistant',
            content: '从信息分析的角度，这份财务报告涉及多个维度的数据。我建议您关注以下几点：\n\n1. 关键财务指标趋势\n2. 收入与成本结构分析\n3. 现金流状况评估\n\n需要我深入分析其中某个方面吗？',
            timestamp: '15:31',
            agentType: '通用文档助手',
          },
        ],
        documents: [
          { id: 'd1', name: '2024年度财务报告.pdf', type: 'application/pdf', size: '2.3 MB', status: 'ready' as const },
        ],
      },
      {
        id: '3',
        title: '产品需求文档审核',
        timestamp: '昨天 14:20',
        date: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1天前
        isFavorited: true,
        messages: [
          {
            id: 'm3',
            role: 'user',
            content: '请帮我审核这份产品需求文档的合规性',
            timestamp: '14:20',
            attachments: [
              { id: 'a-d2', name: '产品需求文档V2.1.docx', type: 'application/msword', size: '1.8 MB', status: 'ready' as const },
              { id: 'a-d3', name: '竞品分析报告.pdf', type: 'application/pdf', size: '4.1 MB', status: 'ready' as const },
            ],
          },
          {
            id: 'm4',
            role: 'assistant',
            content: '合规审核结果如下：\n\n[通过] 符合行业标准要求\n[通过] 满足监管政策规定\n[注意] 建议关注以下风险点：\n  - 数据隐私保护措施\n  - 操作流程记录完整性\n\n整体评估：低风险',
            timestamp: '14:21',
            agentType: '通用文档助手',
          },
        ],
        documents: [
          { id: 'd2', name: '产品需求文档V2.1.docx', type: 'application/msword', size: '1.8 MB', status: 'ready' as const },
          { id: 'd3', name: '竞品分析报告.pdf', type: 'application/pdf', size: '4.1 MB', status: 'ready' as const },
        ],
      },
      {
        id: '4',
        title: '数据分析校验',
        timestamp: '昨天 10:15',
        date: new Date(now.getTime() - 28 * 60 * 60 * 1000), // 1天多前
        messages: [
          {
            id: 'm5',
            role: 'user',
            content: '帮我校验这个数据表中的数值',
            timestamp: '10:15',
            attachments: [
              { id: 'a-d4', name: '销售数据表Q4.xlsx', type: 'application/vnd.ms-excel', size: '890 KB', status: 'ready' as const },
            ],
          },
          {
            id: 'm6',
            role: 'assistant',
            content: '数值校验完成：\n\n[通过] 数据准确性：通过\n[通过] 计算一致性：通过\n[注意] 发现异常值：3处\n\n详细校验结果：\n- 总计验证：125,680.50 通过\n- 平均值验证：12,568.05 通过\n- 增长率验证：15.8% 通过\n\n建议复核标记的异常值。',
            timestamp: '10:16',
            agentType: '通用文档助手',
          },
        ],
        documents: [
          { id: 'd4', name: '销售数据表Q4.xlsx', type: 'application/vnd.ms-excel', size: '890 KB', status: 'ready' as const },
        ],
      },
      {
        id: '5',
        title: '会议记录整理建议',
        timestamp: '01/27 16:45',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2天前
        messages: [
          {
            id: 'm7',
            role: 'user',
            content: '如何更好地整理会议记录？',
            timestamp: '16:45',
          },
          {
            id: 'm8',
            role: 'assistant',
            content: '从信息分析的角度，会议记录整理需要关注以下几点：\n\n1. 信息结构化：按议题分类整理\n2. 关键决策提取：标注重要决定\n3. 待办事项跟踪：明确责任人和时间点\n\n需要我详细说明某个方面吗？',
            timestamp: '16:46',
            agentType: '通用文档助手',
          },
        ],
        documents: [],
      },
      {
        id: '6',
        title: '产品界面设计分析',
        timestamp: '01/28 09:30',
        date: new Date(now.getTime() - 36 * 60 * 60 * 1000), // 1.5天前
        messages: [
          {
            id: 'm9',
            role: 'user',
            content: '请帮我分析这个产品截图的界面设计',
            timestamp: '09:30',
          },
          {
            id: 'm10',
            role: 'assistant',
            content: '从信息分析的角度，我对这个界面设计进行了以下分析：\n\n**界面布局分析**\n- 整体结构清晰，信息层级合理\n- 功能区域划分明确\n- 视觉引导流畅\n\n**视觉设计**\n- 配色方案协调统一\n- 字体层级清晰\n- 留白适度，不显拥挤\n\n**改进建议**\n1. 可以考虑增强关键操作的视觉突出度\n2. 某些文字内容可以进一步精简\n\n整体评价：设计质量较高，用户体验良好。',
            timestamp: '09:31',
            agentType: '通用文档助手',
          },
        ],
        documents: [],
      },
    ];
  };

  const [conversations, setConversations] = useState<Conversation[]>(createMockConversations());
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [activeAgentType, setActiveAgentType] = useState<AgentType>(null);
  const [activeQuickTag, setActiveQuickTag] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [documentChatMode, setDocumentChatMode] = useState<{ fileId: string; fileName: string; fileType: string; previewContent?: any } | null>(null);
  const [hasExitedDocumentMode, setHasExitedDocumentMode] = useState(false); // 追踪是否从文档模式退出
  const [parsingState, setParsingState] = useState<ParsingState | null>(null);
  const [filePreviewPanel, setFilePreviewPanel] = useState<{ files: PreviewFile[]; activeFileId: string } | null>(null);
  const [welcomeKey, setWelcomeKey] = useState(0);
  const [showConversationFiles, setShowConversationFiles] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [welcomeFilesUploaded, setWelcomeFilesUploaded] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const inputAreaRef = useRef<InputAreaRef>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  /** Simulate streaming output: add message first with empty content, then reveal char by char */
  const streamResponse = (convId: string, fullContent: string, extras?: Partial<Message>) => {
    const msgId = generateId();
    // Add message with empty content
    const msg: Message = {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: formatTime(),
      agentType: '通用文档助手',
      ...extras,
    };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, msg] } : c));
    setThinkingStatus(null);

    // Stream characters
    let i = 0;
    const charsPerTick = 3;
    const interval = setInterval(() => {
      i += charsPerTick;
      if (i >= fullContent.length) {
        // Done — set final content with followUpSuggestions
        setConversations(prev => prev.map(c => {
          if (c.id !== convId) return c;
          return { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, content: fullContent, followUpSuggestions: extras?.followUpSuggestions || generateFollowUpSuggestions(fullContent, '通用文档助手') } : m) };
        }));
        setIsProcessing(false);
        clearInterval(interval);
      } else {
        setConversations(prev => prev.map(c => {
          if (c.id !== convId) return c;
          return { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, content: fullContent.slice(0, i) } : m) };
        }));
      }
    }, 30);
  };

  const handleNewConversation = () => {
    // 重置退出文档模式标志
    setHasExitedDocumentMode(false);
    setWelcomeFilesUploaded(false);
    // 清除活跃对话，回到欢迎页（不创建空对话）
    setActiveConversationId('');
    setActiveAgentType(null);
    // 退出文档+对话双栏模式
    setDocumentChatMode(null);
    // 关闭文件预览面板
    setFilePreviewPanel(null);
    setShowConversationFiles(false);
    setParsingState(null);
    // 退出文件管理器
    setShowFileManager(false);
    // 重置快捷标签
    setActiveQuickTag(null);
    // 强制刷新欢迎页（即使已在欢迎页）
    setWelcomeKey(prev => prev + 1);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // 重置退出文档模式标志
    setHasExitedDocumentMode(false);
    // 如果在文件管理器页面，返回到对话页面
    if (showFileManager) {
      setShowFileManager(false);
    }
    // 退出文档+对话双栏模式
    setDocumentChatMode(null);
    // 关闭文件预览面板
    setFilePreviewPanel(null);
    setShowConversationFiles(false);
    setParsingState(null);
  };

  const handleDeleteConversation = (id: string) => {
    const filteredConversations = conversations.filter((c) => c.id !== id);
    
    if (filteredConversations.length === 0) {
      // 所有对话已删除，回到欢迎页
      setConversations([]);
      setActiveConversationId('');
    } else {
      setConversations(filteredConversations);
      if (activeConversationId === id) {
        setActiveConversationId(filteredConversations[0].id);
      }
    }
  };

  const handleToggleFavorite = (id: string) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, isFavorited: !c.isFavorited } : c)
    );
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title: newTitle.trim() } : c)
    );
  };

  const handleSendMessage = async (message: string, agentType: AgentType, attachments?: MessageAttachment[]) => {
    // 重置退出文档模式标志
    setHasExitedDocumentMode(false);
    setActiveQuickTag(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: formatTime(),
      attachments: attachments,
    };

    // Add attachments to conversation documents for tracking
    const newDocuments: Document[] = attachments
      ? attachments.map((att) => ({
          id: att.id,
          name: att.name,
          type: att.type,
          size: att.size,
          status: 'ready' as const,
        }))
      : [];

    // 如果没有活跃对话，创建一个新对话（带欢迎消息+用户消息）
    let targetConvId = activeConversationId;
    let currentDocs: Document[] = activeConversation?.documents || [];

    if (!activeConversation) {
      const newTitle = generateTitle(message, attachments?.[0]?.name);

      const newConversation: Conversation = {
        id: generateId(),
        title: newTitle,
        timestamp: formatDate(),
        date: new Date(),
        messages: [userMessage],
        documents: [...newDocuments],
      };

      targetConvId = newConversation.id;
      currentDocs = newConversation.documents;
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
    } else {
      // 更新会话标题（如果用户还没发过消息）
      const hasUserMessage = activeConversation.messages.some(m => m.role === 'user');
      const newTitle = !hasUserMessage
        ? generateTitle(message, attachments?.[0]?.name)
        : activeConversation.title;

      currentDocs = [...activeConversation.documents, ...newDocuments];
      setConversations(
        conversations.map((c) =>
          c.id === activeConversationId
            ? { 
                ...c, 
                messages: [...c.messages, userMessage],
                documents: currentDocs,
                title: newTitle,
                timestamp: formatDate(),
                date: new Date(),
              }
            : c
        )
      );
    }

    // 检测是否包含"对比"关键词，且有至少2个文档
    const isComparisonQuery = (message.includes('对比') || message.includes('比较')) && 
                              currentDocs.length >= 2;

    setIsProcessing(true);
    setThinkingStatus('思考中...');

    // === 文件附件解析流程 ===
    if (attachments && attachments.length > 0) {
      setThinkingStatus(null); // 文件流程用parsingState，不用thinkingStatus
      const convId = targetConvId;
      const parsingFiles = attachments.map(att => ({
        id: att.id,
        name: att.name,
        type: att.type,
        progress: 0,
      }));

      // 启动解析动画
      setParsingState({ files: parsingFiles, stage: '正在解析文件结构...', isComplete: false });

      // Stage 1: 0 → 25%
      setTimeout(() => {
        setParsingState(prev => prev ? {
          ...prev,
          files: prev.files.map(f => ({ ...f, progress: 25 })),
          stage: '提取文本内容...',
        } : null);
      }, 1200);

      // Stage 2: 25 → 50%
      setTimeout(() => {
        setParsingState(prev => prev ? {
          ...prev,
          files: prev.files.map(f => ({ ...f, progress: 50 })),
          stage: '识别文档结构...',
        } : null);
      }, 2400);

      // Stage 3: 50 → 80%
      setTimeout(() => {
        setParsingState(prev => prev ? {
          ...prev,
          files: prev.files.map(f => ({ ...f, progress: 80 })),
          stage: '构建分析索引...',
        } : null);
      }, 3800);

      // Stage 4: 80 → 95%
      setTimeout(() => {
        setParsingState(prev => prev ? {
          ...prev,
          files: prev.files.map(f => ({ ...f, progress: 95 })),
          stage: '完成分析准备...',
        } : null);
      }, 5000);

      // Complete: 100%
      setTimeout(() => {
        setParsingState(prev => prev ? {
          ...prev,
          files: prev.files.map(f => ({ ...f, progress: 100 })),
          stage: '解析完成',
          isComplete: true,
        } : null);
      }, 5800);

      // After parsing complete: clear parsing state, show thinking, then stream response
      setTimeout(() => {
        setParsingState(null);
        setThinkingStatus('思考中...');

        // Build preview files
        const previewFiles: PreviewFile[] = attachments.map(att => ({
          id: att.id,
          name: att.name,
          type: getSimpleFileType(att.type, att.name),
          previewContent: generateMockPreviewContent(att.name, att.type),
        }));

        // 检测是否为审核请求 — 如果是，在解析完成后立即添加标注
        const isReview = isReviewRequest(message);
        if (isReview) {
          previewFiles.forEach(file => {
            file.annotations = generateReviewAnnotations(file.type, file.previewContent);
          });
        }

        // 检测是否为对比请求 — 如果是，在解析完成后切换为对比预览
        const isComparison = isComparisonQuery && previewFiles.length >= 2;
        if (isComparison) {
          const leftFile = { ...previewFiles[0], annotations: generateComparisonAnnotations(previewFiles[0].type, previewFiles[0].previewContent, 'left') };
          const rightMime = previewFiles[1].type === 'pdf' ? 'application/pdf' : previewFiles[1].type === 'docx' ? 'application/msword' : 'application/vnd.ms-excel';
          const rightContent = generateVariantPreviewContent(previewFiles[1].name, rightMime);
          const rightFile: PreviewFile = { ...previewFiles[1], previewContent: rightContent, annotations: generateComparisonAnnotations(previewFiles[1].type, rightContent, 'right') };
          previewFiles[0] = leftFile;
          previewFiles[1] = rightFile;
        }

        // Open file preview panel
        setFilePreviewPanel({
          files: previewFiles,
          activeFileId: isComparison ? '__comparison__' : previewFiles[0].id,
        });

        // Build response text
        let docResponse: string;
        if (isComparison) {
          docResponse = `文档对比分析已完成，我已在右侧预览面板中并排展示两份文档，并用颜色标注了所有差异点。\n\n**差异概览**\n- 新增内容：对比文档中新增的段落或数据\n- 已删除：仅原文档包含的内容\n- 内容变更：两份文档中表述不同的部分\n\n**主要发现**\n1. **概述部分**：两份文档的描述角度不同 -- 原文档侧重数据，对比文档侧重趋势\n2. **核心数据**：营业收入差异 280万（8,560万 vs 8,280万），毛利率差异 1.4pp\n3. **结论部分**：原文档偏向现状描述，对比文档增加了战略展望\n\n建议重点关注数据差异部分，确认哪份文档的数据更准确。`;
        } else if (isReview) {
          const allAnnotations = new Map<string, DocumentAnnotation[]>();
          previewFiles.forEach(f => allAnnotations.set(f.id, f.annotations || []));
          docResponse = generateReviewSummaryResponse(previewFiles, allAnnotations);
        } else {
          docResponse = `我已完成对${attachments.length > 1 ? '这些' : '该'}文档的解析。以下是分析结果：\n\n**文档概览**\n${attachments.map(a => `- ${a.name}（${a.size}）`).join('\n')}\n\n**初步分析**\n文档内容已成功提取和索引。我可以为您进行以下操作：\n\n1. **内容摘要** -- 快速了解文档核心内容\n2. **关键数据提取** -- 提取重要数据和指标\n3. **深度分析** -- 对特定主题进行深入解读\n4. **问答交互** -- 基于文档内容回答问题\n\n请告诉我您想从哪个方向开始？您也可以在左侧预览面板中查看文档原文。`;
        }

        // 思考 2s 后开始流式输出
        setTimeout(() => {
          streamResponse(convId, docResponse);
        }, 2000);
      }, 6500);

      return; // 文件流程已处理，跳过默认的AI响应
    }

    // === 普通消息流程 ===
    // 思考中 → 生成回复中
    setTimeout(() => setThinkingStatus('生成回复中...'), 1500);

    // 模拟AI处理延迟 (3-4秒思考后开始流式输出)
    setTimeout(() => {
      // === 审核请求检测：当预览面板已打开时 ===
      if (isReviewRequest(message) && filePreviewPanel) {
        const updatedFiles = filePreviewPanel.files.map(file => {
          const annotations = generateReviewAnnotations(file.type, file.previewContent);
          return { ...file, annotations };
        });
        setFilePreviewPanel(prev => prev ? { ...prev, files: updatedFiles } : null);

        const allAnnotations = new Map<string, DocumentAnnotation[]>();
        updatedFiles.forEach(f => allAnnotations.set(f.id, f.annotations || []));
        const reviewResponse = generateReviewSummaryResponse(updatedFiles, allAnnotations);
        streamResponse(targetConvId, reviewResponse);
        return;
      }

      // === 对比请求检测：当预览面板已打开且有多个文件时 ===
      if ((message.includes('对比') || message.includes('比较')) && filePreviewPanel && filePreviewPanel.files.length >= 2) {
        const files = filePreviewPanel.files;
        const leftFile = { ...files[0], annotations: generateComparisonAnnotations(files[0].type, files[0].previewContent, 'left') };
        const rightMime = files[1].type === 'pdf' ? 'application/pdf' : files[1].type === 'docx' ? 'application/msword' : 'application/vnd.ms-excel';
        const rightContent = generateVariantPreviewContent(files[1].name, rightMime);
        const rightFile: PreviewFile = { ...files[1], previewContent: rightContent, annotations: generateComparisonAnnotations(files[1].type, rightContent, 'right') };
        setFilePreviewPanel({ files: [leftFile, rightFile], activeFileId: '__comparison__' });

        const comparisonResponse = `文档对比分析已完成，我已在右侧预览面板中并排展示两份文档，并用颜色标注了所有差异点。\n\n**差异概览**\n- 新增内容：对比文档中新增的段落或数据\n- 已删除：仅原文档包含的内容\n- 内容变更：两份文档中表述不同的部分\n\n**主要发现**\n1. **概述部分**：两份文档的描述角度不同 -- 原文档侧重数据，对比文档侧重趋势\n2. **核心数据**：营业收入差异 280万（8,560万 vs 8,280万），毛利率差异 1.4pp\n3. **结论部分**：原文档偏向现状描述，对比文档增加了战略展望\n\n建议重点关注数据差异部分，确认哪份文档的数据更准确。`;
        streamResponse(targetConvId, comparisonResponse);
        return;
      }

      // === 导出请求检测：用户说"导出"时生成AI文件 ===
      const isExportRequest = /导出|生成.*报告|生成.*文件|输出.*PDF|输出.*文档/.test(message);
      if (isExportRequest) {
        const topicMatch = message.match(/导出(.+?)(?:的|$)|生成(.+?)(?:报告|文件)|输出(.+?)(?:PDF|文档)/);
        const topic = (topicMatch?.[1] || topicMatch?.[2] || topicMatch?.[3] || '分析报告').trim();
        const exportFileName = `${topic}.pdf`;

        const exportAttachment: MessageAttachment = {
          id: generateId(),
          name: exportFileName,
          type: 'application/pdf',
          size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
          status: 'ready',
          isAiGenerated: true,
        };

        // 自动打开文件预览器
        const previewFile: PreviewFile = {
          id: exportAttachment.id,
          name: exportAttachment.name,
          type: 'pdf',
          previewContent: generateMockPreviewContent(exportFileName, 'application/pdf'),
        };
        setFilePreviewPanel({ files: [previewFile], activeFileId: previewFile.id });

        const exportResponse = `已为您生成文档：**${exportFileName}**\n\n**文档概要**\n- 格式：PDF\n- 内容：基于当前对话上下文整理的${topic}内容\n- 包含：摘要、核心数据、分析结论、建议\n\n您可以点击下方文件卡片预览或下载该文档。如需调整内容或格式，请告诉我。`;
        streamResponse(targetConvId, exportResponse, {
          attachments: [exportAttachment],
          followUpSuggestions: ['调整报告格式', '补充更多数据', '导出Word版本'],
        });
        return;
      }

      const response = getSmartResponse(message, agentType);
      streamResponse(targetConvId, response);
    }, 3000 + Math.random() * 1000);
  };

  const handleCapabilityClick = (capability: CapabilityCard) => {
    const query = capability.query || `请详细介绍一下${capability.title}`;
    inputAreaRef.current?.setInputMessage(query);
  };

  const handleSuggestionClick = (query: string) => {
    handleSendMessage(query, 'business');
  };

  const handleUploadDocuments = (files: FileList) => {
    // 即使没有活跃对话也允许上传（文件会在InputArea中暂存，发送时创建对话）
    // Create attachments and add to InputArea's pending state
    const attachments: MessageAttachment[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size),
      status: 'uploading' as const,
    }));

    // Pass to InputArea as pending inline attachments
    inputAreaRef.current?.addPendingAttachments(attachments);

    // 在欢迎页上传文件时，隐藏案例卡片
    if (!activeConversation) {
      setWelcomeFilesUploaded(true);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!activeConversation) return;

    setConversations(
      conversations.map((c) =>
        c.id === activeConversationId
          ? { ...c, documents: c.documents.filter((d) => d.id !== docId) }
          : c
      )
    );

    const systemMessage: Message = {
      id: generateId(),
      role: 'system',
      content: '文档已从上下文中移除',
      timestamp: formatTime(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, systemMessage] }
          : c
      )
    );
  };

  // 删除消息中的附件（同时从文档列表中移除）
  const handleDeleteAttachment = (messageId: string, attachmentId: string) => {
    if (!activeConversation) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;

        // Remove attachment from the message
        const updatedMessages = c.messages.map((m) => {
          if (m.id !== messageId) return m;
          const updatedAttachments = m.attachments?.filter((a) => a.id !== attachmentId);
          return { ...m, attachments: updatedAttachments };
        })
        // Remove messages that have no attachments left and no content
        .filter((m) => {
          if (m.attachments && m.attachments.length === 0 && !m.content) return false;
          return true;
        });

        // Remove from documents
        const updatedDocuments = c.documents.filter((d) => d.id !== attachmentId);

        return { ...c, messages: updatedMessages, documents: updatedDocuments };
      })
    );
  };

  const handleAnalyzeFile = (fileName: string, fileId: string, fileType?: string, previewContent?: any) => {
    // 创建新会话
    const newConversation: Conversation = {
      id: generateId(),
      title: `分析：${fileName}`,
      timestamp: formatDate(),
      date: new Date(),
      messages: [],
      documents: [],
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversation.id);
    
    // 进入文档+对话双栏模式
    setDocumentChatMode({
      fileId,
      fileName,
      fileType: fileType || 'pdf',
      previewContent
    });
    
    // 返回到对话页面（最后设置，确保先设置好双栏模式）
    setShowFileManager(false);
  };

  const handleAnalyzeMultipleFiles = (fileNames: string[], fileIds: string[]) => {
    setShowFileManager(false);

    const query = fileNames.length === 1
      ? `请帮我分析这份文档：${fileNames[0]}`
      : `请帮我分析这 ${fileNames.length} 份文档，列出各文档的核心内容和关键差异`;

    // Create new conversation
    const newConversation: Conversation = {
      id: generateId(),
      title: generateTitle(query, fileNames[0]),
      timestamp: formatDate(),
      date: new Date(),
      messages: [],
      documents: [],
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversation.id);

    // Fill input with query and attach files
    setTimeout(() => {
      inputAreaRef.current?.setInputMessage(query);
      // Create mock attachments for the selected files
      const attachments: MessageAttachment[] = fileNames.map((name, i) => ({
        id: `batch-${fileIds[i]}`,
        name,
        type: name.split('.').pop() || 'file',
        size: '',
        status: 'ready' as const,
      }));
      inputAreaRef.current?.addPendingAttachments(attachments);
    }, 100);
  };

  const handleSelectAgent = (_agentType: string) => {
    // No-op: agent selection removed
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-app="ai-assistant">
      {/* Left Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        activeAgentType={activeAgentType}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onToggleFavorite={handleToggleFavorite}
        onRenameConversation={handleRenameConversation}
        onOpenFileManager={() => setShowFileManager(true)}
        onSelectAgent={handleSelectAgent}
        hidden={!!filePreviewPanel || !!documentChatMode || showFileManager}
        documents={conversations.flatMap(c => c.documents.map(d => ({ id: d.id, name: d.name })))}
        isFileManagerActive={showFileManager}
      />

      {/* Main Content Area - 根据状态显示对话页面或文件管理器 */}
      {showFileManager ? (
        <FileManager 
          onBack={() => setShowFileManager(false)} 
          onAnalyzeFile={handleAnalyzeFile}
          onAnalyzeMultipleFiles={handleAnalyzeMultipleFiles}
          onSelectConversation={handleSelectConversation}
        />
      ) : documentChatMode ? (
        /* 文档+对话双栏模式 */
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧对话区 */}
          <div className="w-[420px] min-w-[380px] flex flex-col bg-white flex-shrink-0">
            {/* Conversation Header */}
            <div className="flex items-center justify-between px-5 h-[52px] flex-shrink-0 border-b border-border bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-medium text-foreground truncate">
                  {activeConversation?.title || `分析：${documentChatMode.fileName}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setDocumentChatMode(null);
                  setHasExitedDocumentMode(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>退出</span>
              </button>
            </div>

            {/* Message Stream */}
            <MessageStream
              messages={activeConversation?.messages || []}
              onCapabilityClick={handleCapabilityClick}
              onDeleteAttachment={handleDeleteAttachment}
              parsingState={parsingState}
              thinkingStatus={thinkingStatus}
              onSuggestionClick={handleSuggestionClick}
              compact
            />

            {/* Input Area */}
            <div className="border-t border-border bg-white">
              <InputArea
                ref={inputAreaRef}
                onSendMessage={handleSendMessage}
                onUploadDocuments={handleUploadDocuments}
                disabled={isProcessing}
                defaultAgentType={activeAgentType}
              />
            </div>
          </div>

          {/* 右侧文档预览 */}
          <div className="flex-1 border-l border-border min-w-0">
            <DocumentPreview
              fileName={documentChatMode.fileName}
              fileType={documentChatMode.fileType}
              previewContent={documentChatMode.previewContent}
              onClose={() => { setDocumentChatMode(null); setHasExitedDocumentMode(true); }}
              onOpenFileManager={() => { setDocumentChatMode(null); setShowFileManager(true); }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          <div className={`flex flex-col overflow-hidden min-w-0 ${
            filePreviewPanel
              ? 'w-[340px] min-w-[280px] flex-shrink-0'
              : 'flex-1'
          }`}>
        {/* Welcome / Empty state */}
        {(!activeConversation?.messages || activeConversation.messages.length === 0) && !hasExitedDocumentMode ? (
          <AnimatePresence mode="wait">
          <motion.div
            key={welcomeKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-end pb-8 bg-white overflow-y-auto"
          >
            <div className="w-full max-w-[960px] flex flex-col items-center px-8">
              {/* Greeting */}
              <div className="text-center space-y-3 mb-3">
                <h1 className="text-[26px] font-semibold text-foreground tracking-tight leading-tight" style={{ fontFamily: "'Noto Serif SC', 'Georgia', serif" }}>我是你的文档解读助手</h1>
                <p className="text-[13px] text-muted-foreground max-w-md mx-auto">上传文档，我来分析、解读、审查</p>
              </div>

              {/* Input */}
              <div className="w-full">
                <InputArea
                  ref={inputAreaRef}
                  onSendMessage={handleSendMessage}
                  onUploadDocuments={handleUploadDocuments}
                  disabled={isProcessing}
                  defaultAgentType={activeAgentType}
                />
              </div>

              {/* Tags — 紧贴输入框下方 */}
              <div className="w-full -mt-1">
              <QuickActionTags
                activeTag={activeQuickTag}
                onTagClick={(label, text) => {
                  setActiveQuickTag(label);
                  inputAreaRef.current?.setInputMessage(text);
                }}
              />
              </div>

              {/* Case Study Cards — disappear when files uploaded */}
              <AnimatePresence>
                {!welcomeFilesUploaded && (
                  <motion.div
                    className="w-full mt-8 px-6"
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    <p className="text-[11.5px] text-muted-foreground/50 text-center mb-3 tracking-wide">应用案例</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { title: '合同条款提取与对比', subtitle: '自动识别合同关键条款，多版本差异对比', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop', query: '请帮我提取合同中的关键条款，并对比不同版本之间的差异' },
                        { title: '财务报表数据审核', subtitle: '关键财务指标校验与异常值检测', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop', query: '请帮我审核财务报表数据，校验关键指标并检测异常值' },
                        { title: '政策文件合规审查', subtitle: '对标法规条文，自动识别合规风险', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop', query: '请帮我审查政策文件的合规性，对标法规条文识别潜在风险' },
                        { title: '产品说明书摘要', subtitle: '多语言文档快速摘要与要点提取', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=200&fit=crop', query: '请帮我生成产品说明书的摘要，提取核心要点' },
                      ].map((cs) => (
                          <div
                            key={cs.title}
                            className="group rounded-xl border border-border bg-white hover:border-primary/25 hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer"
                            onClick={() => handleSendMessage(cs.query, '通用文档助手')}
                          >
                            <div className="h-[72px] overflow-hidden">
                              <img src={cs.image} alt={cs.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="text-[12.5px] font-medium text-foreground group-hover:text-primary transition-colors">{cs.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{cs.subtitle}</p>
                            </div>
                          </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          </AnimatePresence>
        ) : (
          <>
            {/* Conversation Title + gradient fade */}
            <div className={`${filePreviewPanel ? 'px-4' : 'px-6'} flex-shrink-0 relative border-b border-border`}>
              <div className={`${filePreviewPanel ? 'max-w-none' : 'max-w-[880px]'} mx-auto min-h-[42px] flex items-center gap-2`}>
                {editingTitle && activeConversation ? (
                  <input
                    autoFocus
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onBlur={() => { handleRenameConversation(activeConversation.id, editTitleValue); setEditingTitle(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameConversation(activeConversation.id, editTitleValue); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
                    className={`${filePreviewPanel ? 'text-[15px]' : 'text-[18px]'} font-semibold text-foreground tracking-tight flex-1 bg-transparent border-b-2 border-primary outline-none`}
                    style={{ fontFamily: "'Noto Serif SC', 'Georgia', serif" }}
                  />
                ) : (
                  <h1
                    className={`${filePreviewPanel ? 'text-[15px]' : 'text-[18px]'} font-semibold text-foreground tracking-tight flex-1 cursor-pointer hover:text-primary/80 transition-colors`}
                    style={{ fontFamily: "'Noto Serif SC', 'Georgia', serif" }}
                    onClick={() => { if (activeConversation) { setEditTitleValue(activeConversation.title); setEditingTitle(true); } }}
                    title="点击编辑标题"
                  >
                    {activeConversation?.title || '对话'}
                  </h1>
                )}
                {filePreviewPanel && filePreviewPanel.files.length > 0 && (
                  <button
                    onClick={() => setShowConversationFiles(prev => !prev)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      showConversationFiles
                        ? 'text-primary bg-primary/10'
                        : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                    }`}
                    title={showConversationFiles ? '收起文件列表' : '显示文件列表'}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Message Stream */}
            <MessageStream
              messages={activeConversation?.messages ?? []}
              onCapabilityClick={handleCapabilityClick}
              onDeleteAttachment={handleDeleteAttachment}
              onOpenFile={(att) => {
                const pf: PreviewFile = {
                  id: att.id,
                  name: att.name,
                  type: att.type.includes('pdf') ? 'pdf' : att.type.includes('word') || att.type.includes('doc') ? 'docx' : 'pdf',
                  previewContent: generateMockPreviewContent(att.name, att.type),
                };
                setFilePreviewPanel({ files: [pf], activeFileId: pf.id });
              }}
              parsingState={parsingState}
              thinkingStatus={thinkingStatus}
              onSuggestionClick={handleSuggestionClick}
              compact={!!filePreviewPanel}
            />

            {/* Input Area */}
            <div className="flex-shrink-0">
              <InputArea
                ref={inputAreaRef}
                onSendMessage={handleSendMessage}
                onUploadDocuments={handleUploadDocuments}
                disabled={isProcessing}
                defaultAgentType={activeAgentType}
                isCompact={!!filePreviewPanel}
              />
            </div>
          </>
        )}
          </div>

          {/* Conversation File List - between chat and preview */}
          {filePreviewPanel && showConversationFiles && (
            <div className="w-[280px] flex-shrink-0 border-l border-border">
              <ConversationFileList
                files={filePreviewPanel.files}
                activeFileId={filePreviewPanel.activeFileId}
                onSelectFile={(id) => setFilePreviewPanel(prev => prev ? { ...prev, activeFileId: id } : null)}
                onClose={() => setShowConversationFiles(false)}
              />
            </div>
          )}

          {/* File Preview Panel - right side when active */}
          {filePreviewPanel && (
            <div className="flex-1 min-w-[380px] border-l border-border">
              <FilePreviewPanel
                files={filePreviewPanel.files}
                activeFileId={filePreviewPanel.activeFileId}
                onChangeActiveFile={(id) => setFilePreviewPanel(prev => prev ? { ...prev, activeFileId: id } : null)}
                onClose={() => setFilePreviewPanel(null)}
                onOpenFileManager={() => { setFilePreviewPanel(null); setShowFileManager(true); }}
                hideDocSwitcher={showConversationFiles}
              />
            </div>
          )}

          {/* Document Panel Overlay */}
          {showDocumentPanel && activeConversation && activeConversation.messages.length > 0 && (
            <>
              <div
                className="fixed inset-0 bg-black/8 z-40"
                onClick={() => setShowDocumentPanel(false)}
              />

              <div className="absolute top-0 right-0 bottom-0 w-[320px] bg-white border-l border-border z-50 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.06)]">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-5 h-[52px] border-b border-border">
                  <h3 className="text-[14px] font-semibold text-foreground">对话文档</h3>
                  <button
                    onClick={() => setShowDocumentPanel(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Document List */}
                <div className="flex-1 overflow-auto p-4">
                  {activeConversation.documents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <FolderOpen className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-[13px] text-muted-foreground">暂无文档</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeConversation.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-slate-50 rounded-xl border border-border hover:border-slate-200 transition-colors duration-150 cursor-pointer group"
                          onClick={() => console.log('Navigate to document:', doc.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-foreground truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[12px] text-muted-foreground">{doc.size}</span>
                                {doc.status === 'ready' && (
                                  <span className="text-[12px] text-primary font-medium">就绪</span>
                                )}
                                {doc.status === 'processing' && (
                                  <span className="text-[12px] text-amber-500 font-medium">解析中</span>
                                )}
                                {doc.status === 'uploading' && (
                                  <span className="text-[12px] text-primary font-medium">上传中</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Document Comparison Viewer */}
      {showComparison && activeConversation && activeConversation.documents.length >= 2 && (
        <DocumentComparisonViewer
          documents={activeConversation.documents}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}