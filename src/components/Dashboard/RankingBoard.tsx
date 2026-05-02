import React, { useMemo, useState } from 'react';
import { Issue } from '../../types';
import { Card } from '../common';
import { useRankingData } from '../../hooks/useDataClassifier';

interface RankingBoardProps {
  issues: Issue[];
  previousIssues: Issue[];
  onViewDetail: (assignee: string) => void;
}

type RankingType = 'resolvedToday' | 'newToday' | 'total' | 'unresolved' | 'previousCount';

export const RankingBoard: React.FC<RankingBoardProps> = ({ issues, previousIssues, onViewDetail }) => {
  const [rankingType, setRankingType] = useState<RankingType>('resolvedToday');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const rankingData = useRankingData(previousIssues, issues);

  const sortedRankingData = useMemo(() => {
    const sorted = [...rankingData].sort((a, b) => {
      let compare = 0;
      switch (rankingType) {
        case 'resolvedToday':
          compare = a.resolvedToday - b.resolvedToday;
          break;
        case 'newToday':
          compare = a.newToday - b.newToday;
          break;
        case 'total':
          compare = a.totalCount - b.totalCount;
          break;
        case 'unresolved':
          compare = a.unresolvedCount - b.unresolvedCount;
          break;
        case 'previousCount':
          compare = a.previousCount - b.previousCount;
          break;
      }
      return sortOrder === 'desc' ? -compare : compare;
    });
    return sorted;
  }, [rankingData, rankingType, sortOrder]);

  const handleSort = (type: RankingType) => {
    if (rankingType === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setRankingType(type);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ type }: { type: RankingType }) => (
    <span className="ml-1">
      {rankingType === type ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">排名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">开发负责人</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('previousCount')}>
                  昨日问题数<SortIcon type="previousCount" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total')}>
                  问题单总数<SortIcon type="total" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('newToday')}>
                  今日新增<SortIcon type="newToday" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('resolvedToday')}>
                  今日已解决<SortIcon type="resolvedToday" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('unresolved')}>
                  未解决<SortIcon type="unresolved" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">严重遗留</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-24">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRankingData.map((member, index) => (
                <tr key={member.assignee} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-50 text-blue-800'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.assignee}</td>
                  <td className="px-4 py-3 text-center text-sm">{member.previousCount}</td>
                  <td className="px-4 py-3 text-center text-sm">{member.totalCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                      +{member.newToday}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      {member.resolvedToday}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{member.unresolvedCount}</td>
                  <td className="px-4 py-3 text-center">
                    {member.urgentCount > 0 ? (
                      <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">{member.urgentCount}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onViewDetail(member.assignee)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      查看详情
                    </button>
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
