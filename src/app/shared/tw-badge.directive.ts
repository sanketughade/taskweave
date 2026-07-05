import { computed, Directive, input } from "@angular/core";

export type BadgeVariant = 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'success'
    | 'info';

export type BadgeSize = 'sm' | 'md';

@Directive({
    selector: '[twBadge]',
    host: {
        '[class]': 'badgeClasses()'
    }
})
export class TwBadgeDirective {
    badgeVariant = input<BadgeVariant>('info');
    badgeSize = input<BadgeSize>('md');

    readonly badgeClasses = computed(() => {
        const classes = [
            'tw-badge',
            `tw-badge--${this.badgeVariant()}`,
            `tw-badge--${this.badgeSize()}`
        ];

        return classes.join(' ');
    });
}