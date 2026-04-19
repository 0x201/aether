import React from 'react'
import { Badge, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { BellOutlined, ClearOutlined } from '@ant-design/icons'
import { useMessage } from '@/src/contexts/useMessage'
import dayjs from 'dayjs'
import type { AnalyticsMessage } from '@/src/interface/Message'

const MessageBox: React.FC = () => {
  const { messages, unreadCount, markAsRead, clearAll } = useMessage()

  const menuItems: MenuProps['items'] =
    messages.length > 0
      ? (messages as AnalyticsMessage[]).map((message, index) => ({
          key: `message-${index}`,
          label: (
            <div style={{ width: '300px' }}>
              <div>
                <strong>房间: {message.roomId}</strong>
              </div>
              <div>统计周期: {message.periodType}</div>
              <div>开始时间：{message.startDate}</div>
              <div>结束时间：{message.endDate}</div>
              <div>词频数: {message.frequenciesCount}</div>
              <div>时间: {dayjs(message.completedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
            </div>
          ),
          onClick: () => markAsRead(message.id),
        }))
      : [
          {
            key: 'empty',
            label: '暂无通知',
            disabled: true,
          },
        ]

  const actionMenuItems: MenuProps['items'] = [
    {
      key: 'clear-all',
      label: '清空所有',
      icon: <ClearOutlined />,
      danger: true,
      onClick: clearAll,
    },
  ]

  const dropdownMenu: MenuProps = {
    items: [...menuItems, ...actionMenuItems],
  }

  return (
    <Dropdown menu={dropdownMenu} trigger={['click']} placement="bottomRight">
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  )
}

export { MessageBox }

export default MessageBox
