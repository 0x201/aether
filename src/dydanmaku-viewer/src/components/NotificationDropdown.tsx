import React from 'react';
import { Badge, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { BellOutlined, ClearOutlined } from '@ant-design/icons';
import { useMessageContext } from '@/src/contexts/MessageContext';
import dayjs from 'dayjs';

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, clearAll } = useMessageContext();

  const menuItems: MenuProps['items'] = notifications.length > 0
    ? notifications.map((notification, index) => ({
        key: `notification-${index}`,
        label: (
          <div style={{ width: '300px' }}>
            <div><strong>房间: {notification.roomId}</strong></div>
            <div>统计周期: {notification.periodType}</div>
            <div>开始时间：{notification.startDate}</div>
            <div>结束时间：{notification.endDate}</div>
            <div>词频数: {notification.frequenciesCount}</div>
            <div>时间: {dayjs(notification.completedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
          </div>
        ),
        onClick: () => markAsRead(notification.id)
      }))
    : [{
        key: 'empty',
        label: '暂无通知',
        disabled: true
      }];

  const actionMenuItems: MenuProps['items'] = [
    {
      key: 'clear-all',
      label: '清空所有',
      icon: <ClearOutlined />,
      danger: true,
      onClick: clearAll
    }
  ];

  const dropdownMenu: MenuProps = {
    items: [...menuItems, ...actionMenuItems]
  };

  return (
    <Dropdown menu={dropdownMenu} trigger={['click']} placement="bottomRight">
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;