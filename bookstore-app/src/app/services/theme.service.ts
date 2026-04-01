import { Injectable, Renderer2, RendererFactory2, inject, signal, WritableSignal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';

export type Theme = 'indigo-pink' | 'deeppurple-amber' | 'pink-bluegrey' | 'purple-green';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentThemeSignal: WritableSignal<Theme> = signal<Theme>('indigo-pink');
  public currentTheme$ = this.currentThemeSignal.asReadonly();
  private renderer: Renderer2;
  private document: Document = inject(DOCUMENT);

  private overlayContainer: OverlayContainer = inject(OverlayContainer);
  private rendererFactory: RendererFactory2 = inject(RendererFactory2);

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.loadThemeFromStorage();
  }

  private loadThemeFromStorage(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (savedTheme) {
      this.currentThemeSignal.set(savedTheme);
      this.applyTheme(savedTheme);
    }
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme);
    this.currentThemeSignal.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    const existingLink = this.document.getElementById('theme-css');
    if (existingLink) {
      this.renderer.removeChild(this.document.head, existingLink);
    }

    if (theme !== 'indigo-pink') {
      const linkEl = this.renderer.createElement('link');
      this.renderer.setAttribute(linkEl, 'id', 'theme-css');
      this.renderer.setAttribute(linkEl, 'rel', 'stylesheet');
      this.renderer.setAttribute(linkEl, 'href', `assets/themes/${theme}.css`);
      this.renderer.appendChild(this.document.head, linkEl);
    }

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
    
    overlayContainerElement.classList.add(`${theme}-theme`);
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSignal();
  }
}