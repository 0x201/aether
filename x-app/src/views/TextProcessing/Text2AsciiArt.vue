<template>
  <div class="text-ascii-art-container">
    <div class="main-content">
      <n-card>
        <n-form label-placement="top">
          <n-form-item label="输入文本">
            <n-input
              v-model:value="inputText"
              type="textarea"
              placeholder="请输入要转换的文本..."
              :autosize="{ minRows: 3, maxRows: 5 }"
              :maxlength="100"
              show-count
            />
          </n-form-item>

          <n-space justify="center">
            <n-button 
              type="primary" 
              @click="convertToAsciiArt" 
              :disabled="!inputText.trim()" 
              :loading="isLoading"
            >
              {{ isLoading ? '生成中...' : '生成 ASCII Art' }}
            </n-button>
          </n-space>
        </n-form>

        <div class="result-container" v-if="asciiArtResult">
          <n-space justify="end" style="margin-bottom: 10px;">
            <n-button @click="copyResult" type="primary" size="small" ghost>
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
              复制结果
            </n-button>
          </n-space>
          <pre class="ascii-art-result">{{ asciiArtResult }}</pre>
        </div>
      </n-card>
    </div>

    <div class="history-panel">
      <n-card title="历史记录">
        <n-list v-if="historyList.length > 0" hoverable>
          <n-list-item v-for="(item, index) in historyList" :key="index">
            <n-thing :title="item.text.substring(0, 30) + (item.text.length > 30 ? '...' : '')">
              <template #description>
                <n-tag type="info" size="small" round>
                  {{ formatDate(item.timestamp) }}
                </n-tag>
              </template>
              <pre class="history-item">{{ item.result }}</pre>
              <template #action>
                <n-space>
                  <n-button text @click="copyHistoryItem(item.result)">
                    <template #icon>
                      <n-icon><CopyOutline /></n-icon>
                    </template>
                    复制
                  </n-button>
                  <n-button text @click="useHistoryItem(item.text)">
                    <template #icon>
                      <n-icon><Reload /></n-icon>
                    </template>
                    使用
                  </n-button>
                  <n-button text @click="removeHistoryItem(index)" type="error">
                    <template #icon>
                      <n-icon><Trash /></n-icon>
                    </template>
                    删除
                  </n-button>
                </n-space>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
        <n-empty v-else description="暂无历史记录" />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NInput,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NSpace,
  NList,
  NListItem,
  NThing,
  NTag,
  NEmpty,
  NIcon,
  useMessage,
} from 'naive-ui'
import { Reload, Trash, CopyOutline } from '@vicons/ionicons5'
import figlet from 'figlet'
import standard from "figlet/fonts/Standard"

figlet.parseFont("Standard", standard)

interface HistoryItem {
  text: string
  result: string
  timestamp: number
}

const inputText = ref('')
const asciiArtResult = ref('')
const historyList = ref<HistoryItem[]>([])
const isLoading = ref(false)
const message = useMessage()

const loadHistory = () => {
  const stored = localStorage.getItem('asciiArtHistory')
  if (stored) {
    try {
      historyList.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse history from localStorage', e)
      historyList.value = []
    }
  }
}

const saveHistory = () => {
  localStorage.setItem('asciiArtHistory', JSON.stringify(historyList.value))
}

const useHistoryItem = (text: string) => {
  inputText.value = text
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const removeHistoryItem = (index: number) => {
  historyList.value.splice(index, 1)
  saveHistory()
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const copyResult = async () => {
  if (!asciiArtResult.value) return
  try {
    await navigator.clipboard.writeText(asciiArtResult.value)
    message.success('结果已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy text: ', err)
    message.error('复制失败，请手动选择文本')
  }
}

const copyHistoryItem = async (result: string) => {
  try {
    await navigator.clipboard.writeText(result)
    message.success('历史记录已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy text: ', err)
    message.error('复制失败，请手动选择文本')
  }
}

const convertToAsciiArt = async () => {
  if (!inputText.value.trim()) return
  isLoading.value = true
  try {
    const text = await figlet.text(inputText.value, {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true,
    })

    if (text) {
      asciiArtResult.value = text
      const newItem: HistoryItem = {
        text: inputText.value,
        result: text,
        timestamp: Date.now(),
      }
      const existingIndex = historyList.value.findIndex((item) => item.text === inputText.value)
      if (existingIndex >= 0) {
        historyList.value[existingIndex] = newItem
      } else {
        historyList.value.unshift(newItem)
      }
      if (historyList.value.length > 10) {
        historyList.value = historyList.value.slice(0, 10)
      }

      saveHistory()
    }
  } catch (err) {
    console.error('Figlet error:', err)
    asciiArtResult.value = '转换出错，请检查输入内容'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.text-ascii-art-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 120px);
}

.main-content {
  flex: 1;
}

.history-panel {
  width: 40%;
  max-width: 500px;
}

.result-container {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.2;
}

.ascii-art-result {
  margin: 0;
  font-family: monospace;
  white-space: pre;
  overflow-x: auto;
  word-wrap: break-word;
}

.history-item {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
  line-height: 1.2;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre;
}

@media (max-width: 768px) {
  .text-ascii-art-container {
    flex-direction: column;
  }

  .history-panel {
    width: 100%;
  }
}
</style>
