import React, { useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Pagination,
  Row,
  Col,
  Collapse,
  type CollapseProps,
  Typography,
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { Room, RoomSearchParams } from '@/src/interface/room/type'
import { useRoomMgt } from '@/src/hooks/useRoomMgt'
import { buildSorter } from '@/src/util'

const { Title } = Typography

const RoomsMgt: React.FC = () => {
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const { state, actions } = useRoomMgt({ messageApi })

  const handleTableChange: TableProps<Room>['onChange'] = (_pagination, _filters, sorter) => {
    const sortString = buildSorter(sorter)
    actions.setSorter(sortString)
  }

  const handleSearch = useCallback(async () => {
    try {
      const values = await searchForm.validateFields()

      const searchParams: RoomSearchParams = {
        page: 1,
        pageSize: 10,
        roomName: values.roomName || undefined,
        roomId: values.roomId || undefined,
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

  const handleDelete = useCallback(
    async (id: number) => {
      const success = await actions.handleDelete(id)
      return success
    },
    [actions],
  )

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (state.editingRoom) {
        const success = await actions.handleUpdate(state.editingRoom.id, values)
        if (success) {
          actions.setIsModalVisible(false)
          form.resetFields()
          actions.setEditingRoom(null)
        }
      } else {
        const success = await actions.handleCreate(values)
        if (success) {
          actions.setIsModalVisible(false)
          form.resetFields()
          actions.setEditingRoom(null)
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
    actions.setEditingRoom(null)
  }

  const handleAdd = () => {
    actions.setEditingRoom(null)
    actions.setIsModalVisible(true)
  }

  const columns: ColumnsType<Room> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 1 },
      },
      {
        title: '房间号',
        dataIndex: 'roomId',
        key: 'roomId',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 2 },
      },
      {
        title: '房间名称',
        dataIndex: 'roomName',
        key: 'roomName',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 3 },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        sorter: { multiple: 4 },
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => {
                actions.setEditingRoom(record)
                actions.setIsModalVisible(true)
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个房间吗？"
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
    [actions, handleDelete],
  )

  const collapsedItems: CollapseProps['items'] = useMemo(
    () => [
      {
        key: '1',
        label: '搜索和筛选',
        children: (
          <Form form={searchForm} onFinish={handleSearch}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6} lg={6} xl={8}>
                <Form.Item name="roomName" label="房间名称">
                  <Input placeholder="支持模糊搜索" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={8}>
                <Form.Item name="roomId" label="房间ID">
                  <Input placeholder="输入房间ID" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={4} style={{ textAlign: 'right' }}>
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
    [handleSearch, handleResetSearch, searchForm],
  )

  return (
    <div className="room-mgt">
      {contextHolder}
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>房间管理</Title>
        <Button type="primary" onClick={handleAdd}>
          添加房间
        </Button>
      </div>

      <Collapse items={collapsedItems} style={{ marginBottom: 12 }} />

      <Table
        columns={columns}
        dataSource={state.roomList}
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
        title={state.editingRoom ? '编辑房间' : '创建房间'}
        open={state.isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="roomName"
            label="房间名称"
            rules={[{ required: true, message: '请输入房间名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="roomId"
            label="房间号"
            rules={[{ required: true, message: '请输入房间号' }]}
          >
            <Input placeholder="输入房间号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoomsMgt
