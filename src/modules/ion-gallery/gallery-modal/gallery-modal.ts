import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ViewController, NavParams, Slides, Platform } from 'ionic-angular';
import { Photo } from '../interfaces/photo-interface';
import { Subject } from 'rxjs/Subject';




import { NativeService } from '../../../providers/native-service';
@Component({
    selector: 'gallery-modal',
    templateUrl: 'gallery-modal.html'
})
export class GalleryModal implements OnInit {
    @ViewChild('slider') slider: Slides;

    initialImage: any;

    public photos: Photo[];
    sliderDisabled: boolean = false;
    initialSlide: number = 0;
    currentSlide: number = 0;
    sliderLoaded: boolean = false;
    closeIcon: string = 'arrow-back';
    resizeTriggerer: Subject<any> = new Subject();
    slidesDragging: boolean = false;
    panUpDownRatio: number = 0;
    panUpDownDeltaY: number = 0;
    dismissed: boolean = false;

    width: number = 0;
    height: number = 0;

    slidesStyle: any = {
        visibility: 'hidden'
    };
    modalStyle: any = {
        backgroundColor: 'rgba(0, 0, 0, 1)'
    };

    transitionDuration: string = '200ms';
    transitionTimingFunction: string = 'cubic-bezier(0.33, 0.66, 0.66, 1)';

    constructor(
        private viewCtrl: ViewController,
        params: NavParams,
        private element: ElementRef,
        private platform: Platform,
        private domSanitizer: DomSanitizer,
		public nativeService:NativeService
    ) {
        this.photos = params.get('photos') || [];
        this.closeIcon = params.get('closeIcon') || 'close';
        this.initialSlide = params.get('initialSlide') || 0;
        this.initialImage = this.photos[this.initialSlide] || {};
    }

    public ngOnInit() {
        // call resize on init
        this.resize({});
		console.log(this.photos);
    }

    /**
     * Closes the modal (when user click on CLOSE)
     */
    public dismiss() {
		this.nativeService.statusBarStyle();
        this.viewCtrl.dismiss();
    }

    private resize(event) {
        if (this.slider) this.slider.update();

        this.width = this.element.nativeElement.offsetWidth;
        this.height = this.element.nativeElement.offsetHeight;

        this.resizeTriggerer.next({
            width: this.width,
            height: this.height
        });
    }

    private orientationChange(event) {
        // TODO: See if you can remove timeout
        window.setTimeout(() => {
            this.resize(event);
        }, 150);
    }
    ionViewWillEnter() {
        this.sliderLoaded = true;
    }

    ionViewDidEnter() {
		this.nativeService.statusBarStyle('#000000'); // 设置状态栏颜色
        this.resize(false);
        this.slidesStyle.visibility = 'visible';
    }
    slidesPress(e, i) {
        console.log(e);
        console.log(i);

    }
    /**
     * Disables the scroll through the slider
     *
     * @param  {Event} event
     */
    private disableScroll(event) {
        if (!this.sliderDisabled) {
            this.currentSlide = this.slider.getActiveIndex();
            this.sliderDisabled = true;
        }
    }

    /**
     * Enables the scroll through the slider
     *
     * @param  {Event} event
     */
    private enableScroll(event) {
        if (this.sliderDisabled) {
            this.slider.slideTo(this.currentSlide, 0, false);
            this.sliderDisabled = false;
        }
    }

    /**
     * Called while dragging to close modal
     *
     * @param  {Event} event
     */
    private slidesDrag(event) {
        this.slidesDragging = true;
    }

    /**
     * Called when the user pans up/down
     *
     * @param  {Hammer.Event} event
     */
    private panUpDownEvent(event) {
        event.preventDefault();

        if (this.slidesDragging || this.sliderDisabled) {
            return;
        }

        let ratio = event.distance / (this.height / 2);
        if (ratio > 1) {
            ratio = 1;
        } else if (ratio < 0) {
            ratio = 0;
        }
        const scale = event.deltaY < 0 ? 1 : 1 - ratio * 0.2;
        const opacity = event.deltaY < 0 ? 1 - ratio * 0.5 : 1 - ratio * 0.2;
        const backgroundOpacity = event.deltaY < 0 ? 1 : 1 - ratio * 0.8;

        this.panUpDownRatio = ratio;
        this.panUpDownDeltaY = event.deltaY;

        this.slidesStyle.transform = `translate(0, ${
            event.deltaY
        }px) scale(${scale})`;
        this.slidesStyle.opacity = opacity;
        this.modalStyle.backgroundColor = `rgba(0, 0, 0, ${backgroundOpacity})`;

        delete this.slidesStyle.transitionProperty;
        delete this.slidesStyle.transitionDuration;
        delete this.slidesStyle.transitionTimingFunction;
        delete this.modalStyle.transitionProperty;
        delete this.modalStyle.transitionDuration;
        delete this.modalStyle.transitionTimingFunction;
    }

    /**
     * Called when the user stopped panning up/down
     *
     * @param  {Hammer.Event} event
     */
    private panEndEvent(event) {
        this.slidesDragging = false;

        this.panUpDownRatio += event.velocityY * 30;

        if (this.panUpDownRatio >= 0.65 && this.panUpDownDeltaY > 0) {
            if (!this.dismissed) {
                this.dismiss();
            }
            this.dismissed = true;
        } else {
            this.slidesStyle.transitionProperty = 'transform';
            this.slidesStyle.transitionTimingFunction = this.transitionTimingFunction;
            this.slidesStyle.transitionDuration = this.transitionDuration;

            this.modalStyle.transitionProperty = 'background-color';
            this.modalStyle.transitionTimingFunction = this.transitionTimingFunction;
            this.modalStyle.transitionDuration = this.transitionDuration;

            this.slidesStyle.transform = 'none';
            this.slidesStyle.opacity = 1;
            this.modalStyle.backgroundColor = 'rgba(0, 0, 0, 1)';
        }
    }
}
