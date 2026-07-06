import { Directive, effect, ElementRef, input, Renderer2 } from "@angular/core";

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'primary' | 'white';

@Directive({
    selector: '[twLoading]'
})
export class TwLoadingDirective {
    readonly twLoading = input<boolean>(false);

    readonly spinnerSize = input<SpinnerSize>('md');

    readonly spinnerColor = input<SpinnerColor>('primary');

    private overlayElement?: HTMLDivElement | null;

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly renderer: Renderer2
    ) {
        effect(() => {
            if (this.twLoading()) {
                this.showOverlay();
            } else {
                this.hideOverlay();
            }
        });
    }

    private showOverlay(): void {
        if (this.overlayElement) {
            return;
        }

        this.renderer.addClass(
            this.elementRef.nativeElement,
            'tw-loading-host'
        );

        this.overlayElement = this.renderer.createElement('div');

        const spinner = this.renderer.createElement('span');

        this.renderer.addClass(
            this.overlayElement,
            'tw-loading-overlay'
        );

        this.renderer.addClass(
            spinner,
            'tw-spinner'
        );

        this.renderer.addClass(
            spinner,
            `tw-spinner--${this.spinnerSize()}`
        );

        this.renderer.addClass(
            spinner,
            `tw-spinner--${this.spinnerColor()}`
        );

        this.renderer.appendChild(
            this.overlayElement,
            spinner
        );

        this.renderer.appendChild(
            this.elementRef.nativeElement,
            this.overlayElement
        );
    }

    private hideOverlay() {
        if (!this.overlayElement) {
            return;
        }

        this.renderer.removeChild(
            this.elementRef.nativeElement,
            this.overlayElement
        );

        this.renderer.removeClass(
            this.elementRef.nativeElement,
            'tw-loading-host'
        );

        this.overlayElement = null;
    }
}