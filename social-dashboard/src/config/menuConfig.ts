export interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
}

export interface SubMenuItem extends MenuItem {
  path: string
}

export interface MainMenu extends MenuItem {
  children?: SubMenuItem[]
}

export const menuConfig: MainMenu[] = [
  {
    key: 'home',
    label: '首页',
    path: '/',
    icon: undefined,
  },
  {
    key: 'dashboard',
    label: '数据概览',
    path: '/dashboard',
    icon: undefined,
    children: [
      {
        key: 'dashboard',
        label: '数据概览',
        path: '/dashboard',
        icon: 'bar-chart',
      },
      {
        key: 'dashboard-analytics',
        label: '分析',
        path: '/dashboard/analytics',
        icon: 'line-chart',
      },
    ],
  },
  {
    key: 'capture',
    label: '弹幕捕获',
    path: '/capture',
    icon: undefined,
    children: [
      {
        key: 'capture',
        label: '弹幕捕获',
        path: '/capture',
        icon: 'radar-chart',
      },
      {
        key: 'capture-setting',
        label: '设置',
        path: '/capture/setting',
        icon: 'setting',
      },
    ],
  },
  {
    key: 'management',
    label: '弹幕管理',
    path: '/management',
    icon: undefined,
    children: [
      {
        key: 'danmaku-list',
        label: '弹幕列表',
        path: '/management',
        icon: 'unordered-list',
      },
      {
        key: 'room-list',
        label: '房间管理',
        path: '/management/rooms',
        icon: 'home',
      },
    ],
  },
  {
    key: 'realtime-danmaku',
    label: '实时弹幕',
    path: '/realtime-danmaku',
    icon: undefined,
    children: [
      {
        key: 'room-monitor',
        label: '房间监控',
        path: '/realtime-danmaku',
        icon: 'eye',
      },
      {
        key: 'broadcast',
        label: '广播弹幕',
        path: '/realtime-danmaku/broadcast',
        icon: 'bell',
      },
    ],
  },
]
