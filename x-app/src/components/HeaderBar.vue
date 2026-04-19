<template>
  <n-layout-header class="header" bordered>
    <div class="logo-section">
      <div class="logo">
        <AppsOutline />
      </div>
      <n-h1>X</n-h1>
    </div>

    <TopMenuBar @top-menu-change="handleTopMenuChange" />

    <div class="user-actions">
      <n-button @click="toggleTheme" quaternary>
        <n-icon size="18">
          <component :is="themeIcon" />
        </n-icon>
      </n-button>
      <n-dropdown trigger="click" :options="dropdownOptions">
        <n-button circle quaternary>
          <n-icon>
            <EllipsisVertical />
          </n-icon>
        </n-button>
      </n-dropdown>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { NLayoutHeader, NH1, NIcon, NButton, NDropdown, useMessage } from 'naive-ui'
import {
  AppsOutline,
  EllipsisVertical,
  SunnyOutline,
  MoonOutline,
  DesktopOutline,
} from '@vicons/ionicons5'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TopMenuBar from './TopMenuBar.vue'
import { useMenuStore } from '@/stores/menu'

const theme = ref<'light' | 'dark' | 'auto'>('auto')
const systemTheme = ref<'light' | 'dark'>('light') // 用于存储系统主题
const menuStore = useMenuStore()

const emit = defineEmits<{
  themeChange: [theme: 'light' | 'dark' | 'auto']
  topMenuChange: [key: string]
}>()

const dropdownOptions = [
  { label: '个人资料', key: 'profile' },
  { label: '设置', key: 'settings' },
  { label: '退出登录', key: 'logout' },
]

const message = useMessage()

const getSystemTheme = () => {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  return darkModeMediaQuery.matches ? 'dark' : 'light'
}

const handleSystemThemeChange = (e: MediaQueryListEvent) => {
  const newSystemTheme = e.matches ? 'dark' : 'light'
  if (systemTheme.value !== newSystemTheme) {
    systemTheme.value = newSystemTheme
    if (theme.value === 'auto') {
      emit('themeChange', 'auto')
    }
  }
}

const themeIcon = computed(() => {
  if (theme.value === 'auto') {
    return DesktopOutline
  }
  return theme.value === 'dark' ? SunnyOutline : MoonOutline
})

const toggleTheme = () => {
  let newTheme: 'light' | 'dark' | 'auto'
  if (theme.value === 'light') {
    newTheme = 'dark'
  } else if (theme.value === 'dark') {
    newTheme = 'auto'
  } else {
    // auto
    newTheme = 'light'
  }

  theme.value = newTheme

  if (newTheme === 'auto') {
    systemTheme.value = getSystemTheme()
    emit('themeChange', 'auto')
    message.info(
      `主题已切换至自动模式（当前系统主题：${systemTheme.value === 'dark' ? '深色' : '浅色'}）`,
    )
  } else {
    emit('themeChange', newTheme)
    message.info(`主题已切换至${newTheme === 'dark' ? '深色' : '浅色'}模式`)
  }
}

const handleTopMenuChange = (key: string) => {
  menuStore.setCurrentTopMenu(key)
  emit('topMenuChange', key)
}

onMounted(() => {
  systemTheme.value = getSystemTheme()
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', handleSystemThemeChange)
})

onUnmounted(() => {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .removeEventListener('change', handleSystemThemeChange)
})
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 4rem;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-block;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
