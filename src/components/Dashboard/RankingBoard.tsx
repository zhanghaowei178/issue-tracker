import React, { useMemo } from 'react';
import { Issue } from '../../types';
import { Card, Table, Tag, Button, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface RankingBoardProps {
  issues: Issue[];
  previousIssues: Issue[];
  onBack: () => void;
  onViewDetail: (assignee: string) => void;
}

type DataType = {
  key: string;
  assignee: string;
  yesterdayCount: number;
  todayCount: number;
  resolvedCount: number;
  newCount: number;
  urgentCount: number;
  trackingCount: number;
};

export const RankingBoard: React.FC<RankingBoardProps> = ({
  issues,
  previousIssues,
  onBack,
  onViewDetail
}) => {
  const rankingData = useMemo(() => {
    const currentMap = new Map<string, { total: number; urgent: number; tracking: number }>();
    const previousMap = new Map<string, number>();

    issues.forEach(issue => {
      const existing = currentMap.get(issue.assignee) || { total: 0, urgent: 0, tracking: 0 };
      currentMap.set(issue.assignee, {
        total: existing.total + 1,
        urgent: existing.urgent + (issue.category === 'urgent' ? 1 : 0),
        tracking: existing.tracking + (issue.category === 'tracking' ? 1 : 0)
      });
    });

    previousIssues.forEach(issue => {
      const count = previousMap.get(issue.assignee) || 0;
      previousMap.set(issue.assignee, count + 1);
    });

    const allAssignees = new Set([...currentMap.keys(), ...previousMap.keys()]);

    return Array.from(allAssignees).map(assignee => {
      const current = currentMap.get(assignee);
      const todayCount = current?.total || 0;
      const yesterdayCount = previousMap.get(assignee) || 0;
      const resolvedCount = Math.max(0, yesterdayCount - todayCount);
      const newCount = Math.max(0, todayCount - yesterdayCount);

      return {
        key: assignee,
        assignee,
        yesterdayCount,
        todayCount,
        resolvedCount,
        newCount,
        urgentCount: current?.urgent || 0,
        trackingCount: current?.tracking || 0
      };
    }).sort((a, b) => b.todayCount - a.todayCount);
  }, [issues, previousIssues]);

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '开发负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 140
    },
    {
      title: '昨日问题数',
      dataIndex: 'yesterdayCount',
      key: 'yesterdayCount',
      width: 100,
      sorter: true,
      align: 'center'
    },
    {
      title: '今日问题数',
      dataIndex: 'todayCount',
      key: 'todayCount',
      width: 100,
      sorter: true,
      align: 'center'
    },
    {
      title: '解单数量',
      dataIndex: 'resolvedCount',
      key: 'resolvedCount',
      width: 100,
      sorter: true,
      align: 'center',
      render: (text: number) => <Tag color="green">{text}</Tag>
    },
    {
      title: '新增单子',
      dataIndex: 'newCount',
      key: 'newCount',
      width: 100,
      sorter: true,
      align: 'center',
      render: (text: number) => <Tag color="red">{text}</Tag>
    },
    {
      title: '紧急问题',
      dataIndex: 'urgentCount',
      key: 'urgentCount',
      width: 100,
      sorter: true,
      align: 'center',
      render: (text: number) => <Tag color="orange">{text}</Tag>
    },
    {
      title: '遗留跟踪',
      dataIndex: 'trackingCount',
      key: 'trackingCount',
      width: 100,
      sorter: true,
      align: 'center',
      render: (text: number) => <Tag color="gold">{text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DataType) => (
        <Button
          onClick={() => onViewDetail(record.assignee)}
          className="text-xs px-2 py-1"
        >
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">解单排行榜</h2>
          <Button
            onClick={onBack}
            icon={<ArrowLeftOutlined />}
          >
            返回团队总览
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          dataSource={rankingData}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};
