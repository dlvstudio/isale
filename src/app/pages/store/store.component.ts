import { Component } from '@angular/core';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { StaffService } from '../../providers/staff.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'store',
    templateUrl: 'store.component.html'
})
export class StoreComponent {
    originalStores: any[];
    stores: any[];
    searchKey: string = '';
    noteFilter: string = 'frequency';
    selectedStaff;
    store;
    checkStore;
    
    constructor(
        private storeService: StoreService,
        private translateService: TranslateService,
        public staffService: StaffService,
        public navCtrl: RouteHelperService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadStoreList', this.reload);
        this.navCtrl.subscribe('reloadStoreList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('store');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = () => {
        this.storeService.getStores().then(async (stores) => {
            this.originalStores = JSON.parse(JSON.stringify(stores));
            this.stores = stores;
            this.selectedStaff = this.staffService.selectedStaff;
            this.store = await this.storeService.getCurrentStore();
            this.checkStore = this.store
                ? this.translateService.instant('store.check-store', { shop: this.store.name })
                : null;
            this.filter();
        });
    }

    openStoreAdd(): void {
        this.navCtrl.push('/store/add');
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('store-detail-search');
        let stores: any[] = JSON.parse(JSON.stringify(this.originalStores));
        if (this.searchKey !== null && this.searchKey !== '') {
            let searchKey = this.searchKey.toLowerCase();
            stores = stores.filter((item) => {
                return (item.name && item.name.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.stores = stores;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let stores: any[] = JSON.parse(JSON.stringify(this.originalStores));
        this.stores = stores;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectStore(id: number): void {
        this.navCtrl.push('/store/add', { id: id });
    }

    async deleteStore(store: any): Promise<void> {
        let confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.storeService.deleteStore(store).then(async () => {
                            this.analyticsService.logEvent('store-delete-success');
                            let i = this.stores.findIndex(item => item.id == store.id);
                            if (i >= 0) {
                                this.stores.splice(i, 1);
                            }
                            i = this.originalStores.findIndex(item => item.id == store.id);
                            if (i >= 0) {
                                this.originalStores.splice(i, 1);
                            }
                        });
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

    async presentActionSheet(store: any) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('store.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteStore(store);
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    async loginAsStore(store) {
        this.storeService.loginAsStore(store);
        alert(this.translateService.instant('store.login-alert', { shop: store.name }));
        await this.reload();
    }

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', {shop: this.store.name}),
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
