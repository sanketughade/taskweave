import { computed, Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Directive({
  selector: '[twButton]',
  host: {
    '[class]': 'buttonClasses()',
  },
})
export class TwButtonDirective {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  loading = input<boolean>(false);

  readonly buttonClasses = computed(() => {
    const classes = [
      'tw-button',
      `tw-button--${this.variant()}`,
      `tw-button--${this.size()}`,
    ];

    if (this.loading()) {
      classes.push('tw-button--loading');
    }

    return classes.join(' ');
  });
}

