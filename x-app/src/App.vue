<template>
  <n-message-provider>
    <n-config-provider :theme="currentTheme">
      <DefaultLayout :on-theme-change="onThemeChange" :current-theme="currentTheme" />
    </n-config-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme, lightTheme } from 'naive-ui'
import DefaultLayout from './layouts/DefaultLayout.vue'
import type { BuiltInGlobalTheme } from 'naive-ui/es/themes/interface'

const currentThemeRef = ref<BuiltInGlobalTheme | null>(null)
const systemThemeRef = ref<'light' | 'dark'>('light')

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
