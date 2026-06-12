import { computed, effect, Injectable, signal } from '@angular/core';
import { Theme, ThemePreference } from './theme.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themePreference = signal<ThemePreference>('system');

  readonly preference = this.themePreference.asReadonly();

  private readonly systemTheme = signal<Theme>(this.getSystemTheme());

  readonly activeTheme = computed<Theme>(() => {
    if (this.themePreference() === 'light') {
      return 'light';
    }
    
    if (this.themePreference() === 'dark') {
      return 'dark';
    }

    return this.systemTheme();
  });

  constructor() {
    effect(() => {
      const activeTheme = this.activeTheme();

      this.applyTheme(activeTheme);
    });

    effect(() => {
      localStorage.setItem(
        'taskweave-theme',
        this.themePreference()
      );
    });
  }

  initializeTheme() {
    this.loadStoredPreference();
    this.registerSystemThemeListener();
  }

  private loadStoredPreference(): void {
    const storedTheme = localStorage.getItem('taskweave-theme');

    if (
      storedTheme === 'light' ||
      storedTheme === 'dark' ||
      storedTheme === 'system'
    ) {
      this.themePreference.set(storedTheme);
    } else {
      this.themePreference.set('system');
    }
  }

  private registerSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      this.systemTheme.set(e.matches ? 'dark' : 'light');
    });
  }
  
  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute(
      'data-theme',
      theme
    );
  }

  setTheme(preference: ThemePreference): void {
    this.themePreference.set(preference);
  }

  private getSystemTheme(): Theme {
    const isDarkMode = window
      .matchMedia('(prefers-color-scheme: dark)')
      .matches;
      
      return isDarkMode ? 'dark' : 'light';
  }

}

