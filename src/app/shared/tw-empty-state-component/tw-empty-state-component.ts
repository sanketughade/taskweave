import { Component, input } from '@angular/core';

@Component({
  selector: 'tw-empty-state',
  imports: [],
  templateUrl: './tw-empty-state-component.html',
  styleUrl: './tw-empty-state-component.css',
})
export class TwEmptyStateComponent {
  title = input.required<string>();
  description = input<string>('');
}
