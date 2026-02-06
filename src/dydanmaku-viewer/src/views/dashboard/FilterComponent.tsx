import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import type { Room } from '@/src/interface/Danmaku';

const { RangePicker } = DatePicker;

interface FilterComponentProps {
  onDateChange: (dates: (Dayjs | null)[] | null, dateStrings: string[]) => void;
  onRoomChange: (value: number | null) => void;
  fetchRooms: (page: number, pageSize: number, search?: string) => Promise<{ data: Room[], total: number }>;
  selectedRoomId: number | null;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  onDateChange,
  onRoomChange,
  fetchRooms,
  selectedRoomId
}) => {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  const loadRooms = async (search?: string) => {
    setLoadingRooms(true);
    try {
      const { data } = await fetchRooms(1, 20, search);
      // 添加"全部房间"选项作为第一个选项
      const allRoomsOption = { roomId: null as any, anchorName: '全部房间' };
      setAllRooms([allRoomsOption, ...data]);
    } catch (err) {
      console.error('加载房间列表失败:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleRoomSearch = (value: string) => {
    setSearchValue(value);
    if (value) {
      setTimeout(() => {
        if (value === searchValue) {
          loadRooms(value);
        }
      }, 300);
    } else {
      loadRooms();
    }
  };

  return (
    <Row gutter={16} style={{ marginBottom: '20px' }}>
      <Col xs={24} sm={24} md={12} lg={8} xl={6}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>选择时间：</span>
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={['开始时间', '结束时间']}
            onChange={onDateChange}
            style={{ width: '100%' }}
          />
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={8} xl={6}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>选择房间：</span>
          <Select
            className="room-select-container"
            placeholder="选择房间"
            value={selectedRoomId || null}
            onChange={onRoomChange}
            showSearch={{
              onSearch: handleRoomSearch,
              filterOption: false
            }}
            loading={loadingRooms}
            style={{ width: '100%' }}
            options={allRooms.map(room => ({
              label: room.anchorName,
              value: room.roomId
            }))}
          />
        </div>
      </Col>
    </Row>
  );
};

export default FilterComponent;