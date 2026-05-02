import { Issue, Severity, IssueCategory, Config } from '../types';
import configData from '../config/field-mapping.json';

export const cfg: Config = configData as Config;

const DEFAULT_EXCLUDE_LIST = cfg.excludeAssignees?.values?.length > 0
  ? cfg.excludeAssignees.values
  : ["测试组", "自动化", "测试人员", "tester", "admin", "管理员"];
let currentExcludeList = DEFAULT_EXCLUDE_LIST;

export function setExcludeList(excludeList: string[]) {
  currentExcludeList = excludeList;
}

export function getExcludeList(): string[] {
  return [...currentExcludeList];
}

export function findFieldIndex(headers: string[], fieldName: keyof Config['fieldMapping']): number {
  const aliases = cfg.fieldMapping[fieldName]?.aliases || [];
  return headers.findIndex(h => aliases.some(alias => h.toLowerCase().includes(alias.toLowerCase())));
}

export function parseSeverity(value: string | undefined): Severity {
  if (!value) return 'medium';
  const normalized = value.toLowerCase().trim();

  for (const [level, sevConfig] of Object.entries(cfg.severityLevels)) {
    if (sevConfig.values.some((v: string) => v.toLowerCase() === normalized)) {
      return level as Severity;
    }
  }
  return 'medium';
}

export function isTrackingIssue(remark: string): boolean {
  const normalized = remark.toLowerCase();
  return cfg.trackingKeywords.values.some((kw: string) => normalized.includes(kw.toLowerCase()));
}

export function getDaysElapsed(createdTime: Date): number {
  const now = new Date();
  const diff = now.getTime() - createdTime.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function classifyIssue(issue: Issue): IssueCategory {
  if (issue.status === 'resolved') {
    return 'normal';
  }

  const isTracking = isTrackingIssue(issue.remark);

  if (issue.severity === 'critical' || issue.severity === 'high') {
    return 'urgent';
  }

  if (isTracking) {
    return 'tracking';
  }

  return 'normal';
}

export function parseExcelDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function parseStatus(value: string | undefined): 'open' | 'resolved' {
  if (!value) return 'open';
  const normalized = value.toLowerCase();
  if (normalized.includes('已解决') || normalized.includes('resolved') ||
      normalized.includes('closed') || normalized.includes('完成')) {
    return 'resolved';
  }
  return 'open';
}

export function isExcludedAssignee(assignee: string): boolean {
  const normalized = assignee.toLowerCase().trim();
  return currentExcludeList.some((ex: string) => normalized.includes(ex.toLowerCase()));
}

export function classifyAllIssues(issues: Issue[]): Issue[] {
  return issues.map(issue => ({
    ...issue,
    category: classifyIssue(issue)
  }));
}

export function filterExcludedIssues(issues: Issue[]): Issue[] {
  return issues.filter(issue => !isExcludedAssignee(issue.assignee));
}
