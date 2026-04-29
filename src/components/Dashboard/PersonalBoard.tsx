import React, { useState, useMemo } from 'react';
import { Issue } from '../../types';
import { Card } from '../common';
import { Tooltip } from '../common';
import { Button } from '../common';

interface PersonalBoardProps {
  issues: Issue[];
  previousIssues: Issue[];
  onViewDetail: (assignee: string) => void;
  onBack: () => void;
}

export const PersonalBoard: React.FC<PersonalBoardProps> = ({
  issues,
  previousIssues,
  onViewDetail,
  onBack
}) => {
  const [sortField, setSortField] = useState<'totalCount' | 'resolvedCount' | 'newCount'>('totalCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const assigneeStats = useMemo(() => {
    const currentMap = new Map<string, {
      assignee: string;
      totalCount: number;
      resolvedCount: number;
      newCount: number;
      urgentCount: number;
      trackingCount: number;
      normalCount: number;
    }>();

    issues.forEach(issue => {
      const existing = currentMap.get(issue.assignee) || {
        assignee: issue.assignee,
        totalCount: 0,
        resolvedCount: 0,
        newCount: 0,
        urgentCount: 0,
        trackingCount: 0,
        normalCount: 0
      };

      existing.totalCount++;
      if (issue.category === 'urgent') existing.urgentCount++;
      if (issue.category === 'tracking') existing.trackingCount++;
      if (issue.category === 'normal') existing.normalCount++;

      currentMap.set(issue.assignee, existing);
    });

    const previousIssueIds = new Set(previousIssues.map(i => i.id));
    const currentIssueIds = new Set(issues.map(i => i.id));

    const newIssuesByAssignee = new Map<string, number>();
    issues.forEach(issue => {
      if (!previousIssueIds.has(issue.id)) {
        const count = newIssuesByAssignee.get(issue.assignee) || 0;
        newIssuesByAssignee.set(issue.assignee, count + 1);
      }
    });

    const resolvedByAssignee = new Map<string, number>();
    previousIssues.forEach(issue => {
      if (!currentIssueIds.has(issue.id)) {
        const count = resolvedByAssignee.get(issue.assignee) || 0;
        resolvedByAssignee.set(issue.assignee, count + 1);
      }
    });

    return Array.from(currentMap.values()).map(stat => ({
      ...stat,
      newCount: newIssuesByAssignee.get(stat.assignee) || 0,
      resolvedCount: resolvedByAssignee.get(stat.assignee) || 0
    }));
  }, [issues, previousIssues]);

  const sortedStats = useMemo(() => {
    return [...assigneeStats].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [assigneeStats, sortField, sortOrder]);

  const handleSort = (field: 'totalCount' | 'resolvedCount' | 'newCount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'totalCount' | 'resolvedCount' | 'newCount' }) => (
    <span className="ml-1">
      {sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          ← 返回团队总览
        </button>
      </div>

      <Card title="个人问题单看板">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">开发负责人</th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalCount')}
                >
                  问题单总数<SortIcon field="totalCount" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('resolvedCount')}
                >
                  解单数量<SortIcon field="resolvedCount" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('newCount')}
                >
                  新增单子<SortIcon field="newCount" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">紧急</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">遗留跟踪</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">正常</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                sortedStats.map(stat => (
                  <tr key={stat.assignee} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{stat.assignee}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {stat.totalCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {stat.resolvedCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                        {stat.newCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        stat.urgentCount > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.urgentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        stat.trackingCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.trackingCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        stat.normalCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.normalCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="secondary"
                        onClick={() => onViewDetail(stat.assignee)}
                        className="text-xs px-2 py-1"
                      >
                        查看详情
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="问题单详情">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">严重程度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">遗留时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">备注</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStats.flatMap(stat =>
                issues.filter(issue => issue.assignee === stat.assignee).map(issue => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{issue.id}</td>
                    <td className="px-4 py-3 text-sm max-w-xs">
                      <Tooltip content={issue.description}>
                        <span className="block truncate">{issue.description}</span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {issue.severity === 'critical' ? '致命' :
                         issue.severity === 'high' ? '严重' :
                         issue.severity === 'medium' ? '一般' : '提示'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {Math.floor((new Date().getTime() - new Date(issue.createdTime).getTime()) / (1000 * 60 * 60 * 24))}天
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs">
                      <Tooltip content={issue.remark}>
                        <span className="block truncate">{issue.remark || '-'}</span>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
