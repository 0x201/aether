import React, { useState } from 'react';
import {
  Alert,
  Table,
  Button,
  Space,
  Input,
  Form,
  message,
  Tag,
  Modal,
  Typography,
  Pagination,
  Select,
  type SelectProps,
  Spin,
  Empty,
  type TableProps,
  type TablePaginationConfig,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import "./CaptureView.css"
import { buildSorter } from '@/src/util';
import { useCaptureManagement } from './hooks/useCaptureManagement';
import type { CaptureJob } from './type';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  Running: { color: 'blue', text: '运行中' },
  Completed: { color: 'green', text: '已完成' },
  Cancelled: { color: 'orange', text: '已取消' },
  Failed: { color: 'orange', text: '已失败' },
  Terminated: { color: 'red', text: '已终止' },
};

const durationOptions: SelectProps["options"] = [];

for (let i = 0; i < 12; i++) {
  durationOptions.push({ value: (3600 * (i + 1)).toString(), label: `${(i + 1)}小时` });
}

const CaptureView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('');
  const [captureDuration, setCaptureDuration] = useState<number>(3600);
  const [form] = Form.useForm();

  const { state, actions } = useCaptureManagement({ messageApi });

  const openStartModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setRoomId('');
  };

  const handleTableChange = (
    _pagination: TablePaginationConfig, 
    _filters: Record<string, FilterValue | null>, 
    _sorter: SorterResult<CaptureJob> | SorterResult<CaptureJob>[], 
    ) => {
    const sortString = buildSorter(_sorter);
    actions.setSort(sortString);
  };

  const handleStartCapture = async () => {
    if (!roomId) {
      messageApi.error('请输入房间ID');
      return;
    }

    await actions.startCapture(roomId, captureDuration);
    setIsModalVisible(false);
    setRoomId('');
  };

  const columns: TableProps<CaptureJob>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: { multiple: 1 },
    },
    {
      title: '房间ID',
      dataIndex: 'roomId',
      key: 'roomId',
      sorter: { multiple: 2 },
    },
    {
      title: '房间名称',
      dataIndex: 'roomName',
      key: 'roomName',
      sorter: { multiple: 3 },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = STATUS_CONFIG[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      sorter: { multiple: 4 },
    },
    {
      title: '持续时间(秒)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text: string | null) => text ? text : 'N/A',
      sorter: { multiple: 5 },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: { multiple: 6 },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: CaptureJob) => (
        <Space size="middle">
          {record.status === 'Running' && (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={() => actions.stopCapture(record.roomId)}
            >
              停止
            </Button>
          )}
          {record.status !== 'Running' && (
            <Button
              type="default"
              disabled
              icon={<StopOutlined />}
            >
              停止
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className='capture-container'>
      {contextHolder}
      <Typography.Title level={4}>
        弹幕捕获任务管理
      </Typography.Title>
      {state.isCaptureSuccess && <Alert closable description={state.captureStartRes} style={{ marginBottom: 24 }} />}

      <Space style={{ margin: "20px 0" }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={openStartModal}
        >
          启动新捕获任务
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => actions.fetchJobs(state.currentPage, state.pageSize, state.sort)}
          loading={state.loading}
        >
          刷新
        </Button>
      </Space>

      <Table
        dataSource={state.jobs}
        columns={columns}
        rowKey="id"
        loading={state.loading}
        pagination={false}
        onChange={handleTableChange}
      />
      <div className='pagination-container'>
        <Pagination
          current={state.currentPage}
          pageSize={state.pageSize}
          total={state.total}
          onChange={actions.handlePageChange}
          showSizeChanger
          onShowSizeChange={(current, size) => actions.handlePageChange(current, size)}
          showTotal={(total) => `共 ${total} 条记录`}
          pageSizeOptions={[5, 10, 15, 20]}
          showQuickJumper
        />
      </div>

      <Modal
        title="启动新捕获任务"
        open={isModalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="back" onClick={closeModal}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleStartCapture}
          >
            启动
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="房间ID"
            required
            rules={[{ required: true, message: '请输入房间ID' }]}
          >
            <Select
              showSearch={{
                filterOption: (input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }}
              placeholder="请选择或输入房间ID，例如: 123456"
              value={roomId || undefined}
              onChange={(value) => setRoomId(value)}
              onSelect={(value) => setRoomId(value)}
              options={state.roomOptions}
              loading={state.loadingRooms}
              notFoundContent={state.loadingRooms ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />}
              popupRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <span>或手动输入房间ID:</span>
                    <Input
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onPressEnter={(e) => {
                        setRoomId((e.target as HTMLInputElement).value);
                        setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                      }}
                      placeholder="手动输入房间ID，例如: 123456"
                      style={{ marginTop: '4px' }}
                    />
                  </div>
                </>
              )}
            />
          </Form.Item>

          <Form.Item
            label="捕获时长(秒)"
            required
          >
            <Select
              showSearch={{
                filterOption: (input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }}
              placeholder="请选择或输入捕获时长(秒)，默认3600秒(1小时)"
              value={captureDuration.toString() || undefined}
              onChange={(v: string) => setCaptureDuration(Number(v))}
              options={durationOptions}
              popupRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <span>或手动输入时长(秒):</span>
                    <Input
                      min="1"
                      value={captureDuration}
                      onChange={(e) => setCaptureDuration(Number((e.target as HTMLInputElement).value))}
                      onPressEnter={(e) => {
                        setCaptureDuration(Number((e.target as HTMLInputElement).value));
                        setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                      }}
                      placeholder="手动输入捕获时长(秒)，例如: 7200"
                      style={{ marginTop: '4px' }}
                    />
                  </div>
                </>
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaptureView;