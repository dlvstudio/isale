import { Component, Input, ViewChild } from '@angular/core';
import { AlertController, ModalController, IonSlides } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';

@Component({
    selector: 'gallery',
    templateUrl: 'gallery.component.html'
})
export class GalleryComponent {
    @ViewChild('mySlider', {static: false}) slider: IonSlides;
    @Input() images: string[] = [];
    @Input() id = 0;
    @Input() canDelete = false;
    idsToDelete: any[] = [];

    constructor(private viewCtrl: ModalController,
                private alertCtrl: AlertController,
                public navCtrl: RouteHelperService,
                private translate: TranslateService
        ) {
    }

    ngAfterViewInit(): void {
        this.slider.update();
        if (this.slider) {
            setTimeout(() => {
                this.slider.slideTo(this.id, 500);
            }, 500);
        }
    }

    dismiss() {
        if (this.idsToDelete && this.idsToDelete.length > 0) {
            this.viewCtrl.dismiss({idsToDelete: this.idsToDelete});
            return;
        }
        this.viewCtrl.dismiss();
    }

    async remove(): Promise<void> {
        const alert = await this.alertCtrl.create({
            header: this.translate.instant('common.confirm'),
            message: this.translate.instant('common.remove-photo'),
            buttons: [
              {
                text: this.translate.instant('common.cancel'),
                handler: () => {
                }
              },
              {
                text: this.translate.instant('common.agree'),
                handler: () => {
                  this.confirmRemove();
                }
              }
            ]
          });
        await alert.present();
    }

    async confirmRemove(): Promise<void> {
        const i = await this.slider.getActiveIndex();
        this.idsToDelete.push(i);
        this.images.splice(i, 1);
        if (i === this.images.length && this.images.length > 0) {
            this.slider.slideTo(this.images.length - 1);
        }
        if (this.images.length === 0) {
            this.dismiss();
        }
    }
}
