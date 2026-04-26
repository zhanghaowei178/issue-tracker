import React from 'react';
import { Issue } from '../../types';
import { Card } from '../common';
import { useComparison } from '../../hooks/useDataClassifier';

interface ComparisonViewProps {
  previousIssues: Issue[];
  currentIssues: Issue[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ previousIssues, currentIssues }) => {
  const comparison = useComparison(previousIssues, currentIssues);

  if (previousIssues.length === 0 || currentIssues.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">暂无对比数据</p>
          <p className="text-sm">请先导入昨日和今日的数据</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">开发负责人</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">昨日问题数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">今日问题数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">新增问题</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">已解决</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">未解决</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">变化趋势</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparison.map(item => (
                <tr key={item.assignee} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.assignee}</td>
                  <td className="px-4 py-3 text-center text-sm">{item.previousCount}</td>
                  <td className="px-4 py-3 text-center text-sm">{item.currentCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                      +{item.newIssues}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      {item.resolvedIssues}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{item.unresolvedIssues}</td>
                  <td className="px-4 py-3 text-center">
                    {item.currentCount > item.previousCount ? (
                      <span className="text-red-600">↑ {item.currentCount - item.previousCount}</span>
                    ) : item.currentCount < item.previousCount ? (
                      <span className="text-green-600">↓ {item.previousCount - item.currentCount}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {comparison.reduce((sum, item) => sum + item.newIssues, 0)}
            </div>
            <div className="text-sm text-blue-500">总新增问题</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {comparison.reduce((sum, item) => sum + item.resolvedIssues, 0)}
            </div>
            <div className="text-sm text-green-500">总已解决</div>
          </div>
        </Card>
        <Card className="bg-gray-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {comparison.reduce((sum, item) => sum + item.currentCount, 0)}
            </div>
            <div className="text-sm text-gray-500">当前总问题</div>
          </div>
        </Card>
      </div>
    </div>
  );
};