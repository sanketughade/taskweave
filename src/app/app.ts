import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('taskweave');

  constructor(
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.themeService.initializeTheme();
  }
}
