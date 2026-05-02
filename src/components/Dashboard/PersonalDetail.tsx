import React, { useMemo } from 'react';
import { Issue, Severity } from '../../types';
import { Card, Table, Tag, Button, Row, Col, Statistic } from 'antd';
import type { TableProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getDaysElapsed } from '../../utils/dataProcessor';

interface PersonalDetailProps {
  assignee: string;
  issues: Issue[];
  previousIssues: Issue[];
  onBack: () => void;
}

type DataType = {
  key: string;
  id: string;
  description: string;
  severity: Severity;
  createdTime: Date;
  remark: string;
  status: string;
  comparison: 'new' | 'resolved' | 'unchanged';
};

export const PersonalDetail: React.FC<PersonalDetailProps> = ({
  assignee,
  issues,
  previousIssues,
  onBack
}) => {
  const currentIssues = useMemo(() => issues.filter(i => i.assignee === assignee), [issues, assignee]);
  const prevIssues = useMemo(() => previousIssues.filter(i => i.assignee === assignee), [previousIssues, assignee]);

  const stats = useMemo(() => {
    const currentIds = new Set(currentIssues.map(i => i.id));
    const prevIds = new Set(prevIssues.map(i => i.id));

    const newIssues = currentIssues.filter(i => !prevIds.has(i.id));
    const resolvedIssues = prevIssues.filter(i => !currentIds.has(i.id));
    const unchangedIssues = currentIssues.filter(i => prevIds.has(i.id));

    const urgentCount = currentIssues.filter(i => i.category === 'urgent').length;
    const trackingCount = currentIssues.filter(i => i.category === 'tracking').length;

    return {
      todayCount: currentIssues.length,
      yesterdayCount: prevIssues.length,
      newCount: newIssues.length,
      resolvedCount: resolvedIssues.length,
      unchangedCount: unchangedIssues.length,
      urgentCount,
      trackingCount
    };
  }, [currentIssues, prevIssues]);

  const dataSource = useMemo(() => {
    const prevIds = new Set(prevIssues.map(i => i.id));

    return currentIssues.map(issue => ({
      key: issue.id,
      id: issue.id,
      description: issue.description,
      severity: issue.severity,
      createdTime: issue.createdTime,
      remark: issue.remark,
      status: issue.status,
      comparison: prevIds.has(issue.id) ? 'unchanged' : 'new'
    }));
  }, [currentIssues, prevIssues]);

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
      title: '对比状态',
      dataIndex: 'comparison',
      key: 'comparison',
      width: 100,
      render: (comp: 'new' | 'resolved' | 'unchanged') => {
        const colorMap = {
          new: 'red',
          resolved: 'green',
          unchanged: 'blue'
        };
        const labelMap = {
          new: '新增',
          resolved: '已解决',
          unchanged: '未变化'
        };
        return <Tag color={colorMap[comp]}>{labelMap[comp]}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80
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
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: Severity) => getSeverityTag(severity)
    },
    {
      title: '遗留时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 100,
      render: (createdTime: Date) => `${getDaysElapsed(createdTime)}天`
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: { showTitle: true }
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{assignee} 的问题单详情</h2>
          <Button
            onClick={onBack}
            icon={<ArrowLeftOutlined />}
          >
            返回
          </Button>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="昨日问题数" value={stats.yesterdayCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日问题数" value={stats.todayCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="新增" value={stats.newCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已解决" value={stats.resolvedCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="紧急问题" value={stats.urgentCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="遗留跟踪" value={stats.trackingCount} />
          </Card>
        </Col>
      </Row>

      <Card title="所有问题单">
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};
