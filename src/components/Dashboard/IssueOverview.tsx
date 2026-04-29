import React, { useState, useMemo } from 'react';
import { Issue, SortField, SortOrder, Severity } from '../../types';
import { Card } from '../common';
import { Tooltip } from '../common';
import { getDaysElapsed } from '../../utils/dataProcessor';

interface IssueOverviewProps {
  issues: Issue[];
  previousIssues: Issue[];
  onBack: () => void;
}

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

export const IssueOverview: React.FC<IssueOverviewProps> = ({ issues, previousIssues, onBack }) => {
  const [sortField, setSortField] = useState<SortField>('createdTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'urgent' | 'tracking' | 'normal'>('all');

  const stats = useMemo(() => {
    return {
      total: issues.length,
      urgent: issues.filter(i => i.category === 'urgent' && i.status !== 'resolved').length,
      tracking: issues.filter(i => i.category === 'tracking' && i.status !== 'resolved').length,
      normal: issues.filter(i => i.category === 'normal' && i.status !== 'resolved').length,
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
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-sm text-purple-500">问题单总数</div>
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
            <div className="text-3xl font-bold text-green-600">{stats.normal}</div>
            <div className="text-sm text-green-500">正常问题</div>
          </div>
        </Card>
      </div>

      <Card title="问题单总览">
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
              {cat === 'all' ? `全部 (${stats.total})` : 
               cat === 'urgent' ? `紧急 (${stats.urgent})` : 
               cat === 'tracking' ? `遗留跟踪 (${stats.tracking})` : 
               `正常 (${stats.normal})`}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('severity')}
                >
                  严重程度<SortIcon field="severity" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('assignee')}
                >
                  开发负责人<SortIcon field="assignee" />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdTime')}
                >
                  遗留时间<SortIcon field="createdTime" />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  分类<SortIcon field="category" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">备注</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无问题单数据</td>
                </tr>
              ) : (
                filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-sm font-medium">{issue.id}</td>
                    <td className="px-4 py-3 text-sm max-w-xs">
                      <Tooltip content={issue.description}>
                        <span className="block truncate">{issue.description}</span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 text-sm">{issue.assignee}</td>
                    <td className="px-4 py-3 text-sm">{getDaysElapsed(issue.createdTime)}天</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        issue.category === 'urgent' ? 'bg-red-100 text-red-800' :
                        issue.category === 'tracking' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {issue.category === 'urgent' ? '紧急' :
                         issue.category === 'tracking' ? '遗留跟踪' : '正常'}
                      </span>
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
