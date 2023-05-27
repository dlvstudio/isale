import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'store-detail',
    templateUrl: 'store-detail.component.html',
})
export class StoreDetailComponent {
    store: any = {};
    storeLogined;
    params: any = null;
    searchKey = '';
    selectedStaff;
    checkStore;

    constructor(
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private staffService: StaffService,
        private storeService: StoreService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        const reloadStoreHandle = (event) => {
            const store = event.detail;
            if (this.store && store.id === this.store.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadStore', reloadStoreHandle);
        this.navCtrl.subscribe('reloadStore', reloadStoreHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('store-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        this.selectedStaff = this.staffService.selectedStaff;
        this.storeLogined = await this.storeService.getCurrentStore();
        this.checkStore = this.storeLogined
            ? this.translateService.instant('store.check-store', { shop: this.storeLogined.name })
            : null;
        this.store = {};
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            const id = data.id;
            this.storeService.getStore(id).then((store) => {
                this.store = store;
            });
        }
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    edit(): void {
        this.navCtrl.push('/store/add', { id: this.store.id });
    }

    async deleteStore(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.storeService.deleteStore(this.store).then(async () => {
                            this.analyticsService.logEvent('store-detail-delete-success');
                            this.navCtrl.publish('reloadStoreList', null);
                            this.navCtrl.pop();
                        });
                    }
                },
            ]
        });
        confirm.present();
    }

    async loginAsStore() {
        this.storeService.loginAsStore(this.store);
        alert(this.translateService.instant('store.login-alert', { shop: this.store.name }));
        await this.reload();
    }

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', { shop: this.storeLogined.name }),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.storeService.exitStore();
                        await this.reload();
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }
}
