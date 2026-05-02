import React, { useState, useMemo } from 'react';
import { Issue, Severity } from '../../types';
import { Table, Tag, Button, Card, Statistic, Row, Col, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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

type DataType = {
  key: string;
  id: string;
  description: string;
  assignee: string;
  severity: Severity;
  remark: string;
  createdTime: Date;
};

export const IssueOverview: React.FC<IssueOverviewProps> = ({ issues, previousIssues, onBack }) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'urgent' | 'tracking' | 'normal'>('all');

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

  const filteredIssues = useMemo(() => {
    let filtered = issues.filter(i => i.status !== 'resolved');
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }
    return filtered;
  }, [issues, categoryFilter]);

  const dataSource = useMemo(() => {
    return filteredIssues.map(issue => ({
      key: issue.id,
      id: issue.id,
      description: issue.description,
      assignee: issue.assignee,
      severity: issue.severity,
      remark: issue.remark,
      createdTime: issue.createdTime
    }));
  }, [filteredIssues]);

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

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: Severity) => getSeverityTag(severity),
      sorter: (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
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
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip
          title={text}
          placement="top"
          overlayStyle={{ maxWidth: '400px', whiteSpace: 'normal', zIndex: 9999 }}
          getPopupContainer={() => document.body}
        >
          <span className="inline-block w-full truncate">{text}</span>
        </Tooltip>
      ),
      sorter: (a, b) => a.description.localeCompare(b.description)
    },
    {
      title: '开发负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      sorter: (a, b) => a.assignee.localeCompare(b.assignee)
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip
          title={text}
          placement="top"
          overlayStyle={{ maxWidth: '400px', whiteSpace: 'normal', zIndex: 9999 }}
          getPopupContainer={() => document.body}
        >
          <span className="inline-block w-full truncate">{text}</span>
        </Tooltip>
      )
    },
    {
      title: '遗留时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 100,
      render: (createdTime: Date) => `${getDaysElapsed(createdTime)}天`,
      sorter: (a, b) => getDaysElapsed(a.createdTime) - getDaysElapsed(b.createdTime)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          icon={<ArrowLeftOutlined />}
        >
          返回团队总览
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="bg-purple-50">
            <Statistic title="问题单总数" value={stats.total} prefix="📋" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-red-50">
            <Statistic title="新增问题数量" value={stats.newIssues} prefix="+" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-green-50">
            <Statistic title="解决问题数量" value={stats.resolvedIssues} prefix="✓" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-blue-50">
            <Statistic title="未变化问题单数量" value={stats.unchangedIssues} prefix="→" />
          </Card>
        </Col>
      </Row>

      <Card title="问题单总览">
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'urgent', 'tracking', 'normal'] as const).map(cat => {
            let count = 0;
            if (cat === 'all') {
              count = filteredIssues.length;
            } else {
              count = issues.filter(i => i.category === cat && i.status !== 'resolved').length;
            }
            return (
              <Button
                key={cat}
                type={categoryFilter === cat ? 'primary' : 'default'}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? `全部 (${count})` :
                 cat === 'urgent' ? `紧急 (${count})` :
                 cat === 'tracking' ? `遗留跟踪 (${count})` :
                 `正常 (${count})`}
              </Button>
            );
          })}
        </div>

        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          scroll={{ y: 500 }}
        />
      </Card>
    </div>
  );
};
