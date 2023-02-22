import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { RouteHelperService } from '../../providers/route-helper.service';

@Component({
    selector: 'share-select',
    templateUrl: 'share-select.component.html'
})
export class ShareSelectComponent {
    constructor(
        public viewCtrl: ModalController,
        private analyticsService: AnalyticsService,
        public navCtrl: RouteHelperService
        ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('share');
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    via(method: string) {
        this.viewCtrl.dismiss(method);
    }
}
