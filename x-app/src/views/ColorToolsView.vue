<template>
  <n-card title="颜色工具" segmented>
    <n-form>
      <!-- 颜色选择器 -->
      <n-form-item label="选择颜色" label-placement="left">
        <n-input-group>
          <n-color-picker
            v-model:value="hexColor"
            :show-alpha="true"
            @update:value="handleHexChange"
          />
          <n-button @click="copyValue(ColorType.HEX)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- HEX颜色值 -->
      <n-form-item label="HEX颜色值" label-placement="left">
        <n-input-group>
          <n-input
            v-model:value="hexColor"
            placeholder="#FFFFFFFF"
            @update:value="handleHexChange"
          />
          <n-button @click="copyValue(ColorType.HEX)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- RGB颜色值 -->
      <n-form-item label="RGB颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="rgbColor.r"
            :min="0"
            :max="255"
            placeholder="R"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbChange('r', val)"
          />
          <n-input-number
            v-model:value="rgbColor.g"
            :min="0"
            :max="255"
            placeholder="G"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbChange('g', val)"
          />
          <n-input-number
            v-model:value="rgbColor.b"
            :min="0"
            :max="255"
            placeholder="B"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbChange('b', val)"
          />
          <n-button @click="copyValue(ColorType.RGB)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- RGBA颜色值 -->
      <n-form-item label="RGBA颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="rgbaColor.r"
            :min="0"
            :max="255"
            placeholder="R"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbaChange('r', val)"
          />
          <n-input-number
            v-model:value="rgbaColor.g"
            :min="0"
            :max="255"
            placeholder="G"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbaChange('g', val)"
          />
          <n-input-number
            v-model:value="rgbaColor.b"
            :min="0"
            :max="255"
            placeholder="B"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbaChange('b', val)"
          />
          <n-input-number
            v-model:value="rgbaColor.a"
            :min="0"
            :max="1"
            :step="0.01"
            placeholder="A"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleRgbaChange('a', val)"
          />
          <n-button @click="copyValue(ColorType.RGBA)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- HSL颜色值 -->
      <n-form-item label="HSL颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="hslColor.h"
            :min="0"
            :max="360"
            placeholder="H"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslChange('h', val)"
          />
          <n-input-number
            v-model:value="hslColor.s"
            :min="0"
            :max="100"
            placeholder="S"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslChange('s', val)"
          />
          <n-input-number
            v-model:value="hslColor.l"
            :min="0"
            :max="100"
            placeholder="L"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslChange('l', val)"
          />
          <n-button @click="copyValue(ColorType.HSL)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- HSLA颜色值 -->
      <n-form-item label="HSLA颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="hslaColor.h"
            :min="0"
            :max="360"
            placeholder="H"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslaChange('h', val)"
          />
          <n-input-number
            v-model:value="hslaColor.s"
            :min="0"
            :max="100"
            placeholder="S"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslaChange('s', val)"
          />
          <n-input-number
            v-model:value="hslaColor.l"
            :min="0"
            :max="100"
            placeholder="L"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslaChange('l', val)"
          />
          <n-input-number
            v-model:value="hslaColor.a"
            :min="0"
            :max="1"
            :step="0.01"
            placeholder="A"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHslaChange('a', val)"
          />
          <n-button @click="copyValue(ColorType.HSLA)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- HSV颜色值 -->
      <n-form-item label="HSV颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="hsvColor.h"
            :min="0"
            :max="360"
            placeholder="H"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvChange('h', val)"
          />
          <n-input-number
            v-model:value="hsvColor.s"
            :min="0"
            :max="100"
            placeholder="S"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvChange('s', val)"
          />
          <n-input-number
            v-model:value="hsvColor.v"
            :min="0"
            :max="100"
            placeholder="V"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvChange('v', val)"
          />
          <n-button @click="copyValue(ColorType.HSV)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- HSVA颜色值 -->
      <n-form-item label="HSVA颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="hsvaColor.h"
            :min="0"
            :max="360"
            placeholder="H"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvaChange('h', val)"
          />
          <n-input-number
            v-model:value="hsvaColor.s"
            :min="0"
            :max="100"
            placeholder="S"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvaChange('s', val)"
          />
          <n-input-number
            v-model:value="hsvaColor.v"
            :min="0"
            :max="100"
            placeholder="V"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvaChange('v', val)"
          />
          <n-input-number
            v-model:value="hsvaColor.a"
            :min="0"
            :max="1"
            :step="0.01"
            placeholder="A"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleHsvaChange('a', val)"
          />
          <n-button @click="copyValue(ColorType.HSVA)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- CMYK颜色值 -->
      <n-form-item label="CMYK颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="cmykColor.c"
            :min="0"
            :max="100"
            placeholder="C"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykChange('c', val)"
          />
          <n-input-number
            v-model:value="cmykColor.m"
            :min="0"
            :max="100"
            placeholder="M"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykChange('m', val)"
          />
          <n-input-number
            v-model:value="cmykColor.y"
            :min="0"
            :max="100"
            placeholder="Y"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykChange('y', val)"
          />
          <n-input-number
            v-model:value="cmykColor.k"
            :min="0"
            :max="100"
            placeholder="K"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykChange('k', val)"
          />
          <n-button @click="copyValue(ColorType.CMYK)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- CMYKA颜色值 -->
      <n-form-item label="CMYKA颜色值" label-placement="left">
        <n-input-group>
          <n-input-number
            v-model:value="cmykaColor.c"
            :min="0"
            :max="100"
            placeholder="C"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykaChange('c', val)"
          />
          <n-input-number
            v-model:value="cmykaColor.m"
            :min="0"
            :max="100"
            placeholder="M"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykaChange('m', val)"
          />
          <n-input-number
            v-model:value="cmykaColor.y"
            :min="0"
            :max="100"
            placeholder="Y"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykaChange('y', val)"
          />
          <n-input-number
            v-model:value="cmykaColor.k"
            :min="0"
            :max="100"
            placeholder="K"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykaChange('k', val)"
          />
          <n-input-number
            v-model:value="cmykaColor.a"
            :min="0"
            :max="1"
            :step="0.01"
            placeholder="A"
            style="max-width: 100px"
            :show-button="false"
            @update:value="(val) => handleCmykaChange('a', val)"
          />
          <n-button @click="copyValue(ColorType.CMYKA)" type="primary">复制</n-button>
        </n-input-group>
      </n-form-item>

      <!-- 颜色预览 -->
      <n-form-item label="颜色预览" label-placement="left">
        <div
          :style="{
            width: '100%',
            height: '60px',
            backgroundColor: previewColor,
            borderRadius: '4px',
            border: '1px solid #ccc',
          }"
        ></div>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInputGroup,
  NInput,
  NInputNumber,
  NButton,
  NColorPicker,
  useMessage,
} from 'naive-ui'

const message = useMessage()

enum ColorType {
  HEX = 'hex',
  RGB = 'rgb',
  RGBA = 'rgba',
  HSL = 'hsl',
  HSLA = 'hsla',
  HSV = 'hsv',
  HSVA = 'hsva',
  CMYK = 'cmyk',
  CMYKA = 'cmyka',
}

const hexColor = ref('#409effff')
const rgbColor = ref({ r: 64, g: 158, b: 255 })
const rgbaColor = ref({ r: 64, g: 158, b: 255, a: 1 })
const hslColor = ref({ h: 210, s: 100, l: 63 })
const hslaColor = ref({ h: 210, s: 100, l: 63, a: 1 })
const hsvColor = ref({ h: 210, s: 75, v: 100 })
const hsvaColor = ref({ h: 210, s: 75, v: 100, a: 1 })
const cmykColor = ref({ c: 75, m: 39, y: 0, k: 0 })
const cmykaColor = ref({ c: 75, m: 39, y: 0, k: 0, a: 1 })

const previewColor = computed(() => {
  const hex = hexColor.value
  if (hex.length === 9 && hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const a = parseInt(hex.slice(7, 9), 16) / 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  } else {
    return hexColor.value
  }
})

const colorFormatsMap = {
  hex: {
    value: hexColor,
    update: (val: string) => {
      hexColor.value = val
    },
  },
  rgb: {
    value: rgbColor,
    update: (val: { r: number; g: number; b: number }) => {
      rgbColor.value = val
    },
  },
  rgba: {
    value: rgbaColor,
    update: (val: { r: number; g: number; b: number; a: number }) => {
      rgbaColor.value = val
    },
  },
  hsl: {
    value: hslColor,
    update: (val: { h: number; s: number; l: number }) => {
      hslColor.value = val
    },
  },
  hsla: {
    value: hslaColor,
    update: (val: { h: number; s: number; l: number; a: number }) => {
      hslaColor.value = val
    },
  },
  hsv: {
    value: hsvColor,
    update: (val: { h: number; s: number; v: number }) => {
      hsvColor.value = val
    },
  },
  hsva: {
    value: hsvaColor,
    update: (val: { h: number; s: number; v: number; a: number }) => {
      hsvaColor.value = val
    },
  },
  cmyk: {
    value: cmykColor,
    update: (val: { c: number; m: number; y: number; k: number }) => {
      cmykColor.value = val
    },
  },
  cmyka: {
    value: cmykaColor,
    update: (val: { c: number; m: number; y: number; k: number; a: number }) => {
      cmykaColor.value = val
    },
  },
}

const hexToRgb = (hex: string) => {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
    hex += 'ff'
  } else if (hex.length === 4) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  if (hex.length === 8) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const a = parseInt(hex.substring(6, 8), 16) / 255

    rgbaColor.value.a = a
    hslaColor.value.a = a
    hsvaColor.value.a = a
    cmykaColor.value.a = a

    return { r, g, b }
  }

  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    rgbaColor.value.a = 1
    hslaColor.value.a = 1
    hsvaColor.value.a = 1
    cmykaColor.value.a = 1

    return { r, g, b }
  }

  return { r: 0, g: 0, b: 0 }
}

const rgbToHex = (r: number, g: number, b: number, a?: number) => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  const hexR = toHex(r)
  const hexG = toHex(g)
  const hexB = toHex(b)

  if (a !== undefined) {
    const hexA = toHex(a * 255)
    return `#${hexR}${hexG}${hexB}${hexA}`
  }

  return `#${hexR}${hexG}${hexB}`
}

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h = Math.round(h * 60)
    if (h < 0) h += 360
    s = Math.round(s * 100)
    l = Math.round(l * 100)
  }

  return { h, s, l }
}

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100
  l /= 100

  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }

  return {
    r: f(0),
    g: f(8),
    b: f(4),
  }
}

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    v = max

  const d = max - min
  s = max === 0 ? 0 : d / max

  if (max === min) {
    h = 0 // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = Math.round((h * 60) % 360)
    if (h < 0) h += 360
  }

  s = Math.round(s * 100)
  v = Math.round(v * 100)

  return { h, s, v }
}

const hsvToRgb = (h: number, s: number, v: number) => {
  s /= 100
  v /= 100

  const i = Math.floor(h / 60) % 6
  const f = h / 60 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  const rgbValues = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ]

  const selectedRgb = i >= 0 && i < rgbValues.length ? rgbValues[i] : [0, 0, 0]
  const [r, g, b] = selectedRgb

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

const rgbToCmyk = (r: number, g: number, b: number) => {
  r /= 255
  g /= 255
  b /= 255

  const k = 1 - Math.max(r, g, b)
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 }
  }

  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

const cmykToRgb = (c: number, m: number, y: number, k: number) => {
  c /= 100
  m /= 100
  y /= 100
  k /= 100

  const r = 255 * (1 - c) * (1 - k)
  const g = 255 * (1 - m) * (1 - k)
  const b = 255 * (1 - y) * (1 - k)

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  }
}

const updateColorsFromSource = (sourceFormat: string, sourceValue: any) => {
  let hex: string,
    rgb: { r: number; g: number; b: number },
    rgba: { a: number; r: number; g: number; b: number },
    hsl: { h: number; s: number; l: number },
    hsla: { a: number; h: number; s: number; l: number },
    hsv: { h: number; s: number; v: number },
    hsva: { a: number; h: number; s: number; v: number },
    cmyk: { c: number; m: number; y: number; k: number },
    cmyka: { a: number; c: number; m: number; y: number; k: number }

  if (sourceFormat === 'hex') {
    hex = sourceValue
    rgb = hexToRgb(sourceValue)
    rgba = { ...rgb, a: rgbaColor.value?.a || 1 }
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsla = { ...hsl, a: hslaColor.value?.a || 1 }
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    hsva = { ...hsv, a: hsvaColor.value?.a || 1 }
    cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    cmyka = { ...cmyk, a: cmykaColor.value?.a || 1 }
  } else if (sourceFormat === 'rgb') {
    rgb = sourceValue
    hex = rgbToHex(sourceValue.r, sourceValue.g, sourceValue.b)
    rgba = { ...sourceValue, a: rgbaColor.value?.a || 1 }
    hsl = rgbToHsl(sourceValue.r, sourceValue.g, sourceValue.b)
    hsla = { ...hsl, a: hslaColor.value?.a || 1 }
    hsv = rgbToHsv(sourceValue.r, sourceValue.g, sourceValue.b)
    hsva = { ...hsv, a: hsvaColor.value?.a || 1 }
    cmyk = rgbToCmyk(sourceValue.r, sourceValue.g, sourceValue.b)
    cmyka = { ...cmyk, a: cmykaColor.value?.a || 1 }
  } else if (sourceFormat === 'rgba') {
    rgba = sourceValue
    rgb = { r: sourceValue.r, g: sourceValue.g, b: sourceValue.b }
    hex = rgbToHex(sourceValue.r, sourceValue.g, sourceValue.b, sourceValue.a)
    hsl = rgbToHsl(sourceValue.r, sourceValue.g, sourceValue.b)
    hsla = { ...hsl, a: sourceValue.a }
    hsv = rgbToHsv(sourceValue.r, sourceValue.g, sourceValue.b)
    hsva = { ...hsv, a: sourceValue.a }
    cmyk = rgbToCmyk(sourceValue.r, sourceValue.g, sourceValue.b)
    cmyka = { ...cmyk, a: sourceValue.a }
  } else if (sourceFormat === 'hsl') {
    hsl = sourceValue
    rgb = hslToRgb(sourceValue.h, sourceValue.s, sourceValue.l)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    rgba = { ...rgb, a: rgbaColor.value?.a || 1 }
    hsla = { ...sourceValue, a: hslaColor.value?.a || 1 }
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    hsva = { ...hsv, a: hsvaColor.value?.a || 1 }
    cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    cmyka = { ...cmyk, a: cmykaColor.value?.a || 1 }
  } else if (sourceFormat === 'hsla') {
    hsla = sourceValue
    rgb = hslToRgb(sourceValue.h, sourceValue.s, sourceValue.l)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b, sourceValue.a)
    rgba = { ...rgb, a: sourceValue.a }
    hsl = { h: sourceValue.h, s: sourceValue.s, l: sourceValue.l }
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    hsva = { ...hsv, a: sourceValue.a }
    cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    cmyka = { ...cmyk, a: sourceValue.a }
  } else if (sourceFormat === 'hsv') {
    hsv = sourceValue
    rgb = hsvToRgb(sourceValue.h, sourceValue.s, sourceValue.v)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    rgba = { ...rgb, a: rgbaColor.value?.a || 1 }
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsla = { ...hsl, a: hslaColor.value?.a || 1 }
    hsva = { ...sourceValue, a: hsvaColor.value?.a || 1 }
    cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    cmyka = { ...cmyk, a: cmykaColor.value?.a || 1 }
  } else if (sourceFormat === 'hsva') {
    hsva = sourceValue
    rgb = hsvToRgb(sourceValue.h, sourceValue.s, sourceValue.v)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b, sourceValue.a)
    rgba = { ...rgb, a: sourceValue.a }
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsla = { ...hsl, a: sourceValue.a }
    hsv = { h: sourceValue.h, s: sourceValue.s, v: sourceValue.v }
    cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    cmyka = { ...cmyk, a: sourceValue.a }
  } else if (sourceFormat === 'cmyk') {
    cmyk = sourceValue
    rgb = cmykToRgb(sourceValue.c, sourceValue.m, sourceValue.y, sourceValue.k)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    rgba = { ...rgb, a: rgbaColor.value?.a || 1 }
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsla = { ...hsl, a: hslaColor.value?.a || 1 }
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    hsva = { ...hsv, a: hsvaColor.value?.a || 1 }
    cmyka = { ...sourceValue, a: cmykaColor.value?.a || 1 }
  } else if (sourceFormat === 'cmyka') {
    cmyka = sourceValue
    rgb = cmykToRgb(sourceValue.c, sourceValue.m, sourceValue.y, sourceValue.k)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b, sourceValue.a)
    rgba = { ...rgb, a: sourceValue.a }
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsla = { ...hsl, a: sourceValue.a }
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    hsva = { ...hsv, a: sourceValue.a }
    cmyk = { c: sourceValue.c, m: sourceValue.m, y: sourceValue.y, k: sourceValue.k }
  }

  Object.keys(colorFormatsMap).forEach((format) => {
    if (format !== sourceFormat) {
      switch (format) {
        case 'hex':
          colorFormatsMap[format].update(hex)
          break
        case 'rgb':
          colorFormatsMap[format].update(rgb)
          break
        case 'rgba':
          colorFormatsMap[format].update(rgba)
          break
        case 'hsl':
          colorFormatsMap[format].update(hsl)
          break
        case 'hsla':
          colorFormatsMap[format].update(hsla)
          break
        case 'hsv':
          colorFormatsMap[format].update(hsv)
          break
        case 'hsva':
          colorFormatsMap[format].update(hsva)
          break
        case 'cmyk':
          colorFormatsMap[format].update(cmyk)
          break
        case 'cmyka':
          colorFormatsMap[format].update(cmyka)
          break
      }
    }
  })
}

const handleHexChange = (val: string) => {
  updateColorsFromSource('hex', val)
}

const handleRgbChange = (key: keyof typeof rgbColor.value, val: number | null) => {
  if (val !== null && !isNaN(val)) {
    const newValue = { ...rgbColor.value, [key]: val }
    updateColorsFromSource('rgb', newValue)
  }
}

const handleRgbaChange = (key: string, val: number | null) => {
  if (key === 'a') {
    if (val !== null && !isNaN(val) && val >= 0 && val <= 1) {
      const newValue = { ...rgbaColor.value, a: val }
      updateColorsFromSource('rgba', newValue)
    }
  } else {
    if (val !== null && !isNaN(val)) {
      const newValue = { ...rgbaColor.value, [key]: val }
      updateColorsFromSource('rgba', newValue)
    }
  }
}

const handleHslChange = (key: keyof typeof hslColor.value, val: number | null) => {
  if (val !== null && !isNaN(val)) {
    const newValue = { ...hslColor.value, [key]: val }
    updateColorsFromSource('hsl', newValue)
  }
}

const handleHslaChange = (key: string, val: number | null) => {
  if (key === 'a') {
    if (val !== null && !isNaN(val) && val >= 0 && val <= 1) {
      const newValue = { ...hslaColor.value, a: val }
      updateColorsFromSource('hsla', newValue)
    }
  } else {
    if (val !== null && !isNaN(val)) {
      const newValue = { ...hslaColor.value, [key]: val }
      updateColorsFromSource('hsla', newValue)
    }
  }
}

const handleHsvChange = (key: keyof typeof hsvColor.value, val: number | null) => {
  if (val !== null && !isNaN(val)) {
    const newValue = { ...hsvColor.value, [key]: val }
    updateColorsFromSource('hsv', newValue)
  }
}

const handleHsvaChange = (key: string, val: number | null) => {
  if (key === 'a') {
    if (val !== null && !isNaN(val) && val >= 0 && val <= 1) {
      const newValue = { ...hsvaColor.value, a: val }
      updateColorsFromSource('hsva', newValue)
    }
  } else {
    if (val !== null && !isNaN(val)) {
      const newValue = { ...hsvaColor.value, [key]: val }
      updateColorsFromSource('hsva', newValue)
    }
  }
}

const handleCmykChange = (key: keyof typeof cmykColor.value, val: number | null) => {
  if (val !== null && !isNaN(val)) {
    const newValue = { ...cmykColor.value, [key]: val }
    updateColorsFromSource('cmyk', newValue)
  }
}

const handleCmykaChange = (key: string, val: number | null) => {
  if (key === 'a') {
    if (val !== null && !isNaN(val) && val >= 0 && val <= 1) {
      const newValue = { ...cmykaColor.value, a: val }
      updateColorsFromSource('cmyka', newValue)
    }
  } else {
    if (val !== null && !isNaN(val)) {
      const newValue = { ...cmykaColor.value, [key]: val }
      updateColorsFromSource('cmyka', newValue)
    }
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.info(`已复制到剪贴板: ${text}`)
    console.log('Copied to clipboard:', text)
  } catch (err) {
    console.error('Failed to copy: ', err)
    message.error(`复制失败: ${text}`)
  }
}

const copyValue = (type: ColorType) => {
  let textToCopy = ''

  switch (type) {
    case ColorType.HEX:
      textToCopy = hexColor.value
      break
    case ColorType.RGB:
      textToCopy = `${rgbColor.value.r}, ${rgbColor.value.g}, ${rgbColor.value.b}`
      break
    case ColorType.RGBA:
      textToCopy = `${rgbaColor.value.r}, ${rgbaColor.value.g}, ${rgbaColor.value.b}, ${rgbaColor.value.a}`
      break
    case ColorType.HSL:
      textToCopy = `${hslColor.value.h}, ${hslColor.value.s}, ${hslColor.value.l}`
      break
    case ColorType.HSLA:
      textToCopy = `${hslaColor.value.h}, ${hslaColor.value.s}, ${hslaColor.value.l}, ${hslaColor.value.a}`
      break
    case ColorType.HSV:
      textToCopy = `${hsvColor.value.h}, ${hsvColor.value.s}, ${hsvColor.value.v}`
      break
    case ColorType.HSVA:
      textToCopy = `${hsvaColor.value.h}, ${hsvaColor.value.s}, ${hsvaColor.value.v}, ${hsvaColor.value.a}`
      break
    case ColorType.CMYK:
      textToCopy = `${cmykColor.value.c}, ${cmykColor.value.m}, ${cmykColor.value.y}, ${cmykColor.value.k}`
      break
    case ColorType.CMYKA:
      textToCopy = `${cmykaColor.value.c}, ${cmykaColor.value.m}, ${cmykaColor.value.y}, ${cmykaColor.value.k}, ${cmykaColor.value.a}`
      break
    default:
      console.error(`Unknown color type: ${type}`)
      return
  }

  copyToClipboard(textToCopy)
}
</script>
