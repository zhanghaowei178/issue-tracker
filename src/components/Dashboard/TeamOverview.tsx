import React, { useMemo, useState } from 'react';
import { Issue } from '../../types';
import { Card, Button, Row, Col, Statistic, Modal, Table, Tooltip as AntTooltip } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CalendarOutlined, ClockCircleOutlined, PlusSquareOutlined, CheckCircleOutlined } from '@ant-design/icons';

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

  const [rankingModal, setRankingModal] = useState<{
    visible: boolean;
    assignee: string;
    type: 'new' | 'resolved';
    issues: Issue[];
  }>({ visible: false, assignee: '', type: 'new', issues: [] });

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

  // 计算新增问题排行榜
  const newIssueRanking = useMemo(() => {
    const previousIssueIds = new Set(previousIssues.map(i => i.id));
    const newIssues = issues.filter(issue => !previousIssueIds.has(issue.id));

    const rankingMap = new Map<string, { count: number; issues: Issue[] }>();

    newIssues.forEach(issue => {
      const existing = rankingMap.get(issue.assignee) || { count: 0, issues: [] };
      existing.count++;
      existing.issues.push(issue);
      rankingMap.set(issue.assignee, existing);
    });

    return Array.from(rankingMap.entries())
      .map(([assignee, data]) => ({
        assignee,
        count: data.count,
        issues: data.issues
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.assignee.localeCompare(b.assignee);
      });
  }, [issues, previousIssues]);

  // 计算已解决问题排行榜
  const resolvedIssueRanking = useMemo(() => {
    const currentIssueIds = new Set(issues.map(i => i.id));
    const resolvedIssues = previousIssues.filter(issue => !currentIssueIds.has(issue.id));

    const rankingMap = new Map<string, { count: number; issues: Issue[] }>();

    resolvedIssues.forEach(issue => {
      const existing = rankingMap.get(issue.assignee) || { count: 0, issues: [] };
      existing.count++;
      existing.issues.push(issue);
      rankingMap.set(issue.assignee, existing);
    });

    return Array.from(rankingMap.entries())
      .map(([assignee, data]) => ({
        assignee,
        count: data.count,
        issues: data.issues
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.assignee.localeCompare(b.assignee);
      });
  }, [issues, previousIssues]);

  const columns = [
    {
      title: '问题编号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string, record: Issue) => (
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
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-all border border-blue-200" onClick={() => handleCardClick('previous')}>
            <Statistic
              title={<span className="text-blue-600">昨日问题数 <CalendarOutlined className="ml-2" /></span>}
              value={stats.previousTotal}
              valueStyle={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-all border border-purple-200" onClick={() => handleCardClick('today')}>
            <Statistic
              title={<span className="text-purple-600">今日问题数 <ClockCircleOutlined className="ml-2" /></span>}
              value={stats.total}
              valueStyle={{ color: '#a855f7', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:from-green-100 hover:to-green-200 transition-all border border-green-200" onClick={() => handleCardClick('resolved')}>
            <Statistic
              title={<span className="text-green-600">已解决 <CheckCircleOutlined className="ml-2" /></span>}
              value={stats.resolvedIssuesCount}
              valueStyle={{ color: '#22c55e', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-200 transition-all border border-red-200" onClick={() => handleCardClick('new')}>
            <Statistic
              title={<span className="text-red-600">新增 <PlusSquareOutlined className="ml-2" /></span>}
              value={stats.newIssuesCount}
              valueStyle={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}
            />
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

      <Row gutter={16}>
        <Col span={12}>
          <Card title="🏆 新增问题排行榜" className="h-full">
            {newIssueRanking.length === 0 ? (
              <div className="text-gray-500 text-center py-8">暂无新增问题</div>
            ) : (
              <div className="space-y-3">
                {newIssueRanking.map((item, index) => (
                  <div
                    key={item.assignee}
                    className="p-2 rounded cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => setRankingModal({
                      visible: true,
                      assignee: item.assignee,
                      type: 'new',
                      issues: item.issues
                    })}
                  >
                    <div className="flex gap-3 items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                        index === 0 ? 'bg-rose-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-amber-500' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.assignee}</span>
                          <span className="text-red-500 font-bold">({item.count})</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.issues.map(issue => (
                            <span key={issue.id} className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs whitespace-nowrap">
                              {issue.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="✅ 已解决问题排行榜" className="h-full">
            {resolvedIssueRanking.length === 0 ? (
              <div className="text-gray-500 text-center py-8">暂无已解决问题</div>
            ) : (
              <div className="space-y-3">
                {resolvedIssueRanking.map((item, index) => (
                  <div
                    key={item.assignee}
                    className="p-2 rounded cursor-pointer hover:bg-green-50 transition-colors"
                    onClick={() => setRankingModal({
                      visible: true,
                      assignee: item.assignee,
                      type: 'resolved',
                      issues: item.issues
                    })}
                  >
                    <div className="flex gap-3 items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                        index === 0 ? 'bg-green-600' : index === 1 ? 'bg-cyan-500' : index === 2 ? 'bg-blue-400' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.assignee}</span>
                          <span className="text-green-500 font-bold">({item.count})</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.issues.map(issue => (
                            <span key={issue.id} className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-xs whitespace-nowrap">
                              {issue.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={`${rankingModal.type === 'new' ? '新增问题' : '已解决问题'} - ${rankingModal.assignee} (${rankingModal.issues.length})`}
        open={rankingModal.visible}
        onCancel={() => setRankingModal(prev => ({ ...prev, visible: false }))}
        footer={null}
        width={900}
      >
        <Table
          dataSource={rankingModal.issues}
          columns={columns}
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />
      </Modal>
    </div>
  );
};
