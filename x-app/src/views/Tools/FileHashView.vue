<template>
  <div class="file-hash-calculator">
    <h2>文件Hash计算工具</h2>

    <n-card>
      <n-upload :max="1" :show-download-button="false" :default-file-list="[]" @change="handleFileChange"
        @drop="handleDrop" @dragover.prevent @dragenter.prevent>
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <archive-outline-icon />
            </n-icon>
          </div>
          <p>点击或拖拽文件到此处</p>
        </n-upload-dragger>
      </n-upload>

      <div class="file-info" v-if="selectedFile">
        <n-tag type="info" size="small" round> 文件名: {{ selectedFile.name }} </n-tag>
        <n-tag type="info" size="small" round>
          大小: {{ formatFileSize(selectedFile.size) }}
        </n-tag>
      </div>

      <div class="algorithm-selector">
        <n-form-item label="选择Hash算法">
          <n-select v-model:value="selectedAlgorithm" :options="algorithmOptions" placeholder="请选择Hash算法" />
        </n-form-item>
      </div>

      <!-- Hash Comparison Section (moved before calculate button) -->
      <div class="comparison-section">
        <h3>Hash值比较</h3>
        <n-form-item label="输入要比较的Hash值">
          <n-input
            v-model:value="compareHashValue"
            placeholder="请输入要比较的Hash值"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </n-form-item>
      </div>

      <div class="calculate-actions">
        <n-button type="primary" :disabled="!selectedFile || !selectedAlgorithm || calculating" @click="calculateHash"
          :loading="calculating">
          {{ calculating ? '计算中...' : '计算Hash' }}
        </n-button>

        <n-button v-if="result" @click="copyResult" type="success"> 复制结果 </n-button>
      </div>

      <div class="progress-container" v-if="calculating">
        <n-progress type="line" :percentage="progress" :indicator-placement="'inside'" processing />
        <div class="progress-text">
          已处理: {{ processedBytes }} / {{ totalBytes }} ({{ progress }}%)
        </div>
      </div>

      <div class="result-container" v-if="result">
        <n-form-item label="Hash结果">
          <n-input :value="result" readonly type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" />
        </n-form-item>
      </div>

      <!-- Comparison Result Section -->
      <div class="comparison-result-section" v-if="result && compareHashValue">
        <h3>比较结果</h3>
        <n-space>
          <n-button @click="compareHashValues" type="tertiary"> 比较Hash值 </n-button>
          <n-button @click="clearComparison" type="warning"> 清除比较 </n-button>
        </n-space>
        
        <div class="comparison-result" v-if="comparisonResult !== null">
          <n-tag :type="comparisonResult ? 'success' : 'error'" size="large" round>
            {{ comparisonResult ? 'Hash值匹配 ✓' : 'Hash值不匹配 ✗' }}
          </n-tag>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import {
  NCard,
  NUpload,
  NUploadDragger,
  NIcon,
  NButton,
  NFormItem,
  NSpace,
  NTag,
  NSelect,
  NInput,
  NProgress,
  useNotification,
} from 'naive-ui'
import { ArchiveOutline as ArchiveOutlineIcon } from '@vicons/ionicons5'
import { calculateFileHash } from '@/utils/hashUtils'

const notification = useNotification()

// State
const selectedFile = ref<File | null>(null)
const selectedAlgorithm = ref<string | null>(null)
const calculating = ref(false)
const result = ref<string | null>(null)
const progress = ref(0)
const processedBytes = ref(0)
const totalBytes = ref(0)
// Hash comparison state
const compareHashValue = ref<string>('')
const comparisonResult = ref<boolean | null>(null)

// Algorithm options
const algorithmOptions = [
  { label: 'MD5', value: 'MD5' },
  { label: 'SHA1', value: 'SHA1' },
  { label: 'SHA256', value: 'SHA256' },
  { label: 'SHA512', value: 'SHA512' },
  { label: 'RIPEMD160', value: 'RIPEMD160' },
]

// Handle file selection
const handleFileChange = (data: {
  file: Required<UploadFileInfo>
  fileList: Required<UploadFileInfo>[]
  event?: Event | ProgressEvent<EventTarget>
}) => {
  if (data.fileList.length > 0) {
    const lastFile = data.fileList[data.fileList.length - 1]
    if (lastFile && lastFile.file) {
      selectedFile.value = lastFile.file as File
    }
  } else {
    selectedFile.value = null
  }
  resetCalculation()
}

// Handle drag and drop
const handleDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file) {
      selectedFile.value = file
      resetCalculation()
    }
  }
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Calculate hash
const calculateHash = async () => {
  if (!selectedFile.value || !selectedAlgorithm.value) {
    notification.error({
      title: '错误',
      content: '请选择文件和Hash算法',
    })
    return
  }

  calculating.value = true
  progress.value = 0
  processedBytes.value = 0
  totalBytes.value = selectedFile.value.size

  try {
    result.value = await calculateFileHash(
      selectedFile.value,
      selectedAlgorithm.value,
      (processed, total) => {
        progress.value = Math.round((processed / total) * 100)
        processedBytes.value = processed
        totalBytes.value = total
      },
    )
    
    // Automatically compare if a comparison hash was provided
    if (compareHashValue.value.trim()) {
      setTimeout(() => compareHashValues(), 100)
    }
  } catch (error) {
    notification.error({
      title: '计算失败',
      content: error instanceof Error ? error.message : String(error),
    })
  } finally {
    calculating.value = false
  }
}

// Copy result to clipboard
const copyResult = async () => {
  if (result.value) {
    try {
      await navigator.clipboard.writeText(result.value)
      notification.success({
        title: '已复制',
        content: 'Hash值已成功复制到剪贴板',
      })
    } catch (err) {
      notification.error({
        title: '复制失败',
        content: '无法复制到剪贴板，请手动复制',
      })
    }
  }
}

// Compare calculated hash with input hash
const compareHashValues = () => {
  if (!result.value) {
    notification.error({
      title: '错误',
      content: '请先计算文件的Hash值',
    })
    return
  }

  if (!compareHashValue.value.trim()) {
    notification.error({
      title: '错误',
      content: '请输入要比较的Hash值',
    })
    return
  }

  // Normalize both hashes by removing whitespace and converting to lowercase
  const normalizedCalculatedHash = result.value.replace(/\s/g, '').toLowerCase()
  const normalizedCompareHash = compareHashValue.value.replace(/\s/g, '').toLowerCase()

  // Perform comparison
  comparisonResult.value = normalizedCalculatedHash === normalizedCompareHash

  // Show notification based on comparison result
  if (comparisonResult.value) {
    notification.success({
      title: '匹配',
      content: '计算出的Hash值与输入的Hash值匹配！',
    })
  } else {
    notification.warning({
      title: '不匹配',
      content: '计算出的Hash值与输入的Hash值不匹配。',
    })
  }
}

// Clear comparison result
const clearComparison = () => {
  compareHashValue.value = ''
  comparisonResult.value = null
}

// Reset calculation state
const resetCalculation = () => {
  result.value = null
  progress.value = 0
  processedBytes.value = 0
  totalBytes.value = 0
  // Don't reset comparison value since user might want to keep it
}

// Reset comparison state
const resetComparison = () => {
  compareHashValue.value = ''
  comparisonResult.value = null
}
</script>

<style scoped>
.file-hash-calculator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.file-info {
  margin: 16px 0;
}

.algorithm-selector {
  margin: 16px 0;
}

.calculate-actions {
  margin: 16px 0;
  display: flex;
  gap: 12px;
}

.progress-container {
  margin: 16px 0;
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.result-container {
  margin-top: 16px;
}

.comparison-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.comparison-result-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.comparison-result {
  margin-top: 12px;
}
</style>