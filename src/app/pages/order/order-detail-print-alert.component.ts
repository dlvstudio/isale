import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StorageService } from '../../providers/storage.service';

@Component({
    selector: 'order-detail-print-alert',
    templateUrl: 'order-detail-print-alert.component.html',
})
export class OrderDetailPrintAlertComponent {
    params: any = null;
    order: any;
    noAlertRepeat = false;

    constructor(
        public navCtrl: RouteHelperService,
        private storage: StorageService,
        private platform: Platform,
        private analyticsService: AnalyticsService
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-detail-print-alert');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit() {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.order) {
            this.order = this.params.order;
        }
    }

    async share() {
        await this.navCtrl.popOnly()
        this.navCtrl.push('/order/detail-print', { order: this.order, mode: 'share' });
    }

    async print() {
        await this.navCtrl.popOnly()
        this.navCtrl.push('/order/detail-print', { order: this.order, mode: 'print' });
    }

    gotoPrintAndroid() {
        this.navCtrl.push('/help/print-android');
    }

    async updateAlertRepeat() {
        await this.storage.set('print-alert-no-repeat', this.noAlertRepeat ? '1' : '0');
    }

    goPrintPage() {
        const page = this.platform.is('android') ? 'print-android' : 'print-ios';
        this.navCtrl.push('/help/' + page);
    }
}
