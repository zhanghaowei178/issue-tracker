export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IssueCategory = 'urgent' | 'tracking' | 'normal';
export type ViewType = 'team-overview' | 'ranking' | 'comparison' | 'personal-detail' | 'issue-overview' | 'personal-board';

export interface Issue {
  id: string;
  description: string;
  assignee: string;
  createdTime: Date;
  severity: Severity;
  remark: string;
  status: 'open' | 'resolved';
  category?: IssueCategory;
  link?: string;
}

export interface TeamMemberStats {
  assignee: string;
  totalCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  urgentCount: number;
  trackingCount: number;
  normalCount: number;
}

export interface GlobalStats {
  totalCount: number;
  urgentCount: number;
  trackingCount: number;
  normalCount: number;
  previousResolvedCount: number;
  currentResolvedCount: number;
}

export interface ComparisonData {
  assignee: string;
  previousCount: number;
  currentCount: number;
  newIssues: number;
  resolvedIssues: number;
  unresolvedIssues: number;
}

export interface FieldMapping {
  aliases: string[];
}

export interface SeverityLevel {
  values: string[];
}

export interface Config {
  fieldMapping: {
    issueId: FieldMapping;
    description: FieldMapping;
    assignee: FieldMapping;
    createdTime: FieldMapping;
    severity: FieldMapping;
    remark: FieldMapping;
    status?: FieldMapping;
    link?: FieldMapping;
  };
  severityLevels: {
    urgent: SeverityLevel;
    high: SeverityLevel;
    medium: SeverityLevel;
    low: SeverityLevel;
  };
  trackingKeywords: {
    values: string[];
  };
  urgentThreshold: {
    days: number;
  };
  excludeAssignees: {
    values: string[];
  };
}

export type SortField = 'severity' | 'createdTime' | 'assignee' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}
