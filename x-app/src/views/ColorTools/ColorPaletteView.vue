<template>
  <div class="color-palette-container">
    <h2>颜色板工具</h2>
    
    <div class="main-layout">
      <!-- 颜色选择区域 -->
      <div class="palette-editor">
        <h3>自定义颜色板</h3>

        <!-- 新增颜色值输入区域 -->
        <div class="color-input-section">
          <label for="color-input">输入颜色值 (以 ; 分隔):</label>
          <n-input
            id="color-input"
            type="text"
            placeholder="例如: #FF6B6B;#4ECDC4;#45B7D1;#96CEB4;#FFEAA7"
            @blur="parseColorInput"
            v-model:value="currentColorInput"
          />
          <n-button @click="parseColorInput" size="small" style="margin-left: 10px;">生成色板</n-button>
        </div>

        <div class="controls-and-display-container">
          <div class="color-controls">
            <div v-for="(color, index) in currentPalette" :key="index" class="color-control">
              <label>颜色 {{ index + 1 }}:</label>
              <n-color-picker v-model:value="currentPalette[index]" :render-label="() => ''"
                @update:value="onColorChange" />
            </div>
          </div>

          <div class="palette-display">
            <div v-for="(color, index) in currentPalette" :key="index" class="color-block"
              :style="{ backgroundColor: color }">
              <span class="color-value">{{ color }}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <n-button @click="saveToHistory" type="primary">保存到历史</n-button>
          <n-button @click="clearHistory" type="error">清除历史</n-button>
        </div>
      </div>

      <!-- 历史记录部分 -->
      <div class="history-section">
        <h3>历史记录</h3>
        <div class="history-list">
          <div 
            v-for="(palette, index) in history" 
            :key="index" 
            class="history-item-wrapper"
          >
            <div class="history-delete-btn" @click="deleteHistoryItem(index)">
              ×
            </div>
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
import { ref, onMounted } from 'vue';
import { NColorPicker, NButton, NInput } from 'naive-ui';

const currentPalette = ref<string[]>([
  '#FF6B6BFF',
  '#4ECDC4FF',
  '#45B7D1FF',
  '#96CEB4FF',
  '#FFEAA7FF'
]);
const currentColorInput = ref('');
const history = ref<string[][]>([]);

const parseColorInput = () => {
  if (!currentColorInput.value.trim()) return;
  const colors = currentColorInput.value.split(';')
    .map(color => color.trim())
    .filter(color => isValidColor(color));

  if (colors.length > 0) {
    currentPalette.value = colors;
  }
};

const isValidColor = (color: string): boolean => {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
  return hexPattern.test(color);
};

const loadHistoryFromStorage = () => {
  const stored = localStorage.getItem('colorPaletteHistory');
  if (stored) {
    try {
      history.value = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse color palette history', e);
      history.value = [];
    }
  }
};

const saveToHistory = () => {
  const exists = history.value.some(
    palette => JSON.stringify(palette) === JSON.stringify(currentPalette.value)
  );

  if (!exists) {
    history.value.unshift([...currentPalette.value]);

    if (history.value.length > 10) {
      history.value.pop();
    }

    localStorage.setItem('colorPaletteHistory', JSON.stringify(history.value));
  }
};

const clearHistory = () => {
  history.value = [];
  localStorage.removeItem('colorPaletteHistory');
};

const loadPalette = (palette: string[]) => {
  currentPalette.value = [...palette];
  currentColorInput.value = palette.join(';');
};

const onColorChange = () => {
  currentColorInput.value = currentPalette.value.join(';');
};

const deleteHistoryItem = (index: number) => {
  history.value.splice(index, 1);
  localStorage.setItem('colorPaletteHistory', JSON.stringify(history.value));
};

onMounted(() => {
  loadHistoryFromStorage();
  currentColorInput.value = currentPalette.value.join(';');
});
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input-section label {
  min-width: 180px;
  font-weight: bold;
}

.color-input-section .n-input {
  flex: 1;
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