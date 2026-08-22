import React, { useCallback, useMemo, useState } from 'react'
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
  type TableProps,
  type TablePaginationConfig,
  type CollapseProps,
  Row,
  Col,
  DatePicker,
  Collapse,
} from 'antd'
import { PlayCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons'
import './styles.css'
import { buildSorter } from '@/src/util'
import { useCaptureMgt } from '../../hooks/useCaptureMgt'
import type { CaptureJob, CaptureSearchParams } from '@/src/interface/capture/type'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import InfiniteScrollSelect from '@/src/components/infinite-scroll-select'
import type { RoomOption } from '@/src/interface/room/type'

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  Running: { color: 'blue', text: '运行中' },
  Completed: { color: 'green', text: '已完成' },
  Cancelled: { color: 'orange', text: '已取消' },
  Failed: { color: 'orange', text: '已失败' },
  Terminated: { color: 'red', text: '已终止' },
}

const JOB_STATUS = [
  {
    value: 'Running',
    label: '运行中',
  },
  {
    value: 'Completed',
    label: '已完成',
  },
  {
    value: 'Cancelled',
    label: '已取消',
  },
  {
    value: 'Failed',
    label: '已失败',
  },
  {
    value: 'Terminated',
    label: '已终止',
  },
]

const durationOptions: SelectProps['options'] = []

for (let i = 1; i <= 12; i++) {
  durationOptions.push({
    value: (3600 * i).toString(),
    label: `${i}小时`,
  })
}

const CaptureView: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [roomId, setRoomId] = useState<string>('')
  const [selectedOptionLabel, setSelectedOptionLabel] = useState<string | null>(null)
  const [captureDuration, setCaptureDuration] = useState<number>(3600)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const { state, actions } = useCaptureMgt({ messageApi })

  const openStartModal = () => {
    setIsModalVisible(true)
  }

  const closeModal = () => {
    setIsModalVisible(false)
    setRoomId('')
    setSelectedOptionLabel(null)
    form.resetFields()
  }

  const renderManualInput = (menu: React.ReactNode) => (
    <>
      {menu}
      <div
        style={{
          padding: '8px',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <span>或手动输入房间ID:</span>
        <Input
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value)
            setSelectedOptionLabel(null)
          }}
          onPressEnter={(e) => {
            setRoomId((e.target as HTMLInputElement).value)
            setSelectedOptionLabel(null)
            setTimeout(
              () => document.activeElement instanceof HTMLElement && document.activeElement.blur(),
              0,
            )
          }}
          placeholder="手动输入房间ID，例如: 123456"
          style={{ marginTop: '4px' }}
        />
      </div>
    </>
  )

  const handleTableChange = (
    _pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    _sorter: SorterResult<CaptureJob> | SorterResult<CaptureJob>[],
  ) => {
    const sortString = buildSorter(_sorter)
    actions.setSorter(sortString)
  }

  const handleStartCapture = async () => {
    if (!roomId) {
      messageApi.error('请输入房间ID')
      return
    }

    try {
      await actions.startCapture(roomId, captureDuration)
      messageApi.success('开始捕获弹幕')
      closeModal()
    } catch (error) {
      console.error('Failed to start capture:', error)
      messageApi.error('启动捕获失败')
    }
  }

  const handleSearch = useCallback(async () => {
    try {
      const values = await searchForm.validateFields()
      const roomIdValue =
        typeof values.roomId === 'object' && values.roomId !== null
          ? (values.roomId as any).value
          : values.roomId

      const searchParams: CaptureSearchParams = {
        page: 1,
        pageSize: 10,
        status: values.status,
        roomId: roomIdValue,
        startTime:
          values.timeRange && values.timeRange[0] ? values.timeRange[0].toISOString() : undefined,
        endTime:
          values.timeRange && values.timeRange[1] ? values.timeRange[1].toISOString() : undefined,
      }

      actions.handleSearch(searchParams)
    } catch (error) {
      console.error('Search validation failed:', error)
    }
  }, [searchForm, actions])

  const handleResetSearch = useCallback(() => {
    searchForm.resetFields()
    actions.handleResetSearch()
  }, [searchForm, actions])

  const handleRoomIdChange = useCallback((value: string | RoomOption) => {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      const optionVal = value as RoomOption
      setRoomId(optionVal.value)
      setSelectedOptionLabel(optionVal.label !== optionVal.value ? optionVal.label : null)
    } else {
      setRoomId(String(value))
      setSelectedOptionLabel(null)
    }
  }, [])

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
        const statusInfo = STATUS_CONFIG[status] || {
          color: 'default',
          text: status,
        }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
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
      render: (text: string | null) => (text ? text : 'N/A'),
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
            <Button type="default" disabled icon={<StopOutlined />}>
              停止
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const collapsedItems: CollapseProps['items'] = useMemo(
    () => [
      {
        key: '1',
        label: '搜索和筛选',
        children: (
          <Form form={searchForm} onFinish={handleSearch}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={3} lg={3} xl={4}>
                <Form.Item name="status" label="状态">
                  <Select placeholder="请选择状态" options={JOB_STATUS}></Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={3} xl={4}>
                <Form.Item name="roomId" label="房间ID">
                  <InfiniteScrollSelect<RoomOption>
                    fetchOptions={actions.fetchRoomOptions}
                    placeholder="请输入房间ID或主播名"
                    debounceTimeout={300}
                    pageSize={10}
                    optionRender={(option) => (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {option.label}
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.Item name="timeRange" label="时间范围">
                  <DatePicker.RangePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder={['开始时间', '结束时间']}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={3} xl={4} style={{ textAlign: 'right' }}>
                <Button type="primary" htmlType="submit">
                  搜索
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={handleResetSearch}>
                  重置
                </Button>
              </Col>
            </Row>
          </Form>
        ),
      },
    ],
    [handleSearch, handleResetSearch, searchForm, actions.fetchRoomOptions],
  )

  return (
    <div className="capture-container">
      {contextHolder}
      <Typography.Title level={4}>弹幕捕获任务管理</Typography.Title>
      {state.isCaptureSuccess && (
        <Alert closable description={state.captureStartRes} style={{ marginBottom: 24 }} />
      )}

      <Space style={{ margin: '10px 0' }}>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={openStartModal}>
          启动新捕获任务
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => actions.fetchJobs()}
          loading={state.loading}
        >
          刷新
        </Button>
      </Space>

      <Collapse items={collapsedItems} style={{ marginBottom: '0.5rem' }} />

      <Table
        dataSource={state.jobList}
        columns={columns}
        rowKey="id"
        loading={state.loading}
        pagination={false}
        onChange={handleTableChange}
      />
      <div className="pagination-container">
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
        title="新建弹幕捕获任务"
        open={isModalVisible}
        onCancel={closeModal}
        onOk={handleStartCapture}
        okText="开始捕获"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="房间ID" required rules={[{ required: true, message: '请输入房间ID' }]}>
            <InfiniteScrollSelect<RoomOption>
              fetchOptions={actions.fetchRoomOptions}
              placeholder="请输入房间ID或主播名"
              debounceTimeout={300}
              pageSize={10}
              value={
                roomId
                  ? {
                    value: roomId,
                    label: selectedOptionLabel ? selectedOptionLabel : `房间ID：${roomId}`,
                  }
                  : undefined
              }
              onChange={handleRoomIdChange}
              popupRender={renderManualInput}
            />
          </Form.Item>

          <Form.Item label="捕获时长(秒)" required>
            <Select
              showSearch={{
                filterOption: (input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase()),
              }}
              placeholder="请选择或输入捕获时长(秒)，默认3600秒(1小时)"
              value={captureDuration.toString() || undefined}
              onChange={(v: string) => setCaptureDuration(Number(v))}
              options={durationOptions}
              popupRender={(option) => (
                <>
                  {option}
                  <div
                    style={{
                      padding: '8px',
                      borderTop: '1px solid #f0f0f0',
                    }}
                  >
                    <span>或手动输入时长(秒):</span>
                    <Input
                      min="1"
                      value={captureDuration}
                      onChange={(e) =>
                        setCaptureDuration(Number((e.target as HTMLInputElement).value))
                      }
                      onPressEnter={(e) => {
                        setCaptureDuration(Number((e.target as HTMLInputElement).value))
                        setTimeout(
                          () =>
                            document.activeElement instanceof HTMLElement &&
                            document.activeElement.blur(),
                          0,
                        )
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
  )
}

export default CaptureView
