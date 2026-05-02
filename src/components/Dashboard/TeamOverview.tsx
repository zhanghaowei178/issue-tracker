import React, { useMemo, useState } from 'react';
import { Issue } from '../../types';
import { Card, Button, Row, Col, Statistic, Modal, Table, Tooltip as AntTooltip } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';

interface TeamOverviewProps {
  issues: Issue[];
  previousIssues: Issue[];
  onViewIssueOverview?: () => void;
  onViewPersonalBoard?: () => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({
  issues,
  previousIssues,
  onViewIssueOverview,
  onViewPersonalBoard
}) => {
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    issues: Issue[];
  }>({ visible: false, title: '', issues: [] });

  const stats = useMemo(() => {
    const previousIssueIds = new Set(previousIssues.map(i => i.id));
    const currentIssueIds = new Set(issues.map(i => i.id));

    const newIssues = issues.filter(issue => !previousIssueIds.has(issue.id));
    const resolvedIssues = previousIssues.filter(issue => !currentIssueIds.has(issue.id));
    const unchangedIssues = issues.filter(issue => previousIssueIds.has(issue.id));

    return {
      total: issues.length,
      previousTotal: previousIssues.length,
      newIssues,
      resolvedIssues,
      unchangedIssues,
      newIssuesCount: newIssues.length,
      resolvedIssuesCount: resolvedIssues.length,
      unchangedIssuesCount: unchangedIssues.length
    };
  }, [issues, previousIssues]);

  const handleCardClick = (type: 'previous' | 'today' | 'resolved' | 'new') => {
    let title = '';
    let targetIssues: Issue[] = [];

    switch (type) {
      case 'previous':
        title = '昨日问题单';
        targetIssues = previousIssues;
        break;
      case 'today':
        title = '今日问题单';
        targetIssues = issues;
        break;
      case 'resolved':
        title = '已解决问题单';
        targetIssues = previousIssues.filter(issue => !new Set(issues.map(i => i.id)).has(issue.id));
        break;
      case 'new':
        title = '新增问题单';
        targetIssues = issues.filter(issue => !new Set(previousIssues.map(i => i.id)).has(issue.id));
        break;
    }

    setModalConfig({ visible: true, title, issues: targetIssues });
  };

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

  const columns = [
    { title: '问题编号', dataIndex: 'id', key: 'id', width: 120 },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <AntTooltip title={text} placement="top" overlayStyle={{ maxWidth: '400px', whiteSpace: 'normal', zIndex: 9999 }} getPopupContainer={() => document.body}>
          <span className="inline-block w-full truncate">{text}</span>
        </AntTooltip>
      )
    },
    { title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 120 },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 100 },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <AntTooltip title={text} placement="top" overlayStyle={{ maxWidth: '400px', whiteSpace: 'normal', zIndex: 9999 }} getPopupContainer={() => document.body}>
          <span className="inline-block w-full truncate">{text}</span>
        </AntTooltip>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => handleCardClick('previous')}>
            <Statistic title={<span>昨日问题数 <ArrowDownOutlined className="ml-2" /></span>} value={stats.previousTotal} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => handleCardClick('today')}>
            <Statistic title={<span>今日问题数 <CloseCircleOutlined className="ml-2" /></span>} value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => handleCardClick('resolved')}>
            <Statistic title={<span>已解决 <ArrowUpOutlined className="ml-2" /></span>} value={stats.resolvedIssuesCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-red-50 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => handleCardClick('new')}>
            <Statistic title={<span>新增 <PlusOutlined className="ml-2" /></span>} value={stats.newIssuesCount} />
          </Card>
        </Col>
      </Row>

      <Modal
        title={modalConfig.title}
        open={modalConfig.visible}
        onCancel={() => setModalConfig({ ...modalConfig, visible: false })}
        footer={null}
        width={1200}
        bodyStyle={{ padding: '12px', maxHeight: '60vh', overflow: 'hidden' }}
      >
        <Table
          dataSource={modalConfig.issues}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ y: 500 }}
        />
      </Modal>

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
    </div>
  );
};
