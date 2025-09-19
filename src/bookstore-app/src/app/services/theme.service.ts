import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';

export type Theme = 'indigo-pink' | 'deeppurple-amber' | 'pink-bluegrey' | 'purple-green';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentThemeSubject = new BehaviorSubject<Theme>('indigo-pink');
  public currentTheme$ = this.currentThemeSubject.asObservable();
  private renderer: Renderer2;

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    private overlayContainer: OverlayContainer
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.loadThemeFromStorage();
  }

  private loadThemeFromStorage(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (savedTheme) {
      this.currentThemeSubject.next(savedTheme);
      this.applyTheme(savedTheme);
    }
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme);
    this.currentThemeSubject.next(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    // 移除当前主题样式
    const existingLink = this.document.getElementById('theme-css');
    if (existingLink) {
      this.renderer.removeChild(this.document.head, existingLink);
    }

    // 添加新主题样式（除了默认主题）
    if (theme !== 'indigo-pink') {
      const linkEl = this.renderer.createElement('link');
      this.renderer.setAttribute(linkEl, 'id', 'theme-css');
      this.renderer.setAttribute(linkEl, 'rel', 'stylesheet');
      this.renderer.setAttribute(linkEl, 'href', `assets/themes/${theme}.css`);
      this.renderer.appendChild(this.document.head, linkEl);
    }

    // 应用主题到覆盖层容器
    this.applyThemeToOverlay(theme);
  }

  private applyThemeToOverlay(theme: Theme): void {
    const overlayContainerElement = this.overlayContainer.getContainerElement();
    const themeClasses = Array.from(overlayContainerElement.classList).filter((item: string) => 
      item.includes('-theme')
    );
    
    if (themeClasses.length) {
      overlayContainerElement.classList.remove(...themeClasses);
    }
    
    // 为覆盖层添加主题类
    overlayContainerElement.classList.add(`${theme}-theme`);
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }
}