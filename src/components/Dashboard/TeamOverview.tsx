import React, { useState, useMemo } from 'react';
import { Issue, SortField, SortOrder, Severity } from '../../types';
import { Card, Button, Table, Tag, Row, Col, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDaysElapsed } from '../../utils/dataProcessor';

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
    const urgent = issues.filter(i => i.category === 'urgent' && i.status !== 'resolved');
    const tracking = issues.filter(i => i.category === 'tracking' && i.status !== 'resolved');

    const previousIssueIds = new Set(previousIssues.map(i => i.id));
    const currentIssueIds = new Set(issues.map(i => i.id));

    const newIssues = Array.from(currentIssueIds).filter(id => !previousIssueIds.has(id)).length;
    const resolvedIssues = Array.from(previousIssueIds).filter(id => !currentIssueIds.has(id)).length;

    return {
      total: issues.length,
      previousTotal: previousIssues.length,
      urgent: urgent.length,
      tracking: tracking.length,
      newIssues,
      resolvedIssues
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

  const getSeverityTag = (severity: Severity) => {
    const colorMap = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green'
    };
    const labelMap = {
      critical: '致命',
      high: '严重',
      medium: '一般',
      low: '提示'
    };
    return <Tag color={colorMap[severity]}>{labelMap[severity]}</Tag>;
  };

  const columns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (issue: Issue) => getSeverityTag(issue.severity),
      sorter: (a: Issue, b: Issue) => severityOrder[a.severity] - severityOrder[b.severity]
    },
    {
      title: '问题单号',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: { showTitle: true }
    },
    {
      title: '开发负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: { showTitle: true }
    },
    {
      title: '遗留时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 100,
      render: (issue: Issue) => `${getDaysElapsed(issue.createdTime)}天`,
      sorter: (a: Issue, b: Issue) => getDaysElapsed(a.createdTime) - getDaysElapsed(b.createdTime)
    }
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={4}>
          <Card className="bg-blue-50">
            <Statistic title="昨日问题数" value={stats.previousTotal} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="bg-purple-50">
            <Statistic title="今日问题数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="bg-green-50">
            <Statistic title="已解决" value={stats.resolvedIssues} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="bg-red-50">
            <Statistic title="新增" value={stats.newIssues} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="bg-orange-50">
            <Statistic title="紧急问题" value={stats.urgent} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="bg-yellow-50">
            <Statistic title="遗留跟踪" value={stats.tracking} />
          </Card>
        </Col>
      </Row>

      <Card title="团队成员问题单数量">
        <div className="mb-4 flex gap-3">
          {onViewIssueOverview && (
            <Button type="primary" onClick={onViewIssueOverview}>
              📋 问题单总览
            </Button>
          )}
          {onViewPersonalBoard && (
            <Button onClick={onViewPersonalBoard}>
              👤 个人问题单看板
            </Button>
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

      <Card title="紧急问题看板" className="bg-red-50">
        <Table
          dataSource={issues.filter(i => i.category === 'urgent' && i.status !== 'resolved').map(i => ({ ...i, key: i.id }))}
          columns={[
            { title: '问题单号', dataIndex: 'id', key: 'id', width: 120 },
            { title: '问题描述', dataIndex: 'description', key: 'description', ellipsis: { showTitle: true } },
            { title: '开发负责人', dataIndex: 'assignee', key: 'assignee', width: 120 },
            { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 100, render: (s: Severity) => getSeverityTag(s) },
            { title: '遗留时间', dataIndex: 'createdTime', key: 'createdTime', width: 100, render: (i: Issue) => `${getDaysElapsed(i.createdTime)}天` }
          ]}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="遗留跟踪看板" className="bg-yellow-50">
        <Table
          dataSource={issues.filter(i => i.category === 'tracking' && i.status !== 'resolved').map(i => ({ ...i, key: i.id }))}
          columns={[
            { title: '问题单号', dataIndex: 'id', key: 'id', width: 120 },
            { title: '问题描述', dataIndex: 'description', key: 'description', ellipsis: { showTitle: true } },
            { title: '开发负责人', dataIndex: 'assignee', key: 'assignee', width: 120 },
            { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 100, render: (s: Severity) => getSeverityTag(s) },
            { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: { showTitle: true } }
          ]}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="问题单列表">
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'urgent', 'tracking', 'normal'] as const).map(cat => (
            <Button
              key={cat}
              type={categoryFilter === cat ? 'primary' : 'default'}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? '全部' : cat === 'urgent' ? '紧急' : cat === 'tracking' ? '遗留跟踪' : '正常'}
            </Button>
          ))}
        </div>

        <Table
          dataSource={filteredIssues.map(i => ({ ...i, key: i.id }))}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};
