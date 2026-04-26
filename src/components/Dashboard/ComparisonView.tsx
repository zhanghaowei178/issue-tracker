import React, { useState, useMemo } from 'react';
import { Issue } from '../../types';
import { Card } from '../common';
import { useComparison } from '../../hooks/useDataClassifier';

interface ComparisonViewProps {
  previousIssues: Issue[];
  currentIssues: Issue[];
}

type SortField = 'assignee' | 'previousCount' | 'currentCount' | 'newIssues' | 'resolvedIssues' | 'unresolvedIssues' | 'changeTrend';
type SortOrder = 'asc' | 'desc';

export const ComparisonView: React.FC<ComparisonViewProps> = ({ previousIssues, currentIssues }) => {
  const [sortField, setSortField] = useState<SortField>('resolvedIssues');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const comparison = useComparison(previousIssues, currentIssues);

  // 排序逻辑
  const sortedComparison = useMemo(() => {
    return [...comparison].sort((a, b) => {
      if (sortField === 'assignee') {
        return sortOrder === 'asc' 
          ? a.assignee.localeCompare(b.assignee)
          : b.assignee.localeCompare(a.assignee);
      } else if (sortField === 'changeTrend') {
        const trendA = a.currentCount - a.previousCount;
        const trendB = b.currentCount - b.previousCount;
        return sortOrder === 'asc' ? trendA - trendB : trendB - trendA;
      } else {
        const valueA = a[sortField as keyof typeof a];
        const valueB = b[sortField as keyof typeof b];
        return sortOrder === 'asc' ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
      }
    });
  }, [comparison, sortField, sortOrder]);

  // 处理排序点击
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 渲染排序图标
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↓' : '↑';
  };

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
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('assignee')}
                >
                  开发负责人 {renderSortIcon('assignee')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('previousCount')}
                >
                  昨日问题数 {renderSortIcon('previousCount')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('currentCount')}
                >
                  今日问题数 {renderSortIcon('currentCount')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('newIssues')}
                >
                  新增问题 {renderSortIcon('newIssues')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('resolvedIssues')}
                >
                  已解决 {renderSortIcon('resolvedIssues')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('unresolvedIssues')}
                >
                  未解决 {renderSortIcon('unresolvedIssues')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('changeTrend')}
                >
                  变化趋势 {renderSortIcon('changeTrend')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedComparison.map(item => {
                const change = item.currentCount - item.previousCount;
                return (
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
                      {change > 0 ? (
                        <span className="text-red-600">↑ {change}</span>
                      ) : change < 0 ? (
                        <span className="text-green-600">↓ {Math.abs(change)}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sortedComparison.reduce((sum, item) => sum + item.newIssues, 0)}
            </div>
            <div className="text-sm text-blue-500">总新增问题</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {sortedComparison.reduce((sum, item) => sum + item.resolvedIssues, 0)}
            </div>
            <div className="text-sm text-green-500">总已解决</div>
          </div>
        </Card>
        <Card className="bg-gray-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {sortedComparison.reduce((sum, item) => sum + item.currentCount, 0)}
            </div>
            <div className="text-sm text-gray-500">当前总问题</div>
          </div>
        </Card>
      </div>
    </div>
  );
};