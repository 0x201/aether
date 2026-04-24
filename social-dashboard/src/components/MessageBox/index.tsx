import React from "react";
import { Badge, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { BellOutlined, ClearOutlined } from "@ant-design/icons";
import { useMessage } from "@/src/contexts/useMessage";
import dayjs from "dayjs";
import type { Message } from "@/src/interface/Message";

const renderMessageLabel = (message: Message) => {
  if (message.kind === "analytics") {
    return (
      <div style={{ width: "300px" }}>
        <div>
          <strong>房间: {message.roomId}</strong>
        </div>
        <div>统计周期: {message.periodType}</div>
        <div>开始时间：{message.startDate}</div>
        <div>结束时间：{message.endDate}</div>
        <div>词频数: {message.frequenciesCount}</div>
        <div>时间: {dayjs(message.completedAt).format("YYYY-MM-DD HH:mm:ss")}</div>
      </div>
    );
  }
  if (message.kind === "danmaku") {
    return (
      <div>
        <div>
          <strong>用户: {message.userName}</strong>
        </div>
        <div>内容: {message.content}</div>
        <div>时间: {dayjs(message.timestamp).format("YYYY-MM-DD HH:mm:ss")}</div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <strong>{message.title}</strong>
      </div>
      <div>{message.message}</div>
      <div>时间: {dayjs(message.timestamp).format("YYYY-MM-DD HH:mm:ss")}</div>
    </div>
  );
};

const MessageBox: React.FC = () => {
  const { messages, unreadCount, markAsRead, clearAll } = useMessage();

  const menuItems: MenuProps["items"] =
    messages.length > 0
      ? messages.map((message, index) => ({
          key: `message-${index}`,
          label: renderMessageLabel(message),
          onClick: () => markAsRead(message.id),
        }))
      : [
          {
            key: "empty",
            label: "暂无通知",
            disabled: true,
          },
        ];

  const actionMenuItems: MenuProps["items"] = [
    {
      key: "clear-all",
      label: "清空所有",
      icon: <ClearOutlined />,
      danger: true,
      onClick: clearAll,
    },
  ];

  const dropdownMenu: MenuProps = {
    items: [...menuItems, ...actionMenuItems],
  };

  return (
    <Dropdown menu={dropdownMenu} trigger={["click"]} placement="bottomRight">
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
      </Badge>
    </Dropdown>
  );
};

export { MessageBox };

export default MessageBox;
