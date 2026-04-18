<template>
  <n-card title="工具中心" segmented>
    <n-grid cols="1 s:2 m:3 l:4 xl:5 2xl:6" responsive="screen" :x-gap="12" :y-gap="8">
      <n-grid-item v-for="tool in tools" :key="tool.title">
        <n-card :title="tool.title" size="small" embedded>
          <template #footer>
            <n-button text type="primary">开始使用</n-button>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>

<script setup lang="ts">
import { NButton, NCard, NGrid, NGridItem } from 'naive-ui'

// 工具列表
const tools = [
  { title: 'JSON格式化', description: '格式化 JSON 数据' },
  { title: 'Base64编码/解码', description: '进行 Base64 编码或解码' },
  { title: '时间戳转换', description: '转换时间戳与日期' },
  { title: '随机密码生成', description: '生成安全的随机密码' },
  { title: '二维码生成', description: '生成二维码图片' },
  { title: '图片压缩', description: '压缩图片大小' },
]
</script>
