import React, { useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Pagination,
  Row,
  Tag,
  Col,
  Collapse,
  type CollapseProps,
  Typography,
  DatePicker,
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import './DanmakuMgt.css'
import type { Danmaku, RoomOption } from '@/src/interface/Danmaku'
import type { DanmakuSearchParams } from './type'
import { useDanmakuManagement } from './hooks/useDanmakuManagement'
import { buildSorter } from '@/src/util'
import { InfiniteRefreshSelect } from '@/src/components/InfiniteRefreshSelect'
import { CopyableText } from '@/src/components/CopyableText'

const { Title } = Typography

const DanmakuMgt: React.FC = () => {
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const { state, actions } = useDanmakuManagement({ messageApi })

  const handleTableChange: TableProps<Danmaku>['onChange'] = (_pagination, _filters, sorter) => {
    const sortString = buildSorter(sorter)
    actions.setSorter(sortString)
  }

  const handleSearch = useCallback(async () => {
    try {
      const values = await searchForm.validateFields()

      const searchParamsWithTime: DanmakuSearchParams = {
        page: 1,
        pageSize: 10,
        userName: values.userName || undefined,
        content: values.content || undefined,
        roomId: values.roomId?.value || undefined,
        startTime:
          values.timeRange && values.timeRange[0] ? values.timeRange[0].toISOString() : undefined,
        endTime:
          values.timeRange && values.timeRange[1] ? values.timeRange[1].toISOString() : undefined,
      }

      actions.handleSearch(searchParamsWithTime)
    } catch (error) {
      console.error('Search validation failed:', error)
    }
  }, [searchForm, actions])

  const handleResetSearch = useCallback(() => {
    searchForm.resetFields()
    actions.handleResetSearch()
  }, [searchForm, actions])

  const handleDelete = useCallback(
    async (id: string) => {
      const success = await actions.handleDelete(id)
      return success
    },
    [actions],
  )

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (state.editingDanmaku) {
        const success = await actions.handleUpdate(state.editingDanmaku.id, values)
        if (success) {
          actions.setIsModalVisible(false)
          form.resetFields()
          actions.setEditingDanmaku(null)
        }
      }
    } catch (error) {
      console.error('Validation failed:', error)
      messageApi.error('表单验证失败')
    }
  }

  const handleModalCancel = () => {
    actions.setIsModalVisible(false)
    form.resetFields()
    actions.setEditingDanmaku(null)
  }

  const columns: ColumnsType<Danmaku> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 1 },
      },
      {
        title: '用户ID',
        dataIndex: 'userId',
        key: 'userId',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        render: (text) => <CopyableText text={text} />,
      },
      {
        title: '用户名',
        dataIndex: 'userName',
        key: 'userName',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        render: (text) => <CopyableText text={text} />,
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        ellipsis: true,
        render: (text: string) => <CopyableText text={text} tooltip={text} />,
      },
      {
        title: '粉丝牌',
        dataIndex: 'fanMedalName',
        key: 'fanMedalName',
        render: (_, record) =>
          record.fanMedalName && record.fanMedalLevel ? (
            <Tag
              color={
                state.medalLevelColors[
                  Math.floor(record.fanMedalLevel / 10) as keyof typeof state.medalLevelColors
                ]
              }
              variant="solid"
            >
              {record.fanMedalName}
            </Tag>
          ) : (
            '无'
          ),
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 5 },
      },
      {
        title: '粉丝牌等级',
        dataIndex: 'fanMedalLevel',
        key: 'fanMedalLevel',
        render: (_, record) =>
          record.fanMedalLevel ? (
            <Tag
              color={
                state.medalLevelColors[
                  Math.floor(record.fanMedalLevel / 10) as keyof typeof state.medalLevelColors
                ]
              }
              variant="solid"
            >
              {record.fanMedalLevel}
            </Tag>
          ) : (
            '无'
          ),
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 4 },
      },
      {
        title: '用户等级',
        dataIndex: 'userLevel',
        key: 'userLevel',
        render: (_, record) =>
          record.userLevel ? (
            <Tag
              color={
                state.userLevelColors[
                  Math.floor(record.userLevel / 10) as keyof typeof state.userLevelColors
                ]
              }
              variant="solid"
            >
              {record.userLevel}
            </Tag>
          ) : (
            '无'
          ),
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 3 },
      },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 1 },
      },
      {
        title: '房间名称',
        dataIndex: 'roomId',
        key: 'roomId',
        render: (_, record) =>
          record.roomId && record.roomName ? `${record.roomName}(${record.roomId})` : '无',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 2 },
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => (
          <Space size="middle">
            <Popconfirm
              title="确定要删除这条弹幕吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      },
    ],
    [state, handleDelete],
  )

  const collapsedItems: CollapseProps['items'] = useMemo(
    () => [
      {
        key: '1',
        label: '搜索和筛选',
        children: (
          <Form form={searchForm} onFinish={handleSearch}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={3} lg={3} xl={4}>
                <Form.Item name="userName" label="用户名">
                  <Input placeholder="精确匹配" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={3} xl={4}>
                <Form.Item name="content" label="弹幕内容">
                  <Input placeholder="支持模糊搜索" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={3} xl={4}>
                <Form.Item name="roomId" label="房间ID">
                  <InfiniteRefreshSelect<RoomOption>
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
    <div className="danmaku-mgt">
      {contextHolder}
      <Title level={4}>弹幕管理</Title>
      <Collapse items={collapsedItems} defaultActiveKey={['1']} style={{ marginBottom: 12 }} />
      <Table
        columns={columns}
        dataSource={state.danmakuList}
        loading={state.loading}
        rowKey="id"
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
        title={state.editingDanmaku ? '编辑弹幕' : '创建弹幕'}
        open={state.isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userName"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入弹幕内容' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="fanMedalName" label="粉丝牌名称">
            <Input />
          </Form.Item>
          <Form.Item name="fanMedalLevel" label="粉丝牌等级">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="userLevel" label="用户等级">
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DanmakuMgt
