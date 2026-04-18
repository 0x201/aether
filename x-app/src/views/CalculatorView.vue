<template>
  <n-card title="计算器" segmented>
    <n-form>
      <n-form-item label="数值A">
        <n-input-number placeholder="请输入数值A" style="width: 100%" />
      </n-form-item>
      <n-form-item label="运算符">
        <n-select placeholder="请选择运算符" :options="operators" />
      </n-form-item>
      <n-form-item label="数值B">
        <n-input-number placeholder="请输入数值B" style="width: 100%" />
      </n-form-item>
      <n-button type="primary" block>计算</n-button>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { NButton, NCard, NForm, NFormItem, NInputNumber, NSelect } from 'naive-ui'

// 运算符选项
const operators = [
  { label: '+', value: '+' },
  { label: '-', value: '-' },
  { label: '×', value: '*' },
  { label: '÷', value: '/' },
]
</script>