import React, { useState, useMemo } from 'react';
import { Issue, SortField, SortOrder, Severity } from '../../types';
import { Card } from '../common';
import { getDaysElapsed } from '../../utils/dataProcessor';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TeamOverviewProps {
  issues: Issue[];
  previousIssues: Issue[];
  onViewIssueOverview?: () => void;
  onViewPersonalBoard?: () => void;
}

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

export const TeamOverview: React.FC<TeamOverviewProps> = ({ 
  issues, 
  previousIssues,
  onViewIssueOverview,
  onViewPersonalBoard
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'urgent' | 'tracking' | 'normal'>('all');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const stats = useMemo(() => {
    const previousIssueIds = new Set(previousIssues.map(i => i.id));
    const currentIssueIds = new Set(issues.map(i => i.id));
    
    const newIssues = Array.from(currentIssueIds).filter(id => !previousIssueIds.has(id)).length;
    const resolvedIssues = Array.from(previousIssueIds).filter(id => !currentIssueIds.has(id)).length;
    const unchangedIssues = Array.from(currentIssueIds).filter(id => previousIssueIds.has(id)).length;
    
    return {
      total: issues.length,
      newIssues,
      resolvedIssues,
      unchangedIssues
    };
  }, [issues, previousIssues]);

  const assigneeComparison = useMemo(() => {
    const currentMap = new Map<string, number>();
    const previousMap = new Map<string, number>();
    
    issues.forEach(issue => {
      const count = currentMap.get(issue.assignee) || 0;
      currentMap.set(issue.assignee, count + 1);
    });
    
    previousIssues.forEach(issue => {
      const count = previousMap.get(issue.assignee) || 0;
      previousMap.set(issue.assignee, count + 1);
    });
    
    const allAssignees = new Set([...currentMap.keys(), ...previousMap.keys()]);
    
    return Array.from(allAssignees)
      .map(assignee => ({
        assignee,
        current: currentMap.get(assignee) || 0,
        previous: previousMap.get(assignee) || 0
      }))
      .sort((a, b) => b.current - a.current);
  }, [issues, previousIssues]);

  const hasPreviousData = previousIssues.length > 0;

  const filteredIssues = useMemo(() => {
    let filtered = issues.filter(i => i.status !== 'resolved');
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }
    
    filtered.sort((a, b) => {
      let compare = 0;
      switch (sortField) {
        case 'severity':
          compare = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'createdTime':
          compare = getDaysElapsed(a.createdTime) - getDaysElapsed(b.createdTime);
          break;
        case 'assignee':
          compare = a.assignee.localeCompare(b.assignee);
          break;
        case 'category':
          compare = (a.category || 'normal').localeCompare(b.category || 'normal');
          break;
      }
      return sortOrder === 'asc' ? compare : -compare;
    });
    
    return filtered;
  }, [issues, categoryFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1">
      {sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-sm text-purple-500">问题单总数</div>
          </div>
        </Card>
        <Card className="bg-red-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.newIssues}</div>
            <div className="text-sm text-red-500">新增问题数量</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.resolvedIssues}</div>
            <div className="text-sm text-green-500">解决问题数量</div>
          </div>
        </Card>
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.unchangedIssues}</div>
            <div className="text-sm text-blue-500">未变化问题单数量</div>
          </div>
        </Card>
      </div>

      <Card title="团队成员问题单数量">
        <div className="mb-4 flex gap-3">
          {onViewIssueOverview && (
            <button
              onClick={onViewIssueOverview}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              📋 问题单总览
            </button>
          )}
          {onViewPersonalBoard && (
            <button
              onClick={onViewPersonalBoard}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              👤 个人问题单看板
            </button>
          )}
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={assigneeComparison}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="assignee" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {hasPreviousData && (
                <Bar 
                  dataKey="previous" 
                  name="昨日" 
                  fill="#3b82f6" 
                  barSize={30}
                  label={{ position: 'top', fontSize: 12, fill: '#3b82f6' }}
                />
              )}
              <Bar 
                dataKey="current" 
                name="今日" 
                fill="#a855f7" 
                barSize={30}
                label={{ position: 'top', fontSize: 12, fill: '#a855f7' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="紧急问题看板" className="bg-red-50 border border-red-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">开发负责人</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">严重程度</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">备注</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">遗留时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.filter(i => i.category === 'urgent' && i.status !== 'resolved').length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">暂无紧急问题</td>
                </tr>
              ) : (
                issues.filter(i => i.category === 'urgent' && i.status !== 'resolved').map(issue => (
                  <tr key={issue.id}>
                    <td className="px-4 py-2 text-sm">{issue.id}</td>
                    <td className="px-4 py-2 text-sm">{issue.description}</td>
                    <td className="px-4 py-2 text-sm">{issue.assignee}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {issue.severity === 'critical' ? '致命' : '严重'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{issue.remark}</td>
                    <td className="px-4 py-2 text-sm">{getDaysElapsed(issue.createdTime)}天</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="遗留跟踪看板" className="bg-yellow-50 border border-yellow-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">开发负责人</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">严重程度</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">备注</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">遗留时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.filter(i => i.category === 'tracking' && i.status !== 'resolved').length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">暂无遗留跟踪问题</td>
                </tr>
              ) : (
                issues.filter(i => i.category === 'tracking' && i.status !== 'resolved').map(issue => (
                  <tr key={issue.id}>
                    <td className="px-4 py-2 text-sm">{issue.id}</td>
                    <td className="px-4 py-2 text-sm">{issue.description}</td>
                    <td className="px-4 py-2 text-sm">{issue.assignee}</td>
                    <td className="px-4 py-2 text-sm">{issue.severity}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{issue.remark}</td>
                    <td className="px-4 py-2 text-sm">{getDaysElapsed(issue.createdTime)}天</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'urgent', 'tracking', 'normal'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-sm rounded-full ${
                categoryFilter === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? '全部' : cat === 'urgent' ? '紧急' : cat === 'tracking' ? '遗留跟踪' : '正常'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('severity')}
                >
                  严重程度< SortIcon field="severity" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('assignee')}
                >
                  开发负责人< SortIcon field="assignee" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">备注</th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdTime')}
                >
                  遗留时间< SortIcon field="createdTime" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
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
                  <td className="px-4 py-2 text-sm">{issue.id}</td>
                  <td className="px-4 py-2 text-sm max-w-xs truncate">{issue.description}</td>
                  <td className="px-4 py-2 text-sm">{issue.assignee}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{issue.remark}</td>
                  <td className="px-4 py-2 text-sm">{getDaysElapsed(issue.createdTime)}天</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
