import type { RouteRecordRaw, RouteMeta } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { h } from 'vue'
import { NIcon } from 'naive-ui'
import {
  AppsOutline,
  CalculatorOutline,
  DocumentTextOutline,
  ColorPaletteOutline,
  SettingsOutline,
} from '@vicons/ionicons5'

export interface MenuItemMeta extends RouteMeta {
  title: string
  icon?: string
  parentKey?: string
  order?: number
  topMenu?: boolean
}

function getIconComponent(iconName: string) {
  switch (iconName) {
    case 'home':
    case 'apps':
      return AppsOutline
    case 'calculator':
      return CalculatorOutline
    case 'document-text':
      return DocumentTextOutline
    case 'color-palette':
      return ColorPaletteOutline
    case 'settings':
      return SettingsOutline
    default:
      return undefined
  }
}

export function generateTopMenuOptions(routes: RouteRecordRaw[]): MenuOption[] {
  const topMenus = routes
    .filter((route) => route.meta && (route.meta as MenuItemMeta).topMenu)
    .sort((a, b) => (a.meta as MenuItemMeta).order! - (b.meta as MenuItemMeta).order!)

  const menuOptions: MenuOption[] = topMenus.map((route) => {
    const meta = route.meta as MenuItemMeta
    const iconComponent = meta.icon ? getIconComponent(meta.icon) : undefined
    const iconFn = iconComponent
      ? () => h(NIcon, null, { default: () => h(iconComponent as any) })
      : undefined

    return {
      label: meta.title,
      key: route.name as string,
      icon: iconFn,
    }
  })

  return menuOptions
}

export function getSidebarMenuByTopMenu(
  topMenuKey: string,
  routes: RouteRecordRaw[],
): MenuOption[] {
  const topMenuRoute = routes.find(
    (route) => route.name === topMenuKey && route.meta && (route.meta as MenuItemMeta).topMenu,
  )

  if (!topMenuRoute || !topMenuRoute.children) {
    return []
  }

  const buildMenuOptions = (routes: RouteRecordRaw[]): MenuOption[] => {
    return routes
      .filter((childRoute) => childRoute.meta && !(childRoute.meta as MenuItemMeta).topMenu)
      .sort((a, b) => (a.meta as MenuItemMeta).order! - (b.meta as MenuItemMeta).order!)
      .map((childRoute) => {
        const meta = childRoute.meta as MenuItemMeta

        const iconComponent = meta.icon ? getIconComponent(meta.icon) : undefined
        const iconFn = iconComponent
          ? () => h(NIcon, null, { default: () => h(iconComponent as any) })
          : undefined

        const menuOption: MenuOption = {
          label: meta.title,
          key: childRoute.name as string,
          icon: iconFn,
        }

        if (childRoute.children && childRoute.children.length > 0) {
          const children = buildMenuOptions(childRoute.children)
          if (children.length > 0) {
            ;(menuOption as any).children = children
          }
        }

        return menuOption
      })
  }

  return buildMenuOptions(topMenuRoute.children)
}

export function getAllRoutesFlat(routes: RouteRecordRaw[]): Record<string, RouteRecordRaw> {
  const result: Record<string, RouteRecordRaw> = {}

  const traverse = (routes: RouteRecordRaw[]) => {
    routes.forEach((route) => {
      result[route.name as string] = route

      if (route.children && route.children.length > 0) {
        traverse(route.children)
      }
    })
  }

  traverse(routes)
  return result
}

export function getRouteByName(routes: RouteRecordRaw[], name: string): RouteRecordRaw | undefined {
  let result: RouteRecordRaw | undefined

  const traverse = (routes: RouteRecordRaw[]) => {
    for (const route of routes) {
      if (route.name === name) {
        result = route
        return
      }

      if (route.children && route.children.length > 0) {
        traverse(route.children)
      }
    }
  }

  traverse(routes)
  return result
}

export function getCurrentTopMenuKey(currentRouteName: string, routes: RouteRecordRaw[]): string {
  const currentRoute = getRouteByName(routes, currentRouteName)

  if (currentRoute && currentRoute.meta) {
    const meta = currentRoute.meta as MenuItemMeta

    if (meta.topMenu) {
      return currentRouteName
    }

    if (meta.parentKey) {
      // 递归查找顶级菜单
      const parentRoute = getRouteByName(routes, meta.parentKey)
      if (parentRoute && parentRoute.meta && (parentRoute.meta as MenuItemMeta).topMenu) {
        return meta.parentKey
      } else {
        // 如果父路由不是顶级菜单，继续向上查找
        return getCurrentTopMenuKey(meta.parentKey, routes)
      }
    }
  }
  return 'home'
}
