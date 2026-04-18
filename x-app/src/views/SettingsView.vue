<template>
  <n-card title="系统设置" segmented>
    <n-form>
      <n-form-item label="主题模式">
        <n-select placeholder="选择主题" :options="themes" />
      </n-form-item>
      <n-form-item label="语言设置">
        <n-select placeholder="选择语言" :options="languages" />
      </n-form-item>
      <n-button type="primary" block>保存设置</n-button>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NSelect, NButton } from 'naive-ui'

const themes = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
  { label: '自动', value: 'auto' },
]

// 语言选项
const languages = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]
</script>
