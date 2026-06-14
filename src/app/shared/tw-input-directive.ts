import { computed, Directive, input } from '@angular/core';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'error' | 'success';

@Directive({
  selector: '[twInput]',
  host: {
    '[class]': 'inputClasses()'
  }
})
export class TwInputDirective {
  inputSize = input<InputSize>('md');
  inputState = input<InputState>('default');

  readonly inputClasses = computed(() => {
    const classes = [
      'tw-input',
      `tw-input--${this.inputState()}`,
      `tw-input--${this.inputSize()}`
    ];

    return classes.join(' ');
  });
}
