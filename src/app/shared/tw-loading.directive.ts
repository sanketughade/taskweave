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
    private spinnerElement?: HTMLSpanElement | null;

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly renderer: Renderer2
    ) {
        effect(() => {
            if (this.twLoading()) {
                this.showLoading();
            } else {
                this.hideLoading();
            }
        });
    }

    private showLoading(): void {
        if (this.isButton()) {
            this.showButtonLoading();
        } else {
            this.showContainerLoading();
        }
    }

    private hideLoading(): void {
        if (this.isButton()) {
            this.hideButtonLoading();
        } else {
            this.hideContainerLoading();
        }
    }

    private isButton(): boolean {
        return this.elementRef.nativeElement.tagName.toLocaleLowerCase() === 'button';
    }

    private showButtonLoading(): void {
        if (this.spinnerElement) {
            return;
        }

        const button = this.elementRef.nativeElement as HTMLButtonElement;

        this.renderer.setAttribute(button, 'disabled', '');

        this.spinnerElement = this.renderer.createElement('span');

        this.renderer.addClass(this.spinnerElement, 'tw-spinner');
        this.renderer.addClass(this.spinnerElement, `tw-spinner--${this.spinnerSize()}`);
        this.renderer.addClass(this.spinnerElement, `tw-spinner--${this.spinnerColor()}`);

        this.renderer.setStyle(this.spinnerElement, 'margin-right', '0.5rem');

        this.renderer.insertBefore(
            button,
            this.spinnerElement,
            button.firstChild
        );
    }

    private hideButtonLoading(): void {
        if (!this.spinnerElement) {
            return;
        }

        const button = this.elementRef.nativeElement;

        this.renderer.removeChild(button, this.spinnerElement);
        this.renderer.removeAttribute(button, 'disabled');

        this.spinnerElement = null;
    }

    private showContainerLoading(): void {
        if (this.overlayElement) {
            return;
        }

        const host = this.elementRef.nativeElement;

        this.renderer.addClass(
            host,
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

    private hideContainerLoading() {
        if (!this.overlayElement) {
            return;
        }

        const host = this.elementRef.nativeElement;

        this.renderer.removeChild(
            host,
            this.overlayElement
        );

        this.renderer.removeClass(
            host,
            'tw-loading-host'
        );

        this.overlayElement = null;
    }
}