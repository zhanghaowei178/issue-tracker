import React, { useState, useMemo } from 'react';
import { Issue } from '../../types';
import { Card } from '../common';
import { useComparison } from '../../hooks/useDataClassifier';
import { Row, Col, Modal, Table, Card as AntCard, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';

interface ComparisonViewProps {
  previousIssues: Issue[];
  currentIssues: Issue[];
}

type SortField = 'assignee' | 'previousCount' | 'currentCount' | 'newIssues' | 'resolvedIssues' | 'unresolvedIssues' | 'changeTrend';
type SortOrder = 'asc' | 'desc';

type DataType = {
  key: string;
  id: string;
  description: string;
  assignee: string;
  severity: string;
  createdTime: Date;
  remark: string;
  link?: string;
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({ previousIssues, currentIssues }) => {
  const [sortField, setSortField] = useState<SortField>('resolvedIssues');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    issues: Issue[];
  }>({ visible: false, title: '', issues: [] });

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

  // 处理卡片点击
  const handleCardClick = (type: 'new' | 'resolved' | 'all') => {
    const previousIds = new Set(previousIssues.map(i => i.id));
    const currentIds = new Set(currentIssues.map(i => i.id));

    let issues: Issue[] = [];
    let title = '';

    if (type === 'new') {
      issues = currentIssues.filter(i => !previousIds.has(i.id));
      title = '新增问题列表';
    } else if (type === 'resolved') {
      issues = previousIssues.filter(i => !currentIds.has(i.id));
      title = '已解决问题列表';
    } else {
      issues = currentIssues;
      title = '当前所有问题列表';
    }

    setModalConfig({ visible: true, title, issues });
  };

  // 弹窗表格列定义
  const columns: TableColumnsType<DataType> = [
    {
      title: '问题编号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string, record: DataType) => (
        record.link ? (
          <a href={record.link} target="_blank" rel="noopener noreferrer">{id}</a>
        ) : (
          <span>{id}</span>
        )
      )
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: { showTitle: false },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          {description}
        </Tooltip>
      )
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      ellipsis: { showTitle: false },
      render: (assignee: string) => (
        <Tooltip placement="topLeft" title={assignee}>
          {assignee}
        </Tooltip>
      )
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      ellipsis: { showTitle: false },
      render: (severity: string) => (
        <Tooltip placement="topLeft" title={severity}>
          {severity}
        </Tooltip>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: { showTitle: false },
      render: (remark: string) => (
        <Tooltip placement="topLeft" title={remark}>
          {remark}
        </Tooltip>
      )
    }
  ];

  // 渲染排序图标
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
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
      <Row gutter={16}>
        <Col span={8}>
          <AntCard className="bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-200 transition-all border border-red-200" onClick={() => handleCardClick('new')}>
            <div className="flex flex-col items-center">
              <div className="text-3xl text-red-500 mb-2">📈</div>
              <div className="text-2xl font-bold text-red-600">
                {sortedComparison.reduce((sum, item) => sum + item.newIssues, 0)}
              </div>
              <div className="text-sm text-red-500 mt-1">新增问题</div>
            </div>
          </AntCard>
        </Col>
        <Col span={8}>
          <AntCard className="bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:from-green-100 hover:to-green-200 transition-all border border-green-200" onClick={() => handleCardClick('resolved')}>
            <div className="flex flex-col items-center">
              <div className="text-3xl text-green-500 mb-2">✅</div>
              <div className="text-2xl font-bold text-green-600">
                {sortedComparison.reduce((sum, item) => sum + item.resolvedIssues, 0)}
              </div>
              <div className="text-sm text-green-500 mt-1">已解决</div>
            </div>
          </AntCard>
        </Col>
        <Col span={8}>
          <AntCard className="bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-all border border-purple-200" onClick={() => handleCardClick('all')}>
            <div className="flex flex-col items-center">
              <div className="text-3xl text-purple-500 mb-2">📋</div>
              <div className="text-2xl font-bold text-purple-600">
                {sortedComparison.reduce((sum, item) => sum + item.currentCount, 0)}
              </div>
              <div className="text-sm text-purple-500 mt-1">当前总问题</div>
            </div>
          </AntCard>
        </Col>
      </Row>

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

      <Modal
        title={modalConfig.title}
        open={modalConfig.visible}
        onCancel={() => setModalConfig(prev => ({ ...prev, visible: false }))}
        footer={null}
        width={1000}
      >
        <Table
          dataSource={modalConfig.issues.map(i => ({
            key: i.id,
            id: i.id,
            description: i.description,
            assignee: i.assignee,
            severity: i.severity,
            createdTime: i.createdTime,
            remark: i.remark,
            link: i.link
          }))}
          columns={columns}
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />
      </Modal>
    </div>
  );
};