import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CalculatorView from '@/views/CalculatorView.vue'
import Text2SpeechView from '@/views/TextProcessing/Text2SpeechView.vue'
import Text2ImageView from '@/views/TextProcessing/Text2ImageView.vue'
import Text2AsciiArt from '@/views/TextProcessing/Text2AsciiArt.vue'
import ColorToolsView from '@/views/ColorTools/ColorToolsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ColorPaletteView from '@/views/ColorTools/ColorPaletteView.vue'
import FileHashView from '@/views/Tools/FileHashView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '首页',
        icon: null,
        topMenu: true,
        order: 1,
      },
    },
    {
      path: '/tools',
      name: 'tools',
      component: HomeView,
      meta: {
        title: '工具',
        icon: null,
        topMenu: true,
        order: 2,
      },
      children: [
        {
          path: 'calculator',
          name: 'calculator',
          component: CalculatorView,
          meta: {
            title: '计算器',
            icon: 'calculator',
            parentKey: 'tools',
            order: 1,
          },
        },
        {
          path: 'text-processing',
          name: 'text-processing',
          component: null,
          meta: {
            title: '文本处理',
            icon: 'document-text',
            parentKey: 'tools',
            order: 2,
          },
          children: [
            {
              path: 'text-to-speech',
              name: 'text-to-speech',
              component: Text2SpeechView,
              meta: {
                title: '语音合成',
                icon: 'text-to-speech',
                parentKey: 'text-processing',
                order: 1,
              },
            },
            {
              path: 'text-to-image',
              name: 'text-to-image',
              component: Text2ImageView,
              meta: {
                title: '文字转图片',
                icon: 'text-to-image',
                parentKey: 'text-processing',
                order: 2,
              },
            },
            {
              path: 'text-to-ascii-art',
              name: 'text-to-ascii-art',
              component: Text2AsciiArt,
              meta: {
                title: '文本转ASCII Art',
                icon: 'text-to-ascii',
                parentKey: 'text-processing',
                order: 3,
              },
            },
          ],
        },
        {
          path: 'color-tools',
          name: 'color-tools',
          component: null,
          meta: {
            title: '颜色工具',
            icon: 'color-palette',
            parentKey: 'tools',
            order: 3,
          },
          children: [
            {
              path: 'color-converter',
              name: 'color-converter',
              component: ColorToolsView,
              meta: {
                title: '颜色转换',
                icon: 'color-palette',
                parentKey: 'color-tools',
                order: 1,
              },
            },
            {
              path: 'color-palette',
              name: 'color-palette',
              component: ColorPaletteView,
              meta: {
                title: '色板',
                icon: 'color-palette',
                parentKey: 'color-tools',
                order: 2,
              },
            },
          ],
        },
        // 新增文件Hash工具
        {
          path: 'file-hash',
          name: 'file-hash',
          component: FileHashView,
          meta: {
            title: '文件Hash计算',
            icon: 'document-text',
            parentKey: 'tools',
            order: 4,
          },
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        title: '系统设置',
        icon: null,
        topMenu: true,
        order: 3,
      },
    },
  ],
})

export default router
