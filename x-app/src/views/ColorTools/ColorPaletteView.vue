<template>
  <div class="color-palette-container">
    <h2>颜色板工具</h2>

    <div class="main-layout">
      <div class="palette-editor">
        <h3>自定义颜色板</h3>

        <div class="color-input-section">
          <label>输入颜色值:</label>
          <div class="color-input-grid">
            <div v-for="(color, index) in currentPalette" :key="index" class="color-input-item">
              <label>颜色 {{ index + 1 }}:</label>
              <n-input
                :value="color"
                @update:value="(val) => updateColorValue(index, val)"
                placeholder="例如: #FF6B6B"
              />
            </div>
          </div>
          <div class="color-actions">
            <n-button @click="copyColors" type="info">复制颜色值</n-button>
          </div>
        </div>

        <div class="controls-and-display-container">
          <div class="color-controls">
            <div v-for="(_, index) in currentPalette" :key="index" class="color-control">
              <label>颜色 {{ index + 1 }}:</label>
              <n-color-picker v-model:value="currentPalette[index]" :render-label="() => ''" />
            </div>
          </div>

          <div class="palette-display">
            <div
              v-for="(color, index) in currentPalette"
              :key="index"
              class="color-block"
              :style="{ backgroundColor: color }"
            >
              <span class="color-value">{{ color }}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <n-button @click="saveToHistory" type="primary">保存到历史</n-button>
          <n-button @click="clearHistory" type="error">清除历史</n-button>
        </div>
      </div>

      <div class="history-section">
        <h3>历史记录</h3>
        <div class="history-list">
          <div v-for="(palette, index) in history" :key="index" class="history-item-wrapper">
            <div class="history-delete-btn" @click="deleteHistoryItem(index)">×</div>
            <div class="history-item">
              <div
                v-for="(color, i) in palette"
                :key="i"
                class="history-color-block"
                :style="{ backgroundColor: color }"
                @click="loadPalette(palette)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NColorPicker, NButton, NInput, useMessage } from 'naive-ui'

const currentPalette = ref<string[]>(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
const history = ref<string[][]>([])
const message = useMessage()

const isValidColor = (color: string) => {
  const pattern = /^#([0-9A-Fa-f]{3}){1,2}$/
  return pattern.test(color)
}

const updateColorValue = (index: number, value: string) => {
  if (isValidColor(value)) {
    const newPalette = [...currentPalette.value]
    newPalette[index] = value
    currentPalette.value = newPalette
  }
}

const copyColors = async () => {
  const colorString = currentPalette.value.join(';')
  try {
    await navigator.clipboard.writeText(colorString)
    message.info('颜色值已复制到剪贴板: ' + colorString)
  } catch (err) {
    console.error('复制失败', err)
  }
}

const loadHistoryFromStorage = () => {
  const stored = localStorage.getItem('colorPaletteHistory')
  if (stored) {
    try {
      history.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse color palette history', e)
      history.value = []
    }
  }
}

const saveToHistory = () => {
  const exists = history.value.some(
    (palette) => JSON.stringify(palette) === JSON.stringify(currentPalette.value),
  )

  if (!exists) {
    history.value.unshift([...currentPalette.value])

    if (history.value.length > 10) {
      history.value.pop()
    }

    localStorage.setItem('colorPaletteHistory', JSON.stringify(history.value))
  }
}

const clearHistory = () => {
  history.value = []
  localStorage.removeItem('colorPaletteHistory')
}

const loadPalette = (palette: string[]) => {
  currentPalette.value = [...palette]
}

const deleteHistoryItem = (index: number) => {
  history.value.splice(index, 1)
  localStorage.setItem('colorPaletteHistory', JSON.stringify(history.value))
}

onMounted(() => {
  loadHistoryFromStorage()
})
</script>

<style scoped>
.color-palette-container {
  padding: 20px;
  margin: 0 auto;
}

.main-layout {
  display: flex;
  gap: 30px;
}

.palette-editor {
  flex: 1;
}

.history-section {
  width: 15rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item-wrapper {
  position: relative;
  display: inline-block;
}

.history-item {
  display: flex;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.history-item:hover {
  transform: scale(1.05);
}

.history-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff4757;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  z-index: 1;
  border: 1px solid #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item-wrapper:hover .history-delete-btn {
  opacity: 1;
}

.history-color-block {
  width: calc(100% / 5);
  height: 40px;
}

.color-input-section {
  margin-bottom: 20px;
}

.color-input-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.color-input-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.color-input-item {
  display: flex;
  flex-direction: column;
}

.color-input-item label {
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.color-actions {
  display: flex;
  gap: 10px;
}

.palette-editor h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.controls-and-display-container {
  display: flex;
  flex-direction: column;
  height: 20rem;
}

.color-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
}

.color-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  width: 100%;
}

.color-control label {
  margin-bottom: 8px;
  font-size: 14px;
}

.palette-display {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  margin-bottom: 1rem;
}

.color-block {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.color-block:hover {
  flex: 1 1 30%;
}

.color-value {
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  backdrop-filter: blur(4px);
}

.actions {
  display: flex;
  gap: 15px;
}

.n-color-picker {
  margin-bottom: 10px;
}
</style>
