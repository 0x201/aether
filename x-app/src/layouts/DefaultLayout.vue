<template>
  <n-layout>
    <!-- 顶部导航栏 -->
    <HeaderBar @theme-change="onThemeChange" @top-menu-change="handleTopMenuChange" />

    <n-layout has-sider>
      <!-- 侧边栏 -->
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        show-trigger
        class="sider"
      >
        <n-menu :options="sidebarMenuOptions" :value="activeKey" @update:value="handleMenuUpdate" />
      </n-layout-sider>

      <!-- 主内容区域 -->
      <n-layout-content class="content" embedded style="overflow-y: auto">
        <div class="content-wrapper">
          <n-tabs
            type="card"
            closable
            :value="menuStore.currentTab"
            @update:value="handleTabChange"
            @close="handleTabClose"
          >
            <n-tab-pane
              v-for="tab in menuStore.openedTabs"
              :key="tab.key"
              :tab="tab.title"
              :name="tab.key"
            >
              <Suspense>
                <component :is="tab.component" />
              </Suspense>
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { markRaw, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import {
  NLayout,
  NLayoutContent,
  NLayoutSider,
  NMenu,
  NTabs,
  NTabPane,
  type MenuOption,
} from 'naive-ui'
import {
  getSidebarMenuByTopMenu,
  getCurrentTopMenuKey,
  getRouteByName,
  type MenuItemMeta,
} from '@/utils/menuUtils'
import HeaderBar from '@/components/HeaderBar.vue'
import type { BuiltInGlobalTheme } from 'naive-ui/es/themes/interface'

interface DefaultLayoutProps {
  onThemeChange: (newTheme: 'light' | 'dark' | 'auto') => void
  currentTheme: BuiltInGlobalTheme
}

const props = defineProps<DefaultLayoutProps>()
const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const sidebarMenuOptions = ref<MenuOption[]>([])

onMounted(async () => {
  await router.isReady()

  const currentRouteName = route.name as string
  const currentFullPath = route.fullPath
  const currentPath = route.path
  const currentRoutes = router.getRoutes()

  if (currentRouteName) {
    const topMenuKey = getCurrentTopMenuKey(currentRouteName, currentRoutes)
    menuStore.setCurrentTopMenu(topMenuKey)
    updateSidebarMenu(topMenuKey)
    activeKey.value = currentRouteName
    addTabIfNotExists(currentRouteName)

    menuStore.setCurrentTab(currentRouteName)
  } else {
    const matchedRoute = currentRoutes.find((r) => {
      const pathMatch =
        currentPath === r.path ||
        currentFullPath === r.path ||
        currentPath.startsWith(r.path + '/') ||
        currentFullPath.startsWith(r.path + '/')
      return pathMatch
    })

    if (matchedRoute && matchedRoute.name) {
      const routeName = matchedRoute.name as string
      const topMenuKey = getCurrentTopMenuKey(routeName, currentRoutes)

      menuStore.setCurrentTopMenu(topMenuKey)
      updateSidebarMenu(topMenuKey)
      activeKey.value = routeName
      addTabIfNotExists(routeName)
      menuStore.setCurrentTab(routeName)
    } else {
      updateSidebarMenu('home')
      menuStore.setCurrentTab('home')
      activeKey.value = 'home'
    }
  }
})

const updateSidebarMenu = (topMenuKey: string) => {
  sidebarMenuOptions.value = getSidebarMenuByTopMenu(topMenuKey, router.getRoutes())
}

const handleTopMenuChange = (key: string) => {
  menuStore.setCurrentTopMenu(key)
  updateSidebarMenu(key)
  const submenus = getSidebarMenuByTopMenu(key, router.getRoutes())
  if (submenus.length > 0 && submenus[0]) {
    router.push({ name: submenus[0].key as string })
  } else {
    router.push({ name: key })
  }
}

const activeKey = ref('home')

const addTabIfNotExists = (routeName: string) => {
  if (!menuStore.openedTabs.some((tab) => tab.key === routeName)) {
    const routeInfo = getRouteByName(router.getRoutes(), routeName)
    if (routeInfo && routeInfo.meta) {
      const component =
        routeInfo.component || (routeInfo.components && routeInfo.components.default)
      if (component) {
        menuStore.addTab({
          key: routeName,
          title: (routeInfo.meta as MenuItemMeta).title || routeName,
          component: markRaw(component),
        })
      } else {
        console.warn(`Route or meta not found for: ${routeName}`)
      }
    }
  }
}

const handleMenuUpdate = (key: string) => {
  activeKey.value = key
  router.push({ name: key })
  addTabIfNotExists(key)
  menuStore.setCurrentTab(key)
}

const handleTabChange = (key: string) => {
  menuStore.setCurrentTab(key)
  router.push({ name: key })
}

const handleTabClose = (name: string) => {
  menuStore.removeTab(name)
}

watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName) {
      activeKey.value = newRouteName as string
    }
  },
  { immediate: true },
)
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
