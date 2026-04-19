import { defineStore } from 'pinia'

interface MenuState {
  currentTopMenu: string
  currentSidebarMenu: string
  openedTabs: Array<{
    key: string
    title: string
    component: any
  }>
  currentTab: string
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    currentTopMenu: 'home',
    currentSidebarMenu: '',
    openedTabs: [],
    currentTab: 'home',
  }),

  actions: {
    setCurrentTopMenu(menuKey: string) {
      this.currentTopMenu = menuKey
    },
    setCurrentSidebarMenu(menuKey: string) {
      this.currentSidebarMenu = menuKey
    },
    addTab(tab: { key: string; title: string; component: any }) {
      const existingIndex = this.openedTabs.findIndex((t) => t.key === tab.key)
      if (existingIndex === -1) {
        this.openedTabs.push(tab)
      } else {
        this.openedTabs[existingIndex] = tab
      }
    },
    removeTab(key: string) {
      const index = this.openedTabs.findIndex((tab) => tab.key === key)
      if (index !== -1) {
        this.openedTabs.splice(index, 1)
        if (key === this.currentTab && this.openedTabs.length > 0 && this.openedTabs[0]) {
          this.currentTab = this.openedTabs[0].key
        } else if (this.openedTabs.length === 0) {
          this.currentTab = 'home'
        } else {
          if (!this.openedTabs.some((tab) => tab.key === this.currentTab)) {
            if (this.openedTabs.length > 0 && this.openedTabs[0]) {
              this.currentTab = this.openedTabs[0].key
            } else {
              this.currentTab = 'home'
            }
          }
        }
      }
    },
    setCurrentTab(key: string) {
      this.currentTab = key
    },
    clearTabs() {
      this.openedTabs = []
      this.currentTab = 'home'
    },
  },
})
