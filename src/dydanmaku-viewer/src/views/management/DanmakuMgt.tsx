import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  DatePicker
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import './DanmakuMgt.css';
import type { Danmaku } from '@/src/interface/Danmaku';
import type { DanmakuSearchParams } from './type';
import { useDanmakuApi } from './useDanmakuApi';
import { buildSorter } from '@/src/util';

const { Title } = Typography;

const DanmakuMgt: React.FC = () => {
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDanmaku, setEditingDanmaku] = useState<Danmaku | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [sorter, setSorter] = useState<string | null>(null);

  const medalLevelColors = useMemo(() => ({
    0: 'var(--fan-medal-0-level)',
    1: 'var(--fan-medal-1-level)',
    2: 'var(--fan-medal-2-level)',
    3: 'var(--fan-medal-3-level)',
    4: 'var(--fan-medal-4-level)',
    5: 'var(--fan-medal-5-level)',
  }), []);

  const userLevelColors = useMemo(() => ({
    0: 'var(--user-level-0)',
    1: 'var(--user-level-1)',
    2: 'var(--user-level-2)',
    3: 'var(--user-level-3)',
    4: 'var(--user-level-4)',
    5: 'var(--user-level-5)',
    6: 'var(--user-level-6)',
  }), []);

  const [searchParams, setSearchParams] = useState<DanmakuSearchParams>({
    userName: '',
    content: '',
    roomId: '',
  });

  const { fetchDanmakuList, deleteDanmaku, updateDanmaku } = useDanmakuApi(messageApi);

  const loadDanmakuList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDanmakuList(currentPage, pageSize, sorter, searchParams);
      setDanmakuList(data.data);
      setTotal(data.total);
      setCurrentPage(currentPage);
    } finally {
      setLoading(false);
    }
  }, [fetchDanmakuList, currentPage, pageSize, sorter, searchParams]);

  useEffect(() => {
    loadDanmakuList();
  }, [loadDanmakuList]);

  const handlePageChange = (page: number, limit?: number) => {
    setCurrentPage(page);
    if (limit && limit !== pageSize) {
      setPageSize(limit);
    }
  };

  const handleTableChange: TableProps<Danmaku>['onChange'] = (_pagination, _filters, sorter, _extra) => {
    const sortString = buildSorter(sorter);
    setSorter(sortString);
  };

  const handleSearch = useCallback(async () => {
    try {
      const values = await searchForm.validateFields();

      const searchParamsWithTime: DanmakuSearchParams = {
        userName: values.userName || undefined,
        content: values.content || undefined,
        roomId: values.roomId || undefined,
        startTime: values.timeRange && values.timeRange[0] ? values.timeRange[0].toISOString() : undefined,
        endTime: values.timeRange && values.timeRange[1] ? values.timeRange[1].toISOString() : undefined,
      };

      setSearchParams(searchParamsWithTime);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search validation failed:', error);
    }
  }, [searchForm, setSearchParams]);

  const handleResetSearch = useCallback(() => {
    searchForm.resetFields();
    setSearchParams({
      userName: undefined,
      content: undefined,
      roomId: undefined,
      startTime: undefined,
      endTime: undefined
    });
    setCurrentPage(1);
  }, [searchForm, setSearchParams]);

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteDanmaku(id);
    if (success) {
      loadDanmakuList();
    }
  }, [deleteDanmaku, loadDanmakuList]);

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingDanmaku) {
        const success = await updateDanmaku(editingDanmaku.id, values);
        if (success) {
          setIsModalVisible(false);
          form.resetFields();
          setEditingDanmaku(null);
          loadDanmakuList(); // 重新加载列表
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
      messageApi.error('表单验证失败');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDanmaku(null);
  };

  const columns: ColumnsType<Danmaku> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      sorter: { multiple: 1 }
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (text) => (
        <Typography.Text
          style={{ cursor: 'pointer' }}
          onCopy={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(text).then(() => {
              messageApi.success('已复制');
            }).catch(err => {
              console.error('复制失败:', err);
              messageApi.error('复制失败');
            });
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text).then(() => {
              messageApi.success('已复制');
            }).catch(err => {
              console.error('复制失败:', err);
              messageApi.error('复制失败');
            });
          }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (text) => (
        <Typography.Text
          style={{ cursor: 'pointer' }}
          onCopy={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(text).then(() => {
              messageApi.success('已复制');
            }).catch(err => {
              console.error('复制失败:', err);
              messageApi.error('复制失败');
            });
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text).then(() => {
              messageApi.success('已复制');
            }).catch(err => {
              console.error('复制失败:', err);
              messageApi.error('复制失败');
            });
          }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (text) => (
        <Typography.Text
          style={{
            cursor: 'pointer',
            maxWidth: '300px',
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onCopy={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(text).then(() => {
              messageApi.success('已复制');
            }).catch(err => {
              console.error('复制失败:', err);
              messageApi.error('复制失败');
            });
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text).then(() => {
              messageApi.success('已复制');
            }).catch(err => {
              console.error('复制失败:', err);
              messageApi.error('复制失败');
            });
          }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '粉丝牌',
      dataIndex: 'fanMedalName',
      key: 'fanMedalName',
      render: (_, record) => (
        record.fanMedalName && record.fanMedalLevel
          ? <Tag
            color={medalLevelColors[(Math.floor(record.fanMedalLevel / 10)) as keyof typeof medalLevelColors]}
            variant='solid'
          >
            {record.fanMedalName}
          </Tag>
          : '无'
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      sorter: { multiple: 5 }
    },
    {
      title: '粉丝牌等级',
      dataIndex: 'fanMedalLevel',
      key: 'fanMedalLevel',
      render: (_, record) => (
        record.fanMedalLevel
          ? <Tag
            color={medalLevelColors[(Math.floor(record.fanMedalLevel / 10)) as keyof typeof medalLevelColors]}
            variant='solid'
          >
            {record.fanMedalLevel}
          </Tag>
          : '无'
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      sorter: { multiple: 4 }
    },
    {
      title: '用户等级',
      dataIndex: 'userLevel',
      key: 'userLevel',
      render: (_, record) => (
        record.userLevel
          ? <Tag
            color={userLevelColors[(Math.floor(record.userLevel / 10)) as keyof typeof userLevelColors]}
            variant='solid'
          >
            {record.userLevel}
          </Tag>
          : '无'
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      sorter: { multiple: 3 }
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      sorter: { multiple: 1 }
    },
    {
      title: '房间名称',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (_, record) => (
        record.roomId && record.roomName
          ? `${record.roomName}(${record.roomId})`
          : '无'
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      sorter: { multiple: 2 }
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
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ], [medalLevelColors, userLevelColors, handleDelete]);

  const collapsedItems: CollapseProps['items'] = useMemo(() => [
    {
      key: '1',
      label: '搜索和筛选',
      children:
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
                <Input placeholder="精确匹配" />
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
    }
  ], [handleSearch, handleResetSearch, searchForm]);

  return (
    <div className="danmaku-mgt">
      {contextHolder}
      <Title level={4}>
        弹幕管理
      </Title>
      <Collapse items={collapsedItems} defaultActiveKey={['1']} style={{ marginBottom: 12 }} />
      <Table
        columns={columns}
        dataSource={danmakuList}
        loading={loading}
        rowKey="id"
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
        title={editingDanmaku ? "编辑弹幕" : "创建弹幕"}
        open={isModalVisible}
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
          <Form.Item
            name="fanMedalName"
            label="粉丝牌名称"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fanMedalLevel"
            label="粉丝牌等级"
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="userLevel"
            label="用户等级"
          >
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DanmakuMgt;