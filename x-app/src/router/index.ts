import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CalculatorView from '../views/CalculatorView.vue'
import TextProcessingView from '../views/TextProcessingView.vue'
import ColorToolsView from '../views/ColorToolsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: CalculatorView,
    },
    {
      path: '/text-processing',
      name: 'text-processing',
      component: TextProcessingView,
    },
    {
      path: '/color-tools',
      name: 'color-tools',
      component: ColorToolsView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

export default router
