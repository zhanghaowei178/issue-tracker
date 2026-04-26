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

export function useComparison(
  previousIssues: Issue[],
  currentIssues: Issue[]
) {
  const comparison = useMemo(() => {
    const prevMap = new Map<string, Issue>();
    previousIssues.forEach(issue => prevMap.set(issue.id, issue));

    const currentMap = new Map<string, Issue>();
    currentIssues.forEach(issue => currentMap.set(issue.id, issue));

    const allAssignees = new Set([
      ...previousIssues.map(i => i.assignee),
      ...currentIssues.map(i => i.assignee)
    ]);

    const comparisonData: ComparisonData[] = [];

    allAssignees.forEach(assignee => {
      const prevIssues = previousIssues.filter(i => i.assignee === assignee);
      const currIssues = currentIssues.filter(i => i.assignee === assignee);

      const prevIds = new Set(prevIssues.map(i => i.id));
      const currIds = new Set(currIssues.map(i => i.id));

      const newIssues = currIssues.filter(i => !prevIds.has(i.id)).length;
      const resolvedIssues = prevIssues.filter(i => 
        i.status !== 'resolved' && currIds.has(i.id)
      ).length;
      const unresolvedIssues = currIssues.filter(i => 
        !prevIds.has(i.id) || (prevIds.has(i.id) && currIssues.find(c => c.id === i.id)?.status !== 'resolved')
      ).length;

      comparisonData.push({
        assignee,
        previousCount: prevIssues.length,
        currentCount: currIssues.length,
        newIssues,
        resolvedIssues,
        unresolvedIssues
      });
    });

    return comparisonData.sort((a, b) => b.resolvedIssues - a.resolvedIssues);
  }, [previousIssues, currentIssues]);

  return comparison;
}