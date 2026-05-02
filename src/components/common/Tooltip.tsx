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
      placement="top"
      overlayStyle={{ maxWidth: '500px' }}
    >
      <div className={className}>{children}</div>
    </AntTooltip>
  );
};
