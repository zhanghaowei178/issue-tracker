import { useMemo } from 'react';
import { Issue, GlobalStats, TeamMemberStats, ComparisonData, IssueCategory } from '../types';
import { classifyIssue, filterExcludedIssues } from '../utils/dataProcessor';

export function useDataClassifier(issues: Issue[]) {
  const filteredIssues = useMemo(() => {
    return filterExcludedIssues(issues);
  }, [issues]);

  const processedIssues = useMemo(() => {
    return filteredIssues.map(issue => ({
      ...issue,
      category: classifyIssue(issue)
    }));
  }, [filteredIssues]);

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

export function useComparison(
  previousIssues: Issue[],
  currentIssues: Issue[]
) {
  const filteredPrevIssues = useMemo(() => filterExcludedIssues(previousIssues), [previousIssues]);
  const filteredCurrIssues = useMemo(() => filterExcludedIssues(currentIssues), [currentIssues]);

  const comparison = useMemo(() => {
    const prevByAssignee = new Map<string, Set<string>>();
    filteredPrevIssues.forEach(issue => {
      if (!prevByAssignee.has(issue.assignee)) {
        prevByAssignee.set(issue.assignee, new Set());
      }
      prevByAssignee.get(issue.assignee)?.add(issue.id);
    });

    const currByAssignee = new Map<string, Set<string>>();
    filteredCurrIssues.forEach(issue => {
      if (!currByAssignee.has(issue.assignee)) {
        currByAssignee.set(issue.assignee, new Set());
      }
      currByAssignee.get(issue.assignee)?.add(issue.id);
    });

    const allAssignees = new Set([
      ...filteredPrevIssues.map(i => i.assignee),
      ...filteredCurrIssues.map(i => i.assignee)
    ]);

    const comparisonData: ComparisonData[] = [];

    allAssignees.forEach(assignee => {
      const prevIds = prevByAssignee.get(assignee) || new Set();
      const currIds = currByAssignee.get(assignee) || new Set();

      const newIssues = Array.from(currIds).filter(id => !prevIds.has(id)).length;
      const resolvedIssues = Array.from(prevIds).filter(id => !currIds.has(id)).length;
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
  }, [filteredPrevIssues, filteredCurrIssues]);

  return comparison;
}

export function useRankingData(
  previousIssues: Issue[],
  currentIssues: Issue[]
) {
  const filteredPrevIssues = useMemo(() => filterExcludedIssues(previousIssues), [previousIssues]);
  const filteredCurrIssues = useMemo(() => filterExcludedIssues(currentIssues), [currentIssues]);

  const rankingData = useMemo(() => {
    const prevByAssignee = new Map<string, Set<string>>();
    filteredPrevIssues.forEach(issue => {
      if (!prevByAssignee.has(issue.assignee)) {
        prevByAssignee.set(issue.assignee, new Set());
      }
      prevByAssignee.get(issue.assignee)?.add(issue.id);
    });

    const currByAssignee = new Map<string, Set<string>>();
    filteredCurrIssues.forEach(issue => {
      if (!currByAssignee.has(issue.assignee)) {
        currByAssignee.set(issue.assignee, new Set());
      }
      currByAssignee.get(issue.assignee)?.add(issue.id);
    });

    const allAssignees = new Set([
      ...filteredPrevIssues.map(i => i.assignee),
      ...filteredCurrIssues.map(i => i.assignee)
    ]);

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

      const urgentCount = filteredCurrIssues
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
  }, [filteredPrevIssues, filteredCurrIssues]);

  return rankingData;
}
