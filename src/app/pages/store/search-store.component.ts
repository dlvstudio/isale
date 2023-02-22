import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ModalController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { DataService } from '../../providers/data.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'search-store',
    templateUrl: 'search-store.component.html'
})
export class StoreSearchComponent {
    mainStore: any;
    stores: any[];
    originalStores: any[];
    searchKey = '';
    callback;
    params;

    constructor(public navCtrl: RouteHelperService,
                public staffService: StaffService,
                public viewCtrl: ModalController,
                private storeService: StoreService,
                private dataService: DataService,
                private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadStoreList', this.reload);
        this.navCtrl.subscribe('reloadStoreList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('store-search');
    }

    reload = async () => {
        this.mainStore = await this.dataService.getFirstObject('shop');
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.storeService.getStores().then((stores) => {
            this.originalStores = JSON.parse(JSON.stringify(stores));
            this.stores = stores;
        });
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit() {
        await this.reload();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-store-detail-search');
        let stores: any[] = JSON.parse(JSON.stringify(this.originalStores));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
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

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    async selectMainStore() {
        if (this.callback) {
            this.mainStore.isMainShop = true;
            this.callback(this.mainStore);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(this.mainStore);
    }

    async selectStore(store: any): Promise<void> {
        if (this.callback) {
            this.callback(store);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(store);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    openStoreAdd(): void {
        this.navCtrl.push('/store/add', {fromSearch: true});
    }
}
