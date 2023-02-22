import { IContact } from '../../models/contact.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'store-detail',
    templateUrl: 'store-detail.component.html',
})
export class StoreDetailComponent {
    store: any = {};
    params: any = null;
    searchKey = '';

    constructor(
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
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

    reload(): void {
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

    sortByModifiedAt(lst: any[]): any[] {
        if (lst) {
            return _.orderBy(lst, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/store/add', {id: this.store.id});
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

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }
}
