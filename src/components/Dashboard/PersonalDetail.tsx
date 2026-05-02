import React, { useMemo, useState } from 'react';
import { Issue, Severity } from '../../types';
import { Card, Table, Tag, Button, Row, Col, Statistic, Tooltip } from 'antd';
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
  comparison: string;
  link?: string;
};

export const PersonalDetail: React.FC<PersonalDetailProps> = ({
  assignee,
  issues,
  previousIssues,
  onBack
}) => {
  const [view, setView] = useState<'today' | 'yesterday' | 'new' | 'resolved' | 'urgent' | 'tracking'>('today');
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
    const currentIds = new Set(currentIssues.map(i => i.id));

    let displayIssues: Issue[] = [];

    switch (view) {
      case 'today':
        displayIssues = currentIssues;
        break;
      case 'yesterday':
        displayIssues = prevIssues;
        break;
      case 'new':
        displayIssues = currentIssues.filter(i => !prevIds.has(i.id));
        break;
      case 'resolved':
        displayIssues = prevIssues.filter(i => !currentIds.has(i.id));
        break;
      case 'urgent':
        displayIssues = currentIssues.filter(i => i.category === 'urgent');
        break;
      case 'tracking':
        displayIssues = currentIssues.filter(i => i.category === 'tracking');
        break;
    }

    return displayIssues.map(issue => {
      let comparison: string;
      if (view === 'resolved') {
        comparison = 'resolved';
      } else if (view === 'new') {
        comparison = 'new';
      } else if (view === 'yesterday') {
        comparison = currentIds.has(issue.id) ? 'unchanged' : 'resolved';
      } else {
        comparison = prevIds.has(issue.id) ? 'unchanged' : 'new';
      }

      return {
        key: issue.id,
        id: issue.id,
        description: issue.description,
        severity: issue.severity,
        createdTime: issue.createdTime,
        remark: issue.remark,
        status: issue.status,
        comparison,
        link: issue.link
      };
    });
  }, [currentIssues, prevIssues, view]);

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
      width: 90,
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
      width: 70
    },
    {
      title: '问题单号',
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
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="top" overlayStyle={{ maxWidth: '400px', whiteSpace: 'normal', zIndex: 9999 }} getPopupContainer={() => document.body}>
          <span className="inline-block w-full truncate">{text}</span>
        </Tooltip>
      )
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (severity: Severity) => getSeverityTag(severity)
    },
    {
      title: '遗留时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 80,
      render: (createdTime: Date) => `${getDaysElapsed(createdTime)}天`
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="top" overlayStyle={{ maxWidth: '400px', whiteSpace: 'normal', zIndex: 9999 }} getPopupContainer={() => document.body}>
          <span className="inline-block w-full truncate">{text}</span>
        </Tooltip>
      )
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
          <Card
            className={`cursor-pointer transition-all ${view === 'today' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
            onClick={() => setView('today')}
          >
            <Statistic title={<span className={view === 'today' ? 'font-bold' : ''}>今日问题数</span>} value={stats.todayCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            className={`cursor-pointer transition-all ${view === 'yesterday' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setView('yesterday')}
          >
            <Statistic title={<span className={view === 'yesterday' ? 'font-bold' : ''}>昨日问题数</span>} value={stats.yesterdayCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            className={`cursor-pointer transition-all ${view === 'new' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
            onClick={() => setView('new')}
          >
            <Statistic title={<span className={view === 'new' ? 'font-bold text-red-600' : ''}>新增</span>} value={stats.newCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            className={`cursor-pointer transition-all ${view === 'resolved' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
            onClick={() => setView('resolved')}
          >
            <Statistic title={<span className={view === 'resolved' ? 'font-bold text-green-600' : ''}>已解决</span>} value={stats.resolvedCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            className={`cursor-pointer transition-all ${view === 'urgent' ? 'ring-2 ring-orange-500' : 'hover:shadow-md'}`}
            onClick={() => setView('urgent')}
          >
            <Statistic title={<span className={view === 'urgent' ? 'font-bold text-orange-600' : ''}>紧急问题</span>} value={stats.urgentCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            className={`cursor-pointer transition-all ${view === 'tracking' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'}`}
            onClick={() => setView('tracking')}
          >
            <Statistic title={<span className={view === 'tracking' ? 'font-bold text-yellow-600' : ''}>遗留跟踪</span>} value={stats.trackingCount} />
          </Card>
        </Col>
      </Row>

      <Card title={view === 'today' ? '今日问题单' : view === 'yesterday' ? '昨日问题单' : view === 'new' ? '新增问题单' : view === 'resolved' ? '已解决问题单' : view === 'urgent' ? '紧急问题单' : '遗留跟踪问题单'}>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
