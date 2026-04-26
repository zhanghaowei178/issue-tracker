import React, { useMemo } from 'react';
import { Issue } from '../../types';
import { Card } from '../common';
import { Button } from '../common';
import { getDaysElapsed } from '../../utils/dataProcessor';

interface PersonalDetailProps {
  assignee: string;
  issues: Issue[];
  onBack: () => void;
}

export const PersonalDetail: React.FC<PersonalDetailProps> = ({ assignee, issues, onBack }) => {
  const stats = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === 'resolved');
    const unresolved = issues.filter(i => i.status !== 'resolved');
    const urgent = unresolved.filter(i => i.category === 'urgent');
    const tracking = unresolved.filter(i => i.category === 'tracking');
    return { total, resolved: resolved.length, unresolved: unresolved.length, urgent: urgent.length, tracking: tracking.length };
  }, [issues]);

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      if (a.status === 'resolved' && b.status !== 'resolved') return 1;
      if (a.status !== 'resolved' && b.status === 'resolved') return -1;
      
      const categoryOrder = { urgent: 0, tracking: 1, normal: 2 };
      const aOrder = categoryOrder[a.category || 'normal'];
      const bOrder = categoryOrder[b.category || 'normal'];
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [issues]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onBack}>← 返回</Button>
        <h2 className="text-xl font-bold text-gray-900">个人详情 - {assignee}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-500">问题单总数</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-green-500">已解决</div>
          </div>
        </Card>
        <Card className="bg-gray-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.unresolved}</div>
            <div className="text-xs text-gray-500">未解决</div>
          </div>
        </Card>
        <Card className="bg-red-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            <div className="text-xs text-red-500">紧急</div>
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.tracking}</div>
            <div className="text-xs text-yellow-500">遗留跟踪</div>
          </div>
        </Card>
      </div>

      {stats.urgent > 0 && (
        <Card title="紧急问题单" className="bg-red-50 border border-red-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">严重程度</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">遗留时间</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">备注</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedIssues.filter(i => i.category === 'urgent' && i.status !== 'resolved').map(issue => (
                  <tr key={issue.id}>
                    <td className="px-3 py-2 text-sm">{issue.id}</td>
                    <td className="px-3 py-2 text-sm">{issue.description}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {issue.severity === 'critical' ? '致命' : '严重'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">{getDaysElapsed(issue.createdTime)}天</td>
                    <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate">{issue.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {stats.tracking > 0 && (
        <Card title="遗留跟踪问题单" className="bg-yellow-50 border border-yellow-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">严重程度</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">备注</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedIssues.filter(i => i.category === 'tracking' && i.status !== 'resolved').map(issue => (
                  <tr key={issue.id}>
                    <td className="px-3 py-2 text-sm">{issue.id}</td>
                    <td className="px-3 py-2 text-sm">{issue.description}</td>
                    <td className="px-3 py-2 text-sm">{issue.severity}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate">{issue.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="所有问题单">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题单号</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题描述</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">严重程度</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">分类</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">遗留时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">
                    {issue.status === 'resolved' ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">已解决</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">未解决</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm">{issue.id}</td>
                  <td className="px-3 py-2 text-sm max-w-xs truncate">{issue.description}</td>
                  <td className="px-3 py-2 text-sm">
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
                  <td className="px-3 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs rounded ${
                      issue.category === 'urgent' ? 'bg-red-100 text-red-800' :
                      issue.category === 'tracking' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.category === 'urgent' ? '紧急' :
                       issue.category === 'tracking' ? '遗留跟踪' : '正常'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {issue.status === 'resolved' ? '已解决' : `${getDaysElapsed(issue.createdTime)}天`}
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