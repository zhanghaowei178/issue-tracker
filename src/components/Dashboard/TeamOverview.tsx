import React, { useState, useMemo } from 'react';
import { Issue, SortField, SortOrder, Severity } from '../../types';
import { Card } from '../common';
import { getDaysElapsed } from '../../utils/dataProcessor';

interface TeamOverviewProps {
  issues: Issue[];
  previousResolvedCount: number;
}

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

export const TeamOverview: React.FC<TeamOverviewProps> = ({ issues, previousResolvedCount }) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'urgent' | 'tracking' | 'normal'>('all');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const stats = useMemo(() => {
    const urgent = issues.filter(i => i.category === 'urgent' && i.status !== 'resolved');
    const tracking = issues.filter(i => i.category === 'tracking' && i.status !== 'resolved');
    const resolved = issues.filter(i => i.status === 'resolved');
    return {
      total: issues.length,
      urgent: urgent.length,
      tracking: tracking.length,
      resolved: resolved.length
    };
  }, [issues]);

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
        <Card className="bg-white">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">问题单总数</div>
          </div>
        </Card>
        <Card className="bg-red-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
            <div className="text-sm text-red-500">紧急问题</div>
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.tracking}</div>
            <div className="text-sm text-yellow-500">遗留跟踪</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{previousResolvedCount}→{stats.resolved}</div>
            <div className="text-sm text-green-500">已解决对比</div>
          </div>
        </Card>
      </div>

      <Card title="紧急问题看板" className="bg-red-50 border border-red-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">开发负责人</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">严重程度</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">遗留时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.filter(i => i.category === 'urgent' && i.status !== 'resolved').length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">暂无紧急问题</td>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.filter(i => i.category === 'tracking' && i.status !== 'resolved').length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">暂无遗留跟踪问题</td>
                </tr>
              ) : (
                issues.filter(i => i.category === 'tracking' && i.status !== 'resolved').map(issue => (
                  <tr key={issue.id}>
                    <td className="px-4 py-2 text-sm">{issue.id}</td>
                    <td className="px-4 py-2 text-sm">{issue.description}</td>
                    <td className="px-4 py-2 text-sm">{issue.assignee}</td>
                    <td className="px-4 py-2 text-sm">{issue.severity}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{issue.remark}</td>
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
                  严重程度<SortIcon field="severity" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('assignee')}
                >
                  开发负责人<SortIcon field="assignee" />
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdTime')}
                >
                  遗留时间<SortIcon field="createdTime" />
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  分类<SortIcon field="category" />
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
                  <td className="px-4 py-2 text-sm">{getDaysElapsed(issue.createdTime)}天</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs rounded ${
                      issue.category === 'urgent' ? 'bg-red-100 text-red-800' :
                      issue.category === 'tracking' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.category === 'urgent' ? '紧急' :
                       issue.category === 'tracking' ? '遗留跟踪' : '正常'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};