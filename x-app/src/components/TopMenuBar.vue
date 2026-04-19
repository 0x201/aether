<template>
  <div class="top-menu-bar">
    <n-menu
      v-model:value="menuStore.currentTopMenu"
      mode="horizontal"
      :options="menuOptions"
      @update:value="handleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { NMenu } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { generateTopMenuOptions, getCurrentTopMenuKey } from '@/utils/menuUtils'
import { useMenuStore } from '@/stores/menu'

// 定义 emits
const emit = defineEmits(['top-menu-change'])

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

// 菜单选项
const menuOptions = ref(generateTopMenuOptions(router.getRoutes()))

// 处理菜单选择
const handleSelect = (key: string) => {
  menuStore.setCurrentTopMenu(key)
  emit('top-menu-change', key)
}

// 监听路由变化，更新顶部菜单
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName) {
      // 根据当前路由更新顶部菜单激活项
      const topMenuKey = getCurrentTopMenuKey(newRouteName as string, router.getRoutes())
      menuStore.setCurrentTopMenu(topMenuKey)
    }
  },
  { immediate: true },
)

onMounted(() => {
  // 初始化时设置当前激活的菜单项
  if (route.name) {
    const topMenuKey = getCurrentTopMenuKey(route.name as string, router.getRoutes())
    menuStore.setCurrentTopMenu(topMenuKey)
  } else {
    // 默认激活首页
    menuStore.setCurrentTopMenu('home')
  }
})
</script>

<style scoped>
.top-menu-bar {
  flex: 1;
  min-width: 0;
  margin: 0 20px;
}
</style>
