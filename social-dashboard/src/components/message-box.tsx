import React from 'react'
import { Badge, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { BellOutlined, ClearOutlined } from '@ant-design/icons'
import { useMessage } from '@/src/contexts/useMessage'
import dayjs from 'dayjs'
import type { Message } from '@/src/interface/Message'
import { m } from "@/src/i18n";


const renderMessageLabel = (message: Message) => {
  if (message.kind === 'analytics') {
    const formattedTime = dayjs(message.completedAt).format('YYYY-MM-DD HH:mm:ss');
    return (
      <div style={{ width: '300px' }}>
        <div>
          <strong>{m.msg_box_analytics_room_label({ roomId: message.roomId })}</strong>
        </div>
        <div>{m.msg_box_analytics_period_label({ periodType: message.periodType })}</div>
        <div>{m.msg_box_analytics_start_date_label({ startDate: message.startDate })}</div>
        <div>{m.msg_box_analytics_end_date_label({ endDate: message.endDate })}</div>
        <div>{m.msg_box_analytics_frequencies_count_label({ frequenciesCount: message.frequenciesCount })}</div>
        <div>{m.msg_box_analytics_time_label({ time: formattedTime })}</div>
      </div>
    )
  }
  
  if (message.kind === 'danmaku') {
    const formattedTime = dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss');
    return (
      <div>
        <div>
          <strong>{m.msg_box_danmaku_user_label({ userName: message.userName })}</strong>
        </div>
        <div>{m.msg_box_danmaku_content_label({ content: message.content })}</div>
        <div>{m.msg_box_danmaku_time_label({ time: formattedTime })}</div>
      </div>
    )
  }

  const formattedTime = dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss');
  return (
    <div>
      <div>
        <strong>{message.title}</strong>
      </div>
      <div>{message.message}</div>
      <div>{m.msg_box_default_time_label({ time: formattedTime })}</div>
    </div>
  )
}

const MessageBox: React.FC = () => {
  const { messages, unreadCount, markAsRead, clearAll } = useMessage()

  const menuItems: MenuProps['items'] =
    messages.length > 0
      ? messages.map((message, index) => ({
          key: `message-${index}`,
          label: renderMessageLabel(message),
          onClick: () => markAsRead(message.id),
        }))
      : [
          {
            key: 'empty',
            label: m.msg_box_no_notifications(),
            disabled: true,
          },
        ]

  const actionMenuItems: MenuProps['items'] = [
    {
      key: 'clear-all',
      label: m.msg_box_clear_all(),
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
