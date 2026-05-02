import React from 'react';
import { Tooltip as AntTooltip } from 'antd';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <AntTooltip
      title={content}
      placement="topLeft"
      overlayStyle={{ maxWidth: '500px', whiteSpace: 'normal' }}
      getPopupContainer={(triggerNode) => triggerNode.closest('.ant-table-cell') || triggerNode}
    >
      <span className={className}>{children}</span>
    </AntTooltip>
  );
};
