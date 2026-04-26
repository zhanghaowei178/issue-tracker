import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// 生成随机数据的工具函数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 数据定义
const assignees = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑一', '王二', '陈三', '林四', '黄五', '刘六', '陈七', '杨八'
];

const severityLevels = ['致命', '严重', '一般', '提示'];

const trackingKeywords = ['长期跟踪', '暂不处理', '跟踪中', 'pending', 'deferred'];

const descriptions = [
  '登录页面崩溃', '支付功能异常', '数据加载失败', '界面样式错乱', '功能模块缺失',
  'API接口错误', '性能问题', '安全漏洞', '兼容性问题', '用户体验优化',
  '数据库连接失败', '缓存失效', '权限问题', '逻辑错误', '异常处理缺失',
  '代码冗余', '文档缺失', '测试用例不足', '部署失败', '配置错误'
];

// 生成指定数量的问题单
function generateIssues(count, startDate, idPrefix = '', startId = 1) {
  const issues = [];

  for (let i = startId; i <= startId + count - 1; i++) {
    const createdTime = new Date(startDate);
    createdTime.setDate(createdTime.getDate() - randomInt(0, 10)); // 0-10天前

    const severity = randomItem(severityLevels);
    const assignee = randomItem(assignees);

    let remark = '';
    if (Math.random() > 0.7) { // 30%的概率是跟踪问题
      remark = `[${randomItem(trackingKeywords)}] 根因：${randomItem(descriptions)}，预计解决时间：${new Date().toISOString().split('T')[0]}`;
    } else if (Math.random() > 0.5) {
      remark = `根因：${randomItem(descriptions)}，预计解决时间：${new Date().toISOString().split('T')[0]}`;
    }

    issues.push({
      '问题单号': `${idPrefix}BUG-${String(i).padStart(3, '0')}`,
      '问题描述': randomItem(descriptions),
      '开发负责人': assignee,
      '创建时间': createdTime.toISOString().split('T')[0],
      '严重程度': severity,
      '备注': remark
    });
  }

  return issues;
}

// 生成昨天的数据
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayIssues = generateIssues(100, yesterday, 'Y-', 1);

// 生成今天的数据
const today = new Date();

// 从昨天的问题中，随机选择一部分延续到今天（表示未解决）
// 假设20个问题已解决（昨天有，今天没有），80个问题未解决（延续到今天）
const resolvedCount = 20;
const unresolvedCount = 100 - resolvedCount;

// 打乱昨天的问题顺序
const shuffledYesterday = [...yesterdayIssues].sort(() => Math.random() - 0.5);

// 取前80个作为延续到今天的问题
const unresolvedFromYesterday = shuffledYesterday.slice(0, unresolvedCount);

// 生成今天的新问题（问题单号以 T- 开头）
const todayNewIssues = generateIssues(40, today, 'T-', 1);

// 今天的问题 = 昨天延续过来的(80条) + 今天新生成的(40条) = 120条
const todayIssues = [
  ...unresolvedFromYesterday,
  ...todayNewIssues
];

// 创建工作簿
function createWorkbook(data, filename) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '问题单数据');

  const outputPath = path.join(process.cwd(), filename);
  XLSX.writeFile(workbook, outputPath);
  console.log(`生成文件: ${outputPath}`);
}

// 生成文件
createWorkbook(yesterdayIssues, 'yesterday_issues.xlsx');
createWorkbook(todayIssues, 'today_issues.xlsx');

console.log('数据生成完成！');
console.log(`昨天问题单数量: ${yesterdayIssues.length}`);
console.log(`今天问题单数量: ${todayIssues.length}`);
console.log(`预计已解决数量: ${resolvedCount}（昨天有但今天没有）`);
console.log(`预计未解决数量: ${todayIssues.length}（今天仍然存在的）`);
console.log(`预计新增数量: ${todayNewIssues.length}（今天新生成的）`);