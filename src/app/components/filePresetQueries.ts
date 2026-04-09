import type { MessageAttachment } from '@/app/components/MessageStream';

// 检测文件是否属于「可修订」类型（合同、法规、协议等）
export function isReviewableFileType(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return /合同|contract|agreement|协议|法律|法规|条例|规定|legal|章程|条款|policy|terms/.test(name);
}

// 根据上传文件类型生成预设智能提问
export function getFileTypePresetQueries(attachments: MessageAttachment[]): string[] {
  const isMultiFile = attachments.length >= 2;
  const primaryFile = attachments[0];
  const fileName = primaryFile.name;
  const fileType = primaryFile.type;
  const name = fileName.toLowerCase();

  // 基于文件类型的常规建议（取2条）
  const baseQueries = getBaseQueriesForFile(name, fileType);

  // 特殊模式建议
  const modeQueries: string[] = [];

  // 修订模式：合同、法规、协议等可审核文件
  if (isReviewableFileType(fileName)) {
    modeQueries.push('用修订模式帮我分析风险点');
  }

  // 对比模式：多文件上传时
  if (isMultiFile) {
    modeQueries.push('用对比模式帮我分析差异');
  }

  // 组合：模式建议在前（更醒目），常规建议补齐到3条
  const result = [...modeQueries, ...baseQueries];
  return result.slice(0, 3);
}

// 获取文件类型的基础建议（内部函数）
function getBaseQueriesForFile(name: string, fileType: string): string[] {
  // 发票类
  if (name.includes('发票') || name.includes('invoice') || name.includes('receipt')) {
    return [
      '帮我统计所有发票的总消费金额',
      '按类别归纳发票的支出明细',
      '检查发票信息是否完整合规',
    ];
  }
  // 合同类
  if (name.includes('合同') || name.includes('contract') || name.includes('agreement') || name.includes('协议')) {
    return [
      '提取合同中的关键条款和义务',
      '识别合同中的潜在风险条款',
      '帮我梳理合同的权利与义务关系',
    ];
  }
  // 简历类
  if (name.includes('简历') || name.includes('resume') || name.includes('cv')) {
    return [
      '总结候选人的核心技能和工作经历',
      '评估候选人与岗位要求的匹配度',
      '提取候选人的教育背景和项目经验',
    ];
  }
  // 财务报表类
  if (name.includes('财务') || name.includes('财报') || name.includes('finance') || name.includes('financial') || name.includes('资产负债') || name.includes('利润')) {
    return [
      '分析关键财务指标的变化趋势',
      '帮我计算主要的财务比率',
      '对比本期与上期的财务数据差异',
    ];
  }
  // 报告类
  if (name.includes('报告') || name.includes('report') || name.includes('报表') || name.includes('分析')) {
    return [
      '提取报告中的核心结论和关键数据',
      '帮我生成报告的执行摘要',
      '梳理报告中提出的问题和建议',
    ];
  }
  // 方案/计划类
  if (name.includes('方案') || name.includes('计划') || name.includes('proposal') || name.includes('plan') || name.includes('提案')) {
    return [
      '总结方案的核心目标和实施路径',
      '评估方案的可行性和潜在风险',
      '提取方案中的关键里程碑和时间节点',
    ];
  }
  // 表格/数据类
  if (name.includes('.xlsx') || name.includes('.xls') || name.includes('.csv') || name.includes('表格') || name.includes('数据') || fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
    return [
      '帮我统计表格中的关键数值汇总',
      '识别数据中的异常值和趋势',
      '按分类维度生成数据透视分析',
    ];
  }
  // 论文/学术类
  if (name.includes('论文') || name.includes('paper') || name.includes('thesis') || name.includes('研究')) {
    return [
      '提取论文的研究方法和主要结论',
      '总结论文的创新点和贡献',
      '梳理论文中引用的关键参考文献',
    ];
  }
  // 法律/法规类
  if (name.includes('法律') || name.includes('法规') || name.includes('条例') || name.includes('规定') || name.includes('legal')) {
    return [
      '解读核心法律条款的适用场景',
      '梳理关键的权利义务和法律责任',
      '对比相关法规的差异与变化',
    ];
  }
  // 会议记录类
  if (name.includes('会议') || name.includes('纪要') || name.includes('minutes') || name.includes('meeting')) {
    return [
      '提取会议中的关键决议和待办事项',
      '整理各参会人员的发言要点',
      '生成会议纪要的行动计划清单',
    ];
  }
  // 产品/需求文档类
  if (name.includes('需求') || name.includes('prd') || name.includes('产品') || name.includes('spec') || name.includes('功能')) {
    return [
      '梳理文档中的功能需求和优先级',
      '识别需求中的依赖关系和风险点',
      '生成需求列表和验收标准',
    ];
  }
  // 图片类
  if (fileType.includes('image') || name.includes('.jpg') || name.includes('.png') || name.includes('.jpeg')) {
    return [
      '识别图片中的文字和关键信息',
      '描述图片内容并提取数据',
      '分析图片中的表格或图表数据',
    ];
  }

  // 通用文档 - 默认
  return [
    '帮我总结这份文档的核心内容',
    '提取文档中的关键数据和结论',
    '梳理文档的结构和重点章节',
  ];
}
