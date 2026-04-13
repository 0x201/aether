<script setup lang="ts">
import { NButton, NCard, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
</script>

<template>
  <n-card title="文本处理" segmented>
    <n-form>
      <n-form-item label="原文本">
        <n-input
          type="textarea"
          placeholder="请输入要处理的文本"
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </n-form-item>
      <n-space>
        <n-button type="primary">转大写</n-button>
        <n-button type="primary">转小写</n-button>
        <n-button type="primary">去除空格</n-button>
        <n-button type="primary">反转字符串</n-button>
      </n-space>
      <n-form-item label="处理结果">
        <n-input
          type="textarea"
          placeholder="处理后的文本将显示在这里"
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </n-form-item>
    </n-form>
  </n-card>
</template>
