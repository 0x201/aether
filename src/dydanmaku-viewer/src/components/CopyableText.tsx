import React, { type ReactNode } from 'react';
import { Typography, Tooltip, message } from 'antd';

const { Text } = Typography;

interface CopyableTextProps {
  text: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  tooltip?: string;
}

const CopyableText: React.FC<CopyableTextProps> = ({ 
  text, 
  children, 
  style,
  tooltip
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = (e: React.MouseEvent | React.ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    navigator.clipboard.writeText(text).then(() => {
      messageApi.success('已复制');
    }).catch(err => {
      console.error('复制失败:', err);
      messageApi.error('复制失败');
    });
  };

  const content = (
    <Text
      style={{ cursor: 'pointer', ...style }}
      onCopy={handleCopy}
      onClick={handleCopy}
    >
      {children || text}
    </Text>
  );

  return (
    <>
      {contextHolder}
      {tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content}
    </>
  );
};

export default CopyableText;