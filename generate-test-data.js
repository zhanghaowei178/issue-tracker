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
  '登录页面在Safari浏览器中点击登录按钮后崩溃，控制台显示TypeError: Cannot read properties of undefined，需要检查auth模块的用户信息获取逻辑是否有边界条件处理',
  '支付功能在移动端提交订单时出现网络超时错误，经排查发现是API请求超时时间设置过短，需要调整axios的timeout配置',
  '首页数据加载失败，显示空白页面，经检查是接口返回数据格式变更导致JSON解析错误，需要更新数据解析逻辑',
  '用户列表页面在小屏幕设备上样式错乱，表格列重叠，需要优化响应式布局和媒体查询设置',
  '报表导出功能模块缺失，用户无法导出Excel格式的统计报表，需要新增导出功能组件和后端接口',
  '用户注册API接口返回400错误，参数验证失败，需要检查请求参数格式和后端验证逻辑是否匹配',
  '首页加载性能问题严重，首屏渲染时间超过5秒，需要优化图片压缩、开启懒加载和代码分割',
  '用户密码重置功能存在安全漏洞，重置链接未设置过期时间，可能被恶意利用，需要添加token有效期验证',
  'iOS端App在iOS 15以下版本兼容性问题，某些功能按钮点击无响应，需要检查事件绑定方式',
  '用户反馈弹窗关闭按钮位置不合理，用户容易误触，需要优化UI布局和交互体验',
  '数据库连接池在高并发场景下出现连接耗尽，需要增加连接池最大连接数配置和连接回收机制',
  'Redis缓存失效导致频繁查询数据库，需要检查缓存更新策略和过期时间设置',
  '用户权限验证逻辑存在漏洞，普通用户可以访问管理员页面，需要加强路由守卫和权限检查',
  '订单状态流转逻辑错误，已取消的订单仍能继续支付，需要修复状态机转换规则',
  '异常处理缺失导致错误信息直接暴露给用户，可能泄露系统敏感信息，需要统一错误处理和日志记录',
  '代码冗余严重，多个组件存在重复逻辑，需要抽取公共组件和工具函数，提高代码复用率',
  'API接口文档缺失，前端开发需要频繁询问后端字段含义，需要补充完整的接口文档',
  '测试用例覆盖率不足60%，核心功能缺少单元测试，需要补充测试用例确保代码质量',
  'CI/CD部署失败，Docker镜像构建超时，需要优化构建脚本和依赖下载速度',
  '配置文件管理混乱，开发环境和生产环境配置混用，需要建立统一的配置管理方案'
];

const remarkDetails = [
  '经初步分析，问题可能出在第3行的变量未初始化，需要添加默认值检查',
  '已经定位到问题根因，是由于异步请求时序问题导致状态不一致',
  '需要与产品确认需求细节，当前需求描述不够清晰',
  '预计需要2个开发工作日完成修复，包含测试和回归验证',
  '该问题已在测试环境复现，正在编写修复方案',
  '涉及第三方SDK兼容性问题，需要联系供应商获取技术支持',
  '需要升级依赖库版本，但可能影响其他模块，需要评估风险',
  '代码review已通过，等待合并到主分支',
  '已修复并发布到测试环境，等待测试验证',
  '该问题是已知问题，已列入后续迭代计划'
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
      remark = `【${randomItem(trackingKeywords)}】${randomItem(remarkDetails)}。${randomItem(remarkDetails)}。预计解决时间：${new Date(Date.now() + randomInt(1, 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
    } else if (Math.random() > 0.5) {
      remark = `${randomItem(remarkDetails)}。${randomItem(remarkDetails)}。预计解决时间：${new Date(Date.now() + randomInt(1, 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
    } else {
      remark = randomItem(remarkDetails);
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
