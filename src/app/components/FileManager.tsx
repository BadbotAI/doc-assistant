import { useState } from 'react';
import { ArrowLeft, Upload, FileText, File, Image, Search, CheckSquare, Trash2, X, Filter, Check, MessageSquare, Eye, Clock, FileSpreadsheet, FileCode, Database, Braces, FolderOpen, Plus, ArrowUpRight, ArrowUpDown, Presentation, FileType } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { DocumentPreview } from '@/app/components/DocumentPreview';

interface FileManagerProps {
  onBack: () => void;
  onAnalyzeFile?: (fileName: string, fileId: string, fileType?: string, previewContent?: any) => void;
  onAnalyzeMultipleFiles?: (fileNames: string[], fileIds: string[]) => void;
  onSelectConversation?: (conversationId: string) => void;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  timestamp: Date;
  thumbnail?: string;
  lastUsed?: Date;
  conversationId?: string;
  previewContent?: any;
}

interface ConversationFolder {
  conversationId: string;
  title: string;
  fileCount: number;
  files: FileItem[];
  lastModified: Date;
  fileTypes: string[];
}

const conversationTitles: Record<string, string> = {
  '2': '2024年度财务报告分析',
  '3': '产品需求文档审核',
  '4': '数据分析表校验',
  '5': '会议记录整理建议',
  '6': '产品界面设计分析',
};

export function FileManager({ onBack, onAnalyzeFile, onAnalyzeMultipleFiles, onSelectConversation }: FileManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'lastUsed' | 'name' | 'type' | 'uploadDate'>('lastUsed');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<Set<string>>(new Set());
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'files'>('files');
  const [activeFolder, setActiveFolder] = useState<ConversationFolder | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 模拟的文件数据
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: '2024年度财务报告.pdf',
      type: 'pdf',
      size: '2.3 MB',
      uploadDate: '2026-01-29',
      timestamp: new Date('2026-01-29 14:30'),
      lastUsed: new Date('2026-01-29 16:00'),
      conversationId: '2',
      previewContent: {
        title: '2024年度财务报告',
        sections: [
          { type: 'heading', content: '一、财务概况' },
          { type: 'text', content: '2024年度公司整体财务状况良好，营业收入实现稳步增长。本年度营业总收入达到8,560万元，较上年同期增长15.3%。净利润2,150万元，同比增长12.8%。' },
          { type: 'heading', content: '二、收入分析' },
          { type: 'text', content: '主营业务收入7,820万元，占总收入的91.4%，主要来源于核心产品销售和服务收入。其他业务收入740万元，占比8.6%，主要包括技术咨询和培训服务。' },
          { type: 'table', content: [
            ['项目', '金额（万元）', '占比'],
            ['主营业务收入', '7,820', '91.4%'],
            ['其他业务收入', '740', '8.6%'],
            ['营业总收入', '8,560', '100%'],
          ]},
          { type: 'heading', content: '三、成本控制' },
          { type: 'text', content: '全年营业成本5,230万元，成本率61.1%，较上年下降3.2个百分点，成本控制效果显著。主要得益于供应链优化和生产效率提升。' },
          { type: 'heading', content: '四、利润情况' },
          { type: 'text', content: '毛利润3,330万元，毛利率38.9%。扣除各项费用后，净利润2,150万元，净利率25.1%，盈利能力持续增强。' },
        ]
      }
    },
    {
      id: '1b',
      name: '2024Q4季报附表.xlsx',
      type: 'xlsx',
      size: '1.1 MB',
      uploadDate: '2026-01-29',
      timestamp: new Date('2026-01-29 14:45'),
      lastUsed: new Date('2026-01-29 16:00'),
      conversationId: '2',
      previewContent: {
        sheets: [{
          name: '季度数据',
          headers: ['季度', '收入', '成本', '利润'],
          rows: [['Q1', '1,850万', '1,120万', '730万'], ['Q2', '2,150万', '1,280万', '870万'], ['Q3', '2,080万', '1,250万', '830万'], ['Q4', '2,480万', '1,580万', '900万']],
        }]
      }
    },
    {
      id: '1c',
      name: '审计意见函.pdf',
      type: 'pdf',
      size: '680 KB',
      uploadDate: '2026-01-29',
      timestamp: new Date('2026-01-29 15:00'),
      lastUsed: new Date('2026-01-29 16:10'),
      conversationId: '2',
      previewContent: {
        title: '审计意见函',
        sections: [
          { type: 'heading', content: '审计意见' },
          { type: 'text', content: '我们审计了XX公司2024年度的财务报表，包括资产负债表、利润表、现金流量表和所有者权益变动表以及财务报表附注。' },
          { type: 'heading', content: '管理层责任' },
          { type: 'text', content: '编制和公允列报财务报表是XX公司管理层的责任，这种责任包括：设计、执行和维护必要的内部控制，以使财务报表不存在由于舞弊或错误导致的重大错报。' },
          { type: 'heading', content: '审计师责任' },
          { type: 'text', content: '我们的责任是在执行审计工作的基础上对财务报表发表审计意见。我们按照中国注册会计师审计准则的规定执行了审计工作。' },
          { type: 'heading', content: '审计结论' },
          { type: 'text', content: '我们认为，XX公司财务报表在所有重大方面按照企业会计准则的规定编制，公允反映了XX公司2024年12月31日的财务状况以及2024年度的经营成果和现金流量。' },
        ]
      }
    },
    {
      id: '1d',
      name: '关联交易明细.docx',
      type: 'docx',
      size: '320 KB',
      uploadDate: '2026-01-29',
      timestamp: new Date('2026-01-29 15:10'),
      lastUsed: new Date('2026-01-29 16:15'),
      conversationId: '2',
      previewContent: {
        title: '关联交易明细',
        sections: [
          { type: 'heading', content: '一、关联方基本情况' },
          { type: 'text', content: '本年度公司与关联方发生的交易总额为1,280万元，较上年增长5.2%。主要关联方包括母公司及其下属子公司。' },
          { type: 'table', content: [
            ['关联方名称', '关系', '交易类型', '金额（万元）'],
            ['XX控股集团', '母公司', '技术服务', '580'],
            ['XX科技有限公司', '子公司', '产品采购', '420'],
            ['XX投资管理公司', '关联企业', '咨询服务', '280'],
          ]},
          { type: 'heading', content: '二、关联交易定价原则' },
          { type: 'text', content: '所有关联交易均按照市场公允价格执行，遵循独立交易原则。定价方法包括可比非受控价格法和成本加成法。' },
        ]
      }
    },
    {
      id: '2',
      name: '产品需求文档.docx',
      type: 'docx',
      size: '456 KB',
      uploadDate: '2026-01-29',
      timestamp: new Date('2026-01-29 10:15'),
      lastUsed: new Date('2026-01-29 15:30'),
      conversationId: '3',
      previewContent: {
        title: '智能对话助手产品需求文档 PRD v1.0',
        sections: [
          { type: 'heading', content: '1. 产品概述' },
          { type: 'text', content: '本产品是一款面向企业用户的智能对话式AI助手，支持多文档分析、多Agent模式切换，旨在提升用户的信息处理效率和决策质量。' },
          { type: 'heading', content: '2. 目标用户' },
          { type: 'list', content: [
            '企业管理者：需要快速获取业务洞察和决策支持',
            '数据分析师：需要高效处理和分析各类文档数据',
            '合规人员：需要进行文档合规性审查',
            '财务人员：需要进行数据校验和财务分析'
          ]},
          { type: 'heading', content: '3. 核心功能' },
          { type: 'subheading', content: '3.1 多文档上传与管理' },
          { type: 'text', content: '支持PDF、Word、Excel、图片等多种格式文档上传，提供文档管理器进行集中管理，支持搜索、筛选、排序等操作。' },
          { type: 'subheading', content: '3.2 AI智能分析' },
          { type: 'list', content: [
            '通用文档助手：专注于信息提取、趋势分析和报告生成',
            '通用文档助手：提供合规性检查和风险评估',
            '通用文档助手：进行数据准确性校验和异常检测',
            '通用文档助手：快速提取关键信息和生成摘要'
          ]},
          { type: 'heading', content: '4. 技术要求' },
          { type: 'text', content: '前端采用React + Tailwind CSS，支持响应式设计。后端需要支持大模型API集成，文档解析能力，以及用户数据安全存储。' },
        ]
      }
    },
    {
      id: '3',
      name: '数据分析表.xlsx',
      type: 'xlsx',
      size: '1.8 MB',
      uploadDate: '2026-01-28',
      timestamp: new Date('2026-01-28 16:45'),
      lastUsed: new Date('2026-01-29 11:20'),
      conversationId: '4',
      previewContent: {
        sheets: [
          {
            name: '销售数据汇总',
            headers: ['月份', '销售额（万元）', '成本（万元）', '利润（万元）', '利润率', '同比增长'],
            rows: [
              ['2024-01', '650', '390', '260', '40.0%', '+12.3%'],
              ['2024-02', '580', '348', '232', '40.0%', '+8.5%'],
              ['2024-03', '720', '432', '288', '40.0%', '+15.2%'],
              ['2024-04', '695', '417', '278', '40.0%', '+11.8%'],
              ['2024-05', '710', '426', '284', '40.0%', '+13.6%'],
              ['2024-06', '735', '441', '294', '40.0%', '+16.9%'],
              ['2024-07', '750', '450', '300', '40.0%', '+14.2%'],
              ['2024-08', '685', '411', '274', '40.0%', '+10.5%'],
              ['2024-09', '715', '429', '286', '40.0%', '+12.7%'],
              ['2024-10', '740', '444', '296', '40.0%', '+15.8%'],
              ['2024-11', '725', '435', '290', '40.0%', '+13.4%'],
              ['2024-12', '855', '513', '342', '40.0%', '+18.9%'],
              ['合计', '8,560', '5,136', '3,424', '40.0%', '+13.6%'],
            ]
          }
        ]
      }
    },
    {
      id: '4',
      name: '产品截图.png',
      type: 'image',
      size: '890 KB',
      uploadDate: '2026-01-28',
      timestamp: new Date('2026-01-28 09:20'),
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
      lastUsed: new Date('2026-01-28 14:00'),
      conversationId: '6',
      previewContent: {
        title: '产品截图',
        sections: [
          { type: 'text', content: '产品主界面截图，展示了数据分析仪表盘的整体布局，包括实时数据监控面板、关键指标卡片、趋势图表和操作导航区域。' },
        ]
      }
    },
    {
      id: '5',
      name: '会议记录.pdf',
      type: 'pdf',
      size: '1.2 MB',
      uploadDate: '2026-01-27',
      timestamp: new Date('2026-01-27 15:30'),
      lastUsed: new Date('2026-01-28 10:00'),
      conversationId: '5',
      previewContent: {
        title: '2026年Q1产品规划会议记录',
        sections: [
          { type: 'metadata', content: '会议时间：2026年1月27日 14:00-16:00\n会议地点：3F会议室\n参会人员：张总、李经理、王主管、刘工程师、陈设计师' },
          { type: 'heading', content: '会议议题' },
          { type: 'list', content: [
            'Q1产品开发计划审议',
            '技术架构优化方案讨论',
            '用户反馈问题处理',
            '下阶段资源分配'
          ]},
          { type: 'heading', content: '讨论要点' },
          { type: 'subheading', content: '1. Q1产品开发计划' },
          { type: 'text', content: '张总：Q1重点推进智能对话助手的多Agent功能，目标是3月底完成开发和测试。李经理补充需要加强文档管理功能，提升用户体验。' },
          { type: 'subheading', content: '2. 技术架构优化' },
          { type: 'text', content: '刘工程师：建议采用微服务架构，提升系统可扩展性。需要评估迁移成本和时间，预计需要2个月完成重构。' },
          { type: 'heading', content: '决议事项' },
          { type: 'list', content: [
            '确认Q1开发计划，3月31日为最终交付日期',
            '技术架构优化方案通过，2月初启动',
            '增加2名前端开发人员支持项目',
            '下次会议时间：2月10日'
          ]},
        ]
      }
    },
    {
      id: '6',
      name: '用户界面设计.png',
      type: 'image',
      size: '3.4 MB',
      uploadDate: '2026-01-26',
      timestamp: new Date('2026-01-26 11:00'),
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
      lastUsed: new Date('2026-01-27 09:00'),
      previewContent: {
        title: '用户界面设计',
        sections: [
          { type: 'text', content: 'UI/UX设计稿，包含产品核心页面的视觉设计方案。采用现代极简风格，以蓝灰色调为主色系，注重信息层级和交互流畅性。' },
          { type: 'heading', content: '设计规范' },
          { type: 'list', content: [
            '主色调：冷蓝灰色系（oklch色彩空间）',
            '圆角：统一0.375rem',
            '字体：Inter / Söhne / Noto Sans SC',
            '间距系统：4px基础网格',
          ]},
        ]
      }
    },
    {
      id: '7',
      name: '用户调研报告.pptx',
      type: 'pptx',
      size: '5.6 MB',
      uploadDate: '2026-01-25',
      timestamp: new Date('2026-01-25 14:20'),
      lastUsed: new Date('2026-01-26 16:00'),
      previewContent: {
        slides: [
          { title: '用户调研报告', subtitle: '2024年度企业用户AI工具使用情况调研', type: 'cover' },
          { title: '调研概况', type: 'content', bullets: ['调研时间：2024年11月-12月','调研对象：500家中大型企业','调研方式：在线问卷 + 深度访谈','有效样本：478份（95.6%）'] },
          { title: '核心发现', type: 'content', bullets: ['78%的企业已经在使用AI工具','最常用场景：文档分析(65%)、数据处理(58%)、内容生成(52%)','主要痛点：准确性不足(42%)、功能单一(38%)、学习成本高(35%)','愿意付费比例：68%，平均预算：5000-15000元/月'] },
          { title: '用户需求优先级', type: 'table', content: [['需求', '重要度', '满意度', '优先级'],['多文档分析', '9.2', '6.5', '高'],['数据准确性', '9.5', '6.8', '高'],['响应速度', '8.8', '7.2', '中'],['界面易用性', '8.5', '7.5', '中'],['自定义能力', '7.8', '6.2', '低']] },
          { title: '下一步行动建议', type: 'content', bullets: ['强化多文档协同分析能力','提升数据处理准确性和可靠性','简化用户操作流程，降低学习成本','开发垂直行业解决方案'] }
        ]
      }
    },
    {
      id: '8',
      name: '营销方案.pdf',
      type: 'pdf',
      size: '2.1 MB',
      uploadDate: '2026-01-20',
      timestamp: new Date('2026-01-20 10:30'),
      lastUsed: new Date('2026-01-25 13:00'),
      previewContent: {
        title: 'Q1市场营销方案',
        sections: [
          { type: 'heading', content: '一、营销目标' },
          { type: 'text', content: 'Q1季度目标：获客3000家企业，转化率15%，实现营收2000万元。重点开拓金融、医疗、教育三大行业。' },
          { type: 'heading', content: '二、目标客户画像' },
          { type: 'list', content: ['企业规模：100-1000人的中型企业','行业分布：金融(30%)、医疗(25%)、教育(20%)、其他(25%)','决策人：CTO、产品总监、业务负责人','预算范围：年度AI工具预算10-50万元'] },
          { type: 'heading', content: '三、营销策略' },
          { type: 'subheading', content: '3.1 内容营销' },
          { type: 'text', content: '每周发布2-3篇行业应用案例，1篇技术深度文章。在知乎、公众号、LinkedIn等平台同步分发，建立专业形象。' },
          { type: 'subheading', content: '3.2 活动营销' },
          { type: 'text', content: '举办3场线上研讨会，1场线下峰会。邀请行业专家分享，展示产品能力，收集潜在客户信息。' },
          { type: 'subheading', content: '3.3 渠道合作' },
          { type: 'text', content: '与5家行业SaaS厂商建立合作，通过API集成和联合营销扩大市场覆盖。' },
          { type: 'heading', content: '四、预算分配' },
          { type: 'table', content: [['项目', '预算（万元）', '占比'],['内容营销', '50', '25%'],['活动营销', '80', '40%'],['渠道合作', '40', '20%'],['广告投放', '30', '15%'],['合计', '200', '100%']] },
        ]
      }
    },
    {
      id: '9',
      name: 'api配置.json',
      type: 'json',
      size: '45 KB',
      uploadDate: '2026-01-29',
      timestamp: new Date('2026-01-29 09:15'),
      lastUsed: new Date('2026-01-29 14:30'),
      previewContent: `{
  "apiVersion": "v2.1",
  "endpoints": {
    "chat": {
      "url": "https://api.example.com/v2/chat",
      "method": "POST",
      "timeout": 30000
    },
    "document": {
      "url": "https://api.example.com/v2/document",
      "method": "POST",
      "maxFileSize": "50MB",
      "supportedFormats": ["pdf", "docx", "xlsx", "pptx", "png", "jpg"]
    }
  },
  "features": {
    "multiDocument": true,
    "comparison": true,
    "export": ["pdf", "docx", "markdown"]
  }
}`
    },
    {
      id: '10',
      name: '销售数据.csv',
      type: 'xlsx',
      size: '890 KB',
      uploadDate: '2026-01-28',
      timestamp: new Date('2026-01-28 13:45'),
      lastUsed: new Date('2026-01-29 10:20'),
      conversationId: '4',
      previewContent: {
        sheets: [{
          name: '区域销售明细',
          headers: ['区域', '客户数', '销售额（万元）', '客单价（万元）', '增长率'],
          rows: [['华东', '156', '2,850', '18.3', '+16.2%'],['华北', '132', '2,340', '17.7', '+14.8%'],['华南', '98', '1,680', '17.1', '+12.5%'],['西南', '45', '890', '19.8', '+18.3%'],['西北', '28', '520', '18.6', '+10.2%'],['东北', '19', '280', '14.7', '+8.5%'],['合计', '478', '8,560', '17.9', '+13.6%']],
        }]
      }
    },
    {
      id: '11',
      name: '配置文件.yaml',
      type: 'json',
      size: '12 KB',
      uploadDate: '2026-01-27',
      timestamp: new Date('2026-01-27 16:00'),
      lastUsed: new Date('2026-01-28 11:30'),
      previewContent: `# 应用配置文件
app:
  name: "智能对话助手"
  version: "2.1.0"
  environment: "production"

server:
  host: "0.0.0.0"
  port: 8080
  workers: 4

database:
  type: "postgresql"
  host: "db.example.com"
  port: 5432

redis:
  host: "cache.example.com"
  port: 6379`
    },
    {
      id: '12',
      name: '数据结构.xml',
      type: 'xml',
      size: '156 KB',
      uploadDate: '2026-01-26',
      timestamp: new Date('2026-01-26 10:30'),
      lastUsed: new Date('2026-01-27 15:00'),
      previewContent: `<?xml version="1.0" encoding="UTF-8"?>
<database name="ai_assistant" version="2.1">
  <table name="users">
    <column name="id" type="bigint" primaryKey="true"/>
    <column name="username" type="varchar" length="50"/>
    <column name="email" type="varchar" length="100"/>
  </table>
  <table name="conversations">
    <column name="id" type="bigint" primaryKey="true"/>
    <column name="user_id" type="bigint"/>
    <column name="title" type="varchar" length="200"/>
  </table>
  <table name="documents">
    <column name="id" type="bigint" primaryKey="true"/>
    <column name="filename" type="varchar" length="255"/>
    <column name="file_type" type="varchar" length="50"/>
  </table>
</database>`
    },
    {
      id: '13',
      name: '大数据集.parquet',
      type: 'parquet',
      size: '12.5 MB',
      uploadDate: '2026-01-25',
      timestamp: new Date('2026-01-25 08:00'),
      lastUsed: new Date('2026-01-26 14:00'),
      previewContent: {
        schema: [
          { name: 'user_id', type: 'INT64' },
          { name: 'timestamp', type: 'TIMESTAMP' },
          { name: 'event_type', type: 'STRING' },
          { name: 'session_id', type: 'STRING' },
          { name: 'page_url', type: 'STRING' },
          { name: 'duration', type: 'INT32' },
          { name: 'device_type', type: 'STRING' },
          { name: 'city', type: 'STRING' },
        ],
        rowCount: 1250000,
        sampleRows: [
          [10234, '2024-01-15 08:23:15', 'page_view', 'sess_89a7f', '/dashboard', 45, 'desktop', '北京'],
          [10235, '2024-01-15 08:23:18', 'click', 'sess_89a8g', '/documents', 12, 'mobile', '上海'],
          [10236, '2024-01-15 08:23:22', 'page_view', 'sess_89a9h', '/chat', 156, 'desktop', '深圳'],
          [10237, '2024-01-15 08:23:25', 'upload', 'sess_89aai', '/upload', 8, 'tablet', '杭州'],
          [10238, '2024-01-15 08:23:30', 'page_view', 'sess_89abj', '/settings', 34, 'desktop', '广州'],
        ],
        compression: 'SNAPPY',
        fileSize: '12.5 MB'
      }
    },
  ];

  // 构建对话文件夹
  const buildFolders = (): { folders: ConversationFolder[]; ungroupedFiles: FileItem[] } => {
    const folderMap = new Map<string, FileItem[]>();
    const ungrouped: FileItem[] = [];
    mockFiles.forEach(file => {
      if (file.conversationId) {
        const existing = folderMap.get(file.conversationId) || [];
        existing.push(file);
        folderMap.set(file.conversationId, existing);
      } else {
        ungrouped.push(file);
      }
    });
    const folders: ConversationFolder[] = Array.from(folderMap.entries()).map(([convId, files]) => {
      const latestDate = files.reduce((latest, f) => {
        const d = f.lastUsed || f.timestamp;
        return d > latest ? d : latest;
      }, new Date(0));
      const types = Array.from(new Set(files.map(f => f.type)));
      return { conversationId: convId, title: conversationTitles[convId] || `对话 ${convId}`, fileCount: files.length, files, lastModified: latestDate, fileTypes: types };
    });
    folders.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return { folders, ungroupedFiles: ungrouped };
  };

  const { folders } = buildFolders();
  const allFiles = mockFiles;

  const filteredFolders = folders.filter(folder => {
    return folder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.files.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredAllFiles = allFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter.size === 0 || fileTypeFilter.has(file.type);
    return matchesSearch && matchesType;
  });

  const groupFilesByTime = (files: FileItem[]) => {
    const now = new Date('2026-01-29');
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
    const groups: Record<string, FileItem[]> = { 今天: [], 昨天: [], 本周: [], 更早: [] };
    files.forEach((file) => {
      const fileDate = new Date(file.timestamp.getFullYear(), file.timestamp.getMonth(), file.timestamp.getDate());
      if (fileDate.getTime() === today.getTime()) groups['今天'].push(file);
      else if (fileDate.getTime() === yesterday.getTime()) groups['昨天'].push(file);
      else if (fileDate >= lastWeek) groups['本周'].push(file);
      else groups['更早'].push(file);
    });
    Object.keys(groups).forEach((key) => { if (groups[key].length === 0) delete groups[key]; });
    return groups;
  };

  const sortFiles = (files: FileItem[]) => {
    return [...files].sort((a, b) => {
      switch (sortBy) {
        case 'lastUsed': return (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0);
        case 'name': return a.name.localeCompare(b.name, 'zh-CN');
        case 'type': return a.type.localeCompare(b.type);
        case 'uploadDate': return b.timestamp.getTime() - a.timestamp.getTime();
        default: return 0;
      }
    });
  };

  const getFileTypeInfo = (type: string) => {
    switch (type) {
      case 'pdf': return { icon: FileText, color: 'bg-red-50 text-red-500', badgeColor: 'bg-red-500 text-white' };
      case 'docx': case 'doc': return { icon: FileType, color: 'bg-blue-50 text-blue-500', badgeColor: 'bg-blue-500 text-white' };
      case 'xlsx': case 'xls': case 'csv': return { icon: FileSpreadsheet, color: 'bg-emerald-50 text-emerald-500', badgeColor: 'bg-emerald-500 text-white' };
      case 'pptx': case 'ppt': return { icon: Presentation, color: 'bg-orange-50 text-orange-500', badgeColor: 'bg-orange-500 text-white' };
      case 'image': case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': return { icon: Image, color: 'bg-violet-50 text-violet-500', badgeColor: 'bg-violet-500 text-white' };
      case 'json': case 'yaml': case 'yml': return { icon: Braces, color: 'bg-amber-50 text-amber-500', badgeColor: 'bg-amber-500 text-white' };
      case 'xml': return { icon: FileCode, color: 'bg-indigo-50 text-indigo-500', badgeColor: 'bg-indigo-500 text-white' };
      case 'parquet': return { icon: Database, color: 'bg-cyan-50 text-cyan-500', badgeColor: 'bg-cyan-500 text-white' };
      default: return { icon: File, color: 'bg-slate-50 text-slate-400', badgeColor: 'bg-slate-400 text-white' };
    }
  };

  const MAX_SELECT = 5;

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) { newSelected.delete(fileId); }
    else { if (newSelected.size >= MAX_SELECT) return; newSelected.add(fileId); }
    setSelectedFiles(newSelected);
  };

  const handleDelete = () => { setSelectedFiles(new Set()); setIsSelectionMode(false); };

  const handleDeleteSingleFile = (fileId: string, e: React.MouseEvent) => { e.stopPropagation(); };

  const handleAnalyzeSelected = () => {
    if (selectedFiles.size === 0) return;
    const selectedFilesList = mockFiles.filter(f => selectedFiles.has(f.id));
    if (onAnalyzeMultipleFiles) {
      onAnalyzeMultipleFiles(selectedFilesList.map(f => f.name), selectedFilesList.map(f => f.id));
    }
    setSelectedFiles(new Set()); setIsSelectionMode(false);
  };

  const exitSelectionMode = () => { setIsSelectionMode(false); setSelectedFiles(new Set()); };

  const getSortLabel = (sort: typeof sortBy) => {
    switch (sort) { case 'lastUsed': return '最近访问'; case 'name': return '按名称'; case 'type': return '按类型'; case 'uploadDate': return '上传时间'; }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) { case 'pdf': return 'PDF'; case 'docx': return 'Word'; case 'xlsx': return 'Excel / CSV'; case 'pptx': return 'PPT'; case 'image': return '图片'; case 'json': return 'JSON / YAML'; case 'xml': return 'XML'; case 'parquet': return 'Parquet'; default: return type.toUpperCase(); }
  };

  const getFilterButtonLabel = () => {
    if (fileTypeFilter.size === 0) return '全部类型';
    return `${fileTypeFilter.size} 种类型`;
  };

  const toggleFileTypeFilter = (type: string) => {
    const newFilter = new Set(fileTypeFilter);
    if (newFilter.has(type)) newFilter.delete(type); else newFilter.add(type);
    setFileTypeFilter(newFilter);
  };

  const fileTypes = Array.from(new Set(mockFiles.map(f => f.type)));

  const formatFolderDate = (date: Date) => {
    const now = new Date('2026-01-29T18:00:00');
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  const activeFolderFiles = activeFolder ? activeFolder.files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  // === 统一"继续对话"按钮 ===
  const ContinueChatButton = ({ onClick, label = '继续对话', className = '' }: { onClick: (e: React.MouseEvent) => void; label?: string; className?: string }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/12 transition-all duration-150 ${className}`}
    >
      <ArrowUpRight className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );

  // === 渲染文件网格卡片 ===

  const renderFileGridCard = (file: FileItem) => {
    const typeInfo = getFileTypeInfo(file.type);
    const FileIcon = typeInfo.icon;
    const isSelected = selectedFiles.has(file.id);

    // Grid card (normal & compact)
    return (
      <div
        key={file.id}
        className="group cursor-pointer relative"
        onClick={() => {
          if (isSelectionMode) { toggleFileSelection(file.id); }
          else { setPreviewFile(file); }
        }}
      >
        <div className={`aspect-[5/3] rounded-lg overflow-hidden bg-slate-50 mb-2 relative border border-border ${isSelected ? 'ring-2 ring-primary' : ''}`}>
          {file.type === 'image' && file.thumbnail ? (
            <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          ) : file.type === 'pdf' ? (
            <div className="w-full h-full bg-white p-2.5 flex flex-col gap-0.5">
              <div className="w-full h-1.5 bg-slate-100 rounded" /><div className="w-4/5 h-1.5 bg-slate-100 rounded" />
              <div className="w-full h-1.5 bg-slate-100 rounded" /><div className="w-3/4 h-1.5 bg-slate-100 rounded" />
              <div className="w-full h-1.5 bg-slate-100 rounded" /><div className="w-2/3 h-1.5 bg-slate-100 rounded" />
              <div className="w-full h-1.5 bg-slate-100 rounded" /><div className="w-4/5 h-1.5 bg-slate-100 rounded" />
            </div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${typeInfo.color}`}>
              <FileIcon className="w-10 h-10" />
            </div>
          )}

          <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide ${typeInfo.badgeColor}`}>
            {file.type.toUpperCase()}
          </div>

          {!isSelectionMode && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {file.conversationId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectConversation) { onSelectConversation(file.conversationId!); onBack(); }
                  }}
                  className="bg-white/95 hover:bg-white text-primary w-6 h-6 flex items-center justify-center shadow-sm rounded-md transition-colors"
                  title="跳转到对话"
                >
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
              <button onClick={(e) => handleDeleteSingleFile(file.id, e)} className="bg-white/95 hover:bg-white text-red-500 w-6 h-6 flex items-center justify-center shadow-sm rounded-md transition-colors" title="删除">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {isSelectionMode && (
            <div className="absolute top-1.5 left-1.5">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
          )}
        </div>

        <div className="px-0.5">
          <p className="text-[12px] font-medium text-foreground truncate group-hover:text-primary transition-colors">{file.name}</p>
          <p className="text-[10.5px] text-muted-foreground mt-0.5">{file.size}</p>
        </div>
      </div>
    );
  };

  // === 文件夹内文件行 ===
  const renderFolderFileRow = (file: FileItem) => {
    const typeInfo = getFileTypeInfo(file.type);
    const FileIcon = typeInfo.icon;
    return (
      <div key={file.id} className="group/file flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => setPreviewFile(file)}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
          <FileIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground truncate group-hover/file:text-primary transition-colors">{file.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{file.size} · {file.uploadDate}</p>
        </div>
        <div className="opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center gap-1.5 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <Eye className="w-3 h-3" /><span>预览</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (onAnalyzeFile) onAnalyzeFile(file.name, file.id, file.type, file.previewContent); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-primary hover:text-primary/80 hover:bg-primary/8 transition-all">
            <Plus className="w-3 h-3" /><span>以此提问</span>
          </button>
        </div>
      </div>
    );
  };

  // === 对话文件夹卡片 ===
  const renderTopicCard = (folder: ConversationFolder) => {
    const maxVisible = 3;
    const visibleFiles = folder.files.slice(0, maxVisible);
    const remainingCount = Math.max(0, folder.files.length - maxVisible);
    return (
      <div key={folder.conversationId} className="group cursor-pointer rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col h-[220px]"
        onClick={() => { setActiveFolder(folder); setSearchQuery(''); }}>
        <div className="px-4 pt-4 pb-2.5 flex items-start gap-2 flex-shrink-0 bg-primary/[0.03] rounded-t-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground truncate leading-snug group-hover:text-primary transition-colors">{folder.title}</p>
            <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" />{folder.fileCount}</span><span className="text-border">·</span><span>{formatFolderDate(folder.lastModified)}</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white border border-border/60 shadow-sm group-hover:bg-primary/10 group-hover:border-primary/20 flex items-center justify-center flex-shrink-0 transition-colors"
            onClick={(e) => { e.stopPropagation(); if (onSelectConversation) { onSelectConversation(folder.conversationId); onBack(); } }}
            title="进入对话">
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        <div className="relative flex-1 px-3 py-2 space-y-0.5 min-h-0 overflow-hidden">
          {visibleFiles.map((file) => {
            const typeInfo = getFileTypeInfo(file.type);
            const FileIcon = typeInfo.icon;
            return (
              <div key={file.id} className="flex items-center gap-2.5 py-[6px] px-2 rounded-md">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}><FileIcon className="w-3 h-3" /></div>
                <span className="text-[12.5px] text-muted-foreground truncate flex-1 min-w-0">{file.name}</span>
                <span className="text-[11px] text-muted-foreground/50 flex-shrink-0 tabular-nums">{file.size}</span>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[44px] bg-gradient-to-t from-stone-100 via-stone-50 to-transparent flex items-end justify-center pb-2.5">
              <span className="text-[11px] font-semibold text-stone-400">+{remainingCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // === 文件夹详情 ===
  if (activeFolder) {
    return (
      <div className="flex-1 flex h-screen overflow-hidden">
        <div className={`flex flex-col bg-white overflow-hidden ${previewFile ? 'flex-[1] max-w-[480px]' : 'flex-1'}`}>
          {/* Header */}
          <div className="border-b border-border bg-white px-5 h-[48px] flex items-center gap-3 flex-shrink-0">
            <button onClick={() => { setActiveFolder(null); setSearchQuery(''); setPreviewFile(null); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
              <button onClick={() => { setActiveFolder(null); setSearchQuery(''); setPreviewFile(null); }} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 text-[13px]">对话文件夹</button>
              <span className="text-muted-foreground/40 flex-shrink-0">/</span>
              <span className="text-[13px] font-medium text-foreground truncate">{activeFolder.title}</span>
              <span className="text-[12px] text-muted-foreground flex-shrink-0">({activeFolder.fileCount})</span>
            </div>
            <ContinueChatButton label="继续对话" onClick={() => { if (onSelectConversation) { onSelectConversation(activeFolder.conversationId); onBack(); } }} />
          </div>

          {/* Search */}
          <div className="px-5 py-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="在此对话中搜索文档..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px] bg-white" />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-5 py-4">
              {activeFolderFiles.length > 0 ? (
                <div className="space-y-0.5">{activeFolderFiles.map(renderFolderFileRow)}</div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto bg-secondary rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground/40" /></div>
                    <p className="text-[13px] text-muted-foreground">{searchQuery ? '未找到匹配的文档' : '此对话暂无关联文档'}</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        {previewFile && (
          <div className="flex-[2] border-l border-border flex flex-col">
            <DocumentPreview
              fileName={previewFile.name}
              fileType={previewFile.type}
              previewContent={previewFile.previewContent}
              onClose={() => setPreviewFile(null)}
              onOpenFileManager={() => {}}
            />
            {/* Preview action bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-white flex-shrink-0">
              {activeFolder && (
                <button
                  onClick={() => {
                    if (onSelectConversation) { onSelectConversation(activeFolder.conversationId); onBack(); }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-primary hover:bg-primary/8 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>跳转到对话</span>
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => { setPreviewFile(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除文件</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === 主视图 ===
  const sortedAllFiles = sortFiles(filteredAllFiles);
  const groupedAllFiles = groupFilesByTime(sortedAllFiles);

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Left: file list */}
      <div className={`flex flex-col bg-white overflow-hidden relative ${previewFile ? 'flex-[1] max-w-[480px]' : 'flex-1'}`}>
        {/* Top Header — fixed, never scrolls */}
        <div className="flex-shrink-0 border-b border-border bg-white">
          <div className="px-8 pt-0 pb-0">
            {/* Title row */}
            <div className="flex items-center gap-2 pt-5 pb-3">
              <button onClick={onBack} className="w-7 h-7 -ml-1 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[18px] font-semibold text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Noto Serif SC', 'Georgia', serif" }}>文件管理</h1>
            </div>

            {/* Tabs — 全部文件在前 */}
            <div className="flex items-center gap-0">
              <button
                onClick={() => { setActiveTab('files'); setSearchQuery(''); setPreviewFile(null); }}
                className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === 'files' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                全部文件
                <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'files' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{allFiles.length}</span>
                {activeTab === 'files' && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
              </button>
              <button
                onClick={() => { setActiveTab('topics'); setSearchQuery(''); setFileTypeFilter(new Set()); setPreviewFile(null); }}
                className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === 'topics' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                对话文件夹
                <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'topics' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{folders.length}</span>
                {activeTab === 'topics' && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
              </button>
            </div>
          </div>
        </div>

        {/* === Tab: 对话文件夹 === */}
        {activeTab === 'topics' && (
          <>
            <div className="px-8 py-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" placeholder="搜索对话或文档名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px] bg-white" />
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-8 py-5">
                {filteredFolders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{filteredFolders.map(renderTopicCard)}</div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-3">
                      <div className="w-14 h-14 mx-auto bg-secondary rounded-2xl flex items-center justify-center"><MessageSquare className="w-7 h-7 text-muted-foreground/30" /></div>
                      <div>
                        <h3 className="text-[15px] font-medium text-foreground">{searchQuery ? '未找到匹配的对话' : '暂无对话记录'}</h3>
                        <p className="text-[13px] text-muted-foreground mt-1">{searchQuery ? '换个关键词试试' : '发起新对话后，关联文档将自动归档于此'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* === Tab: 所有文件 === */}
        {activeTab === 'files' && (
          <>
            <div className="px-8 py-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" placeholder="搜索文件名或类型..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px] bg-white" />
                </div>

                {/* File Type Filter */}
                <div className="relative">
                  <Button variant="outline" size="sm" className={`border-border rounded-lg text-xs ${fileTypeFilter.size > 0 ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground'}`} onClick={() => setShowFileTypeMenu(!showFileTypeMenu)} title="筛选类型">
                    <Filter className="w-3 h-3" />{!previewFile && <span className="ml-1">{getFilterButtonLabel()}</span>}
                    {previewFile && fileTypeFilter.size > 0 && <span className="ml-1 text-[10px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">{fileTypeFilter.size}</span>}
                  </Button>
                  {showFileTypeMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowFileTypeMenu(false)} />
                      <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-border py-1 z-20">
                        {fileTypeFilter.size > 0 && (
                          <button className="w-full px-3 py-2 text-left text-[12px] text-muted-foreground hover:text-primary hover:bg-accent/40 border-b border-border mb-1" onClick={() => setFileTypeFilter(new Set())}>重置筛选</button>
                        )}
                        {fileTypes.map((type) => (
                          <button key={type} className="w-full px-3 py-2 text-left text-[13px] hover:bg-accent/40 flex items-center gap-2.5" onClick={() => toggleFileTypeFilter(type)}>
                            <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${fileTypeFilter.has(type) ? 'bg-primary border-primary' : 'border-border bg-white'}`}>
                              {fileTypeFilter.has(type) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={fileTypeFilter.has(type) ? 'text-primary font-medium' : 'text-foreground'}>{getFileTypeLabel(type)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Sort */}
                <div className="relative">
                  <Button variant="outline" size="sm" className="text-muted-foreground border-border rounded-lg text-xs" onClick={() => setShowSortMenu(!showSortMenu)} title={getSortLabel(sortBy)}>
                    <ArrowUpDown className="w-3 h-3" />{!previewFile && <span className="ml-1">{getSortLabel(sortBy)}</span>}
                  </Button>
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                      <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-border py-1 z-20">
                        {(['lastUsed', 'name', 'type', 'uploadDate'] as const).map((option) => (
                          <button key={option} className="w-full px-3 py-2 text-left text-[13px] hover:bg-accent/40 flex items-center justify-between" onClick={() => { setSortBy(option); setShowSortMenu(false); }}>
                            <span className={sortBy === option ? 'text-primary font-medium' : 'text-foreground'}>{getSortLabel(option)}</span>
                            {sortBy === option && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <Button variant="outline" size="sm" className={`rounded-lg text-xs ${isSelectionMode ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground border-border'}`} onClick={() => isSelectionMode ? exitSelectionMode() : setIsSelectionMode(true)} title="批量管理">
                  <CheckSquare className="w-3 h-3" />{!previewFile && <span className="ml-1">创建新对话</span>}
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg text-xs" size="sm" title="上传文件" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-3 h-3" />{!previewFile && <span className="ml-1">上传文件</span>}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 relative">
              <div className="px-8 py-5">
                {sortedAllFiles.length > 0 ? (
                  Object.entries(groupedAllFiles).map(([dateLabel, filesInGroup]) => (
                    <div key={dateLabel} className="mb-8 last:mb-0">
                      <h3 className="text-[11px] font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground/40" />{dateLabel}
                      </h3>
                      <div className={previewFile
                        ? "grid grid-cols-2 gap-3"
                        : "grid gap-3 grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                      }>
                        {filesInGroup.map(renderFileGridCard)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-3">
                      <div className="w-14 h-14 mx-auto bg-secondary rounded-2xl flex items-center justify-center"><FileText className="w-7 h-7 text-muted-foreground/30" /></div>
                      <div>
                        <h3 className="text-[15px] font-medium text-foreground">{searchQuery ? '未找到匹配的文件' : '暂无文件'}</h3>
                        <p className="text-[13px] text-muted-foreground mt-1">{searchQuery ? '换个关键词试试' : '上传文档即可开始 AI 分析'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Floating bottom bar for batch actions */}
            {isSelectionMode && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-border/60">
                <span className="text-[13px] text-muted-foreground mr-0.5">
                  已选 <span className="font-semibold text-primary tabular-nums">{selectedFiles.size}</span> / {MAX_SELECT}
                </span>
                <div className="w-px h-5 bg-border" />
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg" size="sm" onClick={handleAnalyzeSelected} disabled={selectedFiles.size === 0}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />创建对话
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 rounded-lg" onClick={handleDelete} disabled={selectedFiles.size === 0}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />删除文件
                </Button>
                <button onClick={exitSelectionMode} className="text-[13px] text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">取消</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Document Preview Panel */}
      {previewFile && (
        <div className="flex-[2] border-l border-border flex flex-col">
          <DocumentPreview
            fileName={previewFile.name}
            fileType={previewFile.type}
            previewContent={previewFile.previewContent}
            onClose={() => setPreviewFile(null)}
            onOpenFileManager={() => {}}
          />
          {/* Preview action bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-white flex-shrink-0">
            {previewFile.conversationId && (
              <button
                onClick={() => {
                  if (onSelectConversation) { onSelectConversation(previewFile.conversationId!); onBack(); }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-primary hover:bg-primary/8 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>跳转到对话</span>
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => { setPreviewFile(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除文件</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Dialog Overlay */}
      {showUploadDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowUploadDialog(false); setIsDraggingOver(false); }}
        >
          <div
            className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold text-foreground">上传文件</h3>
              <button
                onClick={() => { setShowUploadDialog(false); setIsDraggingOver(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drop Zone */}
            <div className="px-6 py-6">
              <div
                className={`border-2 border-dashed rounded-xl py-12 flex flex-col items-center transition-colors ${
                  isDraggingOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-[14px] font-medium text-foreground mb-1">拖放文件到此处</p>
                <p className="text-[12.5px] text-muted-foreground mb-4">或点击下方按钮选择文件</p>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6" size="sm">
                  浏览文件
                </Button>
              </div>

              {/* Supported formats */}
              <div className="mt-4 flex items-center gap-4 justify-center">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[11px] text-muted-foreground">PDF</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileType className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] text-muted-foreground">Word</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[11px] text-muted-foreground">Excel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Presentation className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[11px] text-muted-foreground">PPT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] text-muted-foreground">图片</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/60 text-center mt-2">单个文件最大 50MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}