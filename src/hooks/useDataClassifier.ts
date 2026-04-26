import { useMemo } from 'react';
import { Issue, GlobalStats, TeamMemberStats, ComparisonData, IssueCategory } from '../types';
import { classifyIssue } from '../utils/dataProcessor';

export function useDataClassifier(issues: Issue[]) {
  const processedIssues = useMemo(() => {
    return issues.map(issue => ({
      ...issue,
      category: classifyIssue(issue)
    }));
  }, [issues]);

  const stats: GlobalStats = useMemo(() => {
    const total = processedIssues.length;
    const urgent = processedIssues.filter(i => i.category === 'urgent').length;
    const tracking = processedIssues.filter(i => i.category === 'tracking').length;
    const normal = processedIssues.filter(i => i.category === 'normal').length;
    const resolved = processedIssues.filter(i => i.status === 'resolved').length;

    return {
      totalCount: total,
      urgentCount: urgent,
      trackingCount: tracking,
      normalCount: normal,
      previousResolvedCount: 0,
      currentResolvedCount: resolved
    };
  }, [processedIssues]);

  const teamStats: TeamMemberStats[] = useMemo(() => {
    const memberMap = new Map<string, TeamMemberStats>();

    processedIssues.forEach(issue => {
      const existing = memberMap.get(issue.assignee) || {
        assignee: issue.assignee,
        totalCount: 0,
        resolvedCount: 0,
        unresolvedCount: 0,
        urgentCount: 0,
        trackingCount: 0,
        normalCount: 0
      };

      existing.totalCount++;
      if (issue.status === 'resolved') {
        existing.resolvedCount++;
      } else {
        existing.unresolvedCount++;
        if (issue.category === 'urgent') existing.urgentCount++;
        if (issue.category === 'tracking') existing.trackingCount++;
        if (issue.category === 'normal') existing.normalCount++;
      }

      memberMap.set(issue.assignee, existing);
    });

    return Array.from(memberMap.values()).sort((a, b) => b.resolvedCount - a.resolvedCount);
  }, [processedIssues]);

  const getIssuesByCategory = (category: IssueCategory) => {
    return processedIssues.filter(i => i.category === category && i.status !== 'resolved');
  };

  const getIssuesByAssignee = (assignee: string) => {
    return processedIssues.filter(i => i.assignee === assignee);
  };

  return { stats, teamStats, processedIssues, getIssuesByCategory, getIssuesByAssignee };
}

// 核心对比逻辑 - 计算两天数据的差异
export function useComparison(
  previousIssues: Issue[],
  currentIssues: Issue[]
) {
  const comparison = useMemo(() => {
    // 按负责人分组问题
    const prevByAssignee = new Map<string, Set<string>>();
    previousIssues.forEach(issue => {
      if (!prevByAssignee.has(issue.assignee)) {
        prevByAssignee.set(issue.assignee, new Set());
      }
      prevByAssignee.get(issue.assignee)?.add(issue.id);
    });

    const currByAssignee = new Map<string, Set<string>>();
    currentIssues.forEach(issue => {
      if (!currByAssignee.has(issue.assignee)) {
        currByAssignee.set(issue.assignee, new Set());
      }
      currByAssignee.get(issue.assignee)?.add(issue.id);
    });

    // 获取所有负责人
    const allAssignees = new Set([
      ...previousIssues.map(i => i.assignee),
      ...currentIssues.map(i => i.assignee)
    ]);

    const comparisonData: ComparisonData[] = [];

    allAssignees.forEach(assignee => {
      const prevIds = prevByAssignee.get(assignee) || new Set();
      const currIds = currByAssignee.get(assignee) || new Set();

      // 新增问题：今天有但昨天没有的
      const newIssues = Array.from(currIds).filter(id => !prevIds.has(id)).length;

      // 已解决问题：昨天有但今天没有的
      const resolvedIssues = Array.from(prevIds).filter(id => !currIds.has(id)).length;

      // 未解决问题：今天仍然存在的
      const unresolvedIssues = currIds.size;

      comparisonData.push({
        assignee,
        previousCount: prevIds.size,
        currentCount: currIds.size,
        newIssues,
        resolvedIssues,
        unresolvedIssues
      });
    });

    return comparisonData.sort((a, b) => b.resolvedIssues - a.resolvedIssues);
  }, [previousIssues, currentIssues]);

  return comparison;
}

// 排行榜数据 - 基于对比结果
export function useRankingData(
  previousIssues: Issue[],
  currentIssues: Issue[]
) {
  const rankingData = useMemo(() => {
    // 按负责人分组问题
    const prevByAssignee = new Map<string, Set<string>>();
    previousIssues.forEach(issue => {
      if (!prevByAssignee.has(issue.assignee)) {
        prevByAssignee.set(issue.assignee, new Set());
      }
      prevByAssignee.get(issue.assignee)?.add(issue.id);
    });

    const currByAssignee = new Map<string, Set<string>>();
    currentIssues.forEach(issue => {
      if (!currByAssignee.has(issue.assignee)) {
        currByAssignee.set(issue.assignee, new Set());
      }
      currByAssignee.get(issue.assignee)?.add(issue.id);
    });

    // 获取所有负责人
    const allAssignees = new Set([
      ...previousIssues.map(i => i.assignee),
      ...currentIssues.map(i => i.assignee)
    ]);

    // 计算每个人的统计数据
    const memberMap = new Map<string, {
      assignee: string;
      totalCount: number;
      previousCount: number;
      resolvedToday: number;
      newToday: number;
      unresolvedCount: number;
      urgentCount: number;
    }>();

    allAssignees.forEach(assignee => {
      const prevIds = prevByAssignee.get(assignee) || new Set();
      const currIds = currByAssignee.get(assignee) || new Set();

      // 计算严重遗留问题数量（基于今天的问题）
      const urgentCount = currentIssues
        .filter(i => i.assignee === assignee && i.category === 'urgent')
        .length;

      const existing = {
        assignee,
        totalCount: currIds.size,
        previousCount: prevIds.size,
        resolvedToday: Array.from(prevIds).filter(id => !currIds.has(id)).length,
        newToday: Array.from(currIds).filter(id => !prevIds.has(id)).length,
        unresolvedCount: currIds.size,
        urgentCount
      };

      memberMap.set(assignee, existing);
    });

    return Array.from(memberMap.values());
  }, [previousIssues, currentIssues]);

  return rankingData;
}