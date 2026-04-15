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
              <RouterView />
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
import { RouterView, useRouter, useRoute } from 'vue-router'
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
} from 'naive-ui'
import {
  AppsOutline,
  ColorPaletteOutline,
  CalculatorOutline,
  DocumentTextOutline,
  SettingsOutline,
} from '@vicons/ionicons5'
import { h, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import HeaderBar from './components/HeaderBar.vue'

const currentThemeRef = ref<any>(null)
const systemThemeRef = ref<'light' | 'dark'>('light')

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

const activeKey = ref('home')
const route = useRoute()
const router = useRouter()

watch(
  () => route.name,
  (routeName) => {
    if (routeName && typeof routeName === 'string') {
      activeKey.value = routeName
    }
  },
  { immediate: true },
)

const handleSelect = (key: string) => {
  activeKey.value = key
  router.push({ name: key })
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
    activeKey.value = route.name
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
