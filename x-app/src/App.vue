<template>
  <n-message-provider>
    <n-config-provider :theme="currentTheme">
      <n-layout>
        <HeaderBar @theme-change="onThemeChange" />

        <n-layout has-sider>
          <n-layout-sider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="240"
            show-trigger
            class="sider"
          >
            <n-menu v-model:value="activeKey" :options="menuOptions" @update:value="handleSelect" />
          </n-layout-sider>

          <n-layout-content class="content" embedded style="overflow-y: auto">
            <div class="content-wrapper">
              <n-tabs
                type="card"
                closable
                :value="activeTab"
                @update:value="handleTabUpdate"
                @close="handleTabClose"
              >
                <n-tab-pane
                  v-for="tab in openedTabs"
                  :key="tab.key"
                  :tab="tab.title"
                  :name="tab.key"
                  :closable="tab.closable"
                >
                  <component :is="tab.component" />
                </n-tab-pane>
              </n-tabs>
            </div>
          </n-layout-content>
        </n-layout>

        <n-layout-footer bordered position="absolute">
          <div style="padding: 12px; text-align: center; color: #999">
            © 2026 X. All rights reserved.
          </div>
        </n-layout-footer>
      </n-layout>
    </n-config-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter,
  NMenu,
  NConfigProvider,
  NMessageProvider,
  darkTheme,
  lightTheme,
  NIcon,
  NTabs,
  NTabPane,
} from 'naive-ui'
import {
  AppsOutline,
  ColorPaletteOutline,
  CalculatorOutline,
  DocumentTextOutline,
  SettingsOutline,
} from '@vicons/ionicons5'
import { h, ref, computed, onMounted, onUnmounted, markRaw } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import HomeView from './views/HomeView.vue'
import CalculatorView from './views/CalculatorView.vue'
import TextProcessingView from './views/TextProcessingView.vue'
import ColorToolsView from './views/ColorToolsView.vue'
import SettingsView from './views/SettingsView.vue'

const currentThemeRef = ref<any>(null)
const systemThemeRef = ref<'light' | 'dark'>('light')

type ViewMapKey = keyof typeof viewMap;
const viewMap = {
  home: { title: '工具中心', component: markRaw(HomeView) },
  calculator: { title: '计算器', component: markRaw(CalculatorView) },
  'text-processing': { title: '文本处理', component: markRaw(TextProcessingView) },
  'color-tools': { title: '颜色工具', component: markRaw(ColorToolsView) },
  settings: { title: '系统设置', component: markRaw(SettingsView) }
}

const menuOptions = [
  {
    label: '工具中心',
    key: 'home',
    icon: renderIcon(AppsOutline),
  },
  {
    label: '计算器',
    key: 'calculator',
    icon: renderIcon(CalculatorOutline),
  },
  {
    label: '文本处理',
    key: 'text-processing',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: '颜色工具',
    key: 'color-tools',
    icon: renderIcon(ColorPaletteOutline),
  },
  {
    label: '系统设置',
    key: 'settings',
    icon: renderIcon(SettingsOutline),
  },
]

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const activeKey = ref<ViewMapKey>('home')

const openedTabs = ref([
  { key: 'home', title: '工具中心', component: markRaw(HomeView), closable: false }
])

const activeTab = ref<ViewMapKey>('home')

const route = useRoute()

const handleSelect = (key: ViewMapKey) => {
  activeKey.value = key
  const existingTab = openedTabs.value.find(tab => tab.key === key)
  
  if (!existingTab) {
    const viewInfo = viewMap[key] || { title: key, component: markRaw(HomeView) }
    
    openedTabs.value.push({
      key,
      title: viewInfo.title,
      component: viewInfo.component,
      closable: key !== 'home'
    })
  }

  activeTab.value = key
}


const handleTabUpdate = (key: ViewMapKey) => {
  activeTab.value = key
  activeKey.value = key

  if (openedTabs.value.length > 0 && !openedTabs.value.some(tab => tab.key === key)) {
    if (openedTabs.value[0] && openedTabs.value[0].key) {
      activeTab.value = openedTabs.value[0].key as ViewMapKey
      activeKey.value = openedTabs.value[0].key as ViewMapKey
    }
  }
}


const handleTabClose = (key: ViewMapKey) => {
  if (key === 'home') return
  
  const tabIndex = openedTabs.value.findIndex(tab => tab.key === key)
  if (tabIndex !== -1) {
    openedTabs.value.splice(tabIndex, 1)
    if (key === activeTab.value) {
      if (openedTabs.value.length > 0 && openedTabs.value[0]) {
        activeTab.value = openedTabs.value[0].key as ViewMapKey
        activeKey.value = openedTabs.value[0].key as ViewMapKey
      } else {
        activeTab.value = 'home'
        activeKey.value = 'home'
        openedTabs.value.push({ 
          key: 'home', 
          title: '工具中心', 
          component: markRaw(HomeView), 
          closable: false 
        })
      }
    }
  }
}

const onThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
  if (newTheme === 'auto') {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeRef.value = darkModeMediaQuery.matches ? 'dark' : 'light'
    currentThemeRef.value = systemThemeRef.value === 'dark' ? darkTheme : lightTheme
  } else if (newTheme === 'dark') {
    currentThemeRef.value = darkTheme
  } else {
    currentThemeRef.value = lightTheme
  }
}

const currentTheme = computed(() => currentThemeRef.value)

onMounted(() => {
  if (route.name && typeof route.name === 'string') {
    const routeName = route.name as ViewMapKey;
    if (Object.keys(viewMap).includes(routeName)) {
      activeKey.value = routeName;
    } else {
      activeKey.value = 'home';
    }
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    systemThemeRef.value = e.matches ? 'dark' : 'light'
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentThemeRef.value = darkTheme
    } else {
      currentThemeRef.value = lightTheme
    }
  }
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  if (mediaQuery.matches) {
    currentThemeRef.value = darkTheme
  } else {
    currentThemeRef.value = lightTheme
  }
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })
})
</script>

<style scoped>
.sider {
  height: calc(100vh - 4rem);
  width: 240px;
}

.content {
  padding: 20px;
  width: 100%;
}

.content-wrapper {
  margin: 0 auto;
  width: 100%;
}

.footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
