import React, { useState, useEffect, useCallback } from 'react';
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
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import config from '@/src/config';
import type { CaptureJob, CaptureJobList } from './type';
import type { ColumnsType, TableProps } from 'antd/es/table';
import "./CaptureView.css"
import { buildSorter } from '@/src/util';
import type { Room } from '@/src/interface/Danmaku';


const { Title } = Typography;
const { apiVersion } = config;
const captureEndpoint = `/api/${apiVersion}/danmakus/capture`;
const roomEndpoint = `/api/${apiVersion}/danmakus/rooms`;

// Status mapping configuration
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
  const [jobs, setJobs] = useState<CaptureJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [roomId, setRoomId] = useState<string>('');
  const [captureDuration, setCaptureDuration] = useState<number>(3600);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [pageSize, setPageSize] = useState(10);
  const [captureStartRes, setCaptureStartRes] = useState<string>("")
  const [isCaptureSuccess, setIsCaptureSuccess] = useState<boolean>(false);
  const [sort, setSort] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [roomOptions, setRoomOptions] = useState<{ value: string, label: string }[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch(`${roomEndpoint}?page=1&pageSize=100&sorter=id asc`);
      if (response.ok) {
        const data = await response.json();
        const options = data.data.map((room: Room) => ({
          value: room.roomId.toString(),
          label: `${room.anchorName} (房间ID: ${room.roomId})`
        }));
        setRoomOptions(options);
      } else {
        messageApi.error('获取房间列表失败');
      }
    } catch (error) {
      console.error('获取房间列表时发生错误:', error);
      messageApi.error('获取房间列表时发生错误');
    } finally {
      setLoadingRooms(false);
    }
  }, [messageApi, roomEndpoint]);

  const openStartModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setRoomId('');
  };

  const fetchJobs = useCallback(async (page: number = 1, pageSize: number = 10, sorter: string | null) => {
    setLoading(true);
    try {
      let endpoint = `${captureEndpoint}/jobs?page=${page}&pageSize=${pageSize}`;
      if (sorter) {
        endpoint = `${endpoint}&sorter=${sorter}`
      }
      const response = await fetch(endpoint);
      if (response.ok) {
        const data: CaptureJobList = await response.json();
        setJobs(data.data);
        setTotal(data.total);
        setCurrentPage(page)
      } else {
        messageApi.error('获取任务列表失败');
      }
    } catch (error) {
      console.error('An error occurred while fetching task list:', error);
      messageApi.error('获取任务列表时发生错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(currentPage, pageSize, sort);
    fetchRooms();
  }, [currentPage, pageSize, sort, fetchJobs, fetchRooms]);

  const handlePageChange = (page: number, limit?: number) => {
    setCurrentPage(page);
    if (limit && limit !== pageSize) {
      setPageSize(limit);
    }
  };

  const startCapture = async () => {
    if (!roomId) {
      messageApi.error('请输入房间ID');
      return;
    }

    try {
      const response = await fetch(`${captureEndpoint}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: Number(roomId),
          duration: captureDuration
        }),
      });

      if (response.ok) {
        const result = await response.json();
        messageApi.success(`捕获任务已启动，房间ID: ${result.data.roomId}`);
        setIsModalVisible(false);
        setRoomId('');
        setCaptureStartRes(`开始捕获直播间 -> 主播: ${result.data.anchorName}`)
        setIsCaptureSuccess(true)
        await fetchJobs(currentPage, pageSize, sort);
      } else {
        const errorData = await response.json();
        messageApi.error(errorData.detail || '启动捕获任务失败');
      }
    } catch (error) {
      console.error('启动捕获任务时发生错误:', error);
      messageApi.error('启动捕获任务时发生错误');
    }
  };

  const stopCapture = async (roomId: number) => {
    try {
      const response = await fetch(`${captureEndpoint}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomId
        }),
      });

      if (response.ok) {
        messageApi.success('停止捕获任务成功');
        await fetchJobs(currentPage, pageSize, sort);
      } else {
        const errorData = await response.json();
        messageApi.error(errorData.detail || '停止捕获任务失败');
      }
    } catch (error) {
      console.error('停止捕获任务时发生错误:', error);
      messageApi.error('停止捕获任务时发生错误');
    }
  };

  const columns: ColumnsType<CaptureJob> = [
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
              onClick={() => stopCapture(record.roomId)}
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

  const handleTableChange: TableProps<CaptureJob>["onChange"] = (_pagination, _filters, sorter, _extra) => {
    const sortString = buildSorter(sorter);
    setSort(sortString);
  };

  return (
    <div className='capture-container'>
      {contextHolder}
      <Title level={4}>
        弹幕捕获任务管理
      </Title>
      {isCaptureSuccess && <Alert closable description={captureStartRes} style={{ marginBottom: 24 }} />}

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
          onClick={() => fetchJobs(currentPage, pageSize, sort)}
          loading={loading}
        >
          刷新
        </Button>
      </Space>

      <Table
        dataSource={jobs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        onChange={handleTableChange}
      />
      <div className='pagination-container'>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
          showSizeChanger
          onShowSizeChange={(current, size) => handlePageChange(current, size)}
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
            onClick={startCapture}
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
              options={roomOptions}
              loading={loadingRooms}
              notFoundContent={loadingRooms ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />}
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