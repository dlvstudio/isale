import { Component } from '@angular/core';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { StaffService } from '../../providers/staff.service';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShopTableService } from '../../providers/shop-table.service';
import { IOrder } from '../../models/order.interface';
import { UserService } from '../../providers/user.service';
import { StoreService } from '../../providers/store.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'table',
    templateUrl: 'shop-table.component.html'
})
export class TableComponent {
    originalTables: any[];
    tables: any[];
    processingOrders: IOrder[];
    searchKey = '';
    noteFilter = 'frequency';
    currency: string;
    store;
    checkStore;
    selectedStaff;
    regions = [];
    regionSelected = 'all';
    params: any = null;
    searchMode = false;
    callback;

    constructor(
        private shopTableService: ShopTableService,
        public viewCtrl: ModalController,
        public translateService: TranslateService,
        public staffService: StaffService,
        public navCtrl: RouteHelperService,
        private storeService: StoreService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private userService: UserService,
    ) {
        this.navCtrl.unsubscribe('reloadTableList', this.reload);
        this.navCtrl.subscribe('reloadTableList', this.reload);
    }

    async ionViewWillEnter() {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.searchMode) {
            this.searchMode = this.params.searchMode;
        }
        await this.analyticsService.setCurrentScreen('table');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
        this.shopTableService.getTables(this.store ? this.store.id : 0).then(async (tables) => {
            const regions = [];
            for (const table of tables) {
                if (!table.position) {
                    continue;
                }
                const found = regions.find(r => r === table.position);
                if (!found) {
                    regions.push(table.position);
                }
            }
            this.regions = regions;
            const processingOrders = await this.shopTableService.getProcessingOrders();
            await loading.dismiss();
            this.processingOrders = processingOrders ? processingOrders.filter((order) => order.tableId > 0) : [];
            if (this.processingOrders.length) {
                for (const order of this.processingOrders) {
                    const table = tables.find(item => item.id === order.tableId);
                    if (!table) {
                        continue;
                    }
                    table.order = order;
                    table.order.items = JSON.parse(order.itemsJson);
                }
            }
            let tbs = tables;
            if (this.searchMode) {
                tbs = tables.filter(t => {
                    const orderFound = processingOrders.find(o => o.tableId == t.id);
                    if (orderFound) {
                        return false;
                    }
                    return true;
                });
            }
            this.originalTables = JSON.parse(JSON.stringify(tbs));
            this.tables = tbs;
            this.filter();
        });
    }

    changeRegion() {
        if (this.regionSelected === 'all') {
            this.clearSearch();
            return;
        }
        this.analyticsService.logEvent('table-change-region');
        let tables: any[] = JSON.parse(JSON.stringify(this.originalTables));
        const searchKey = this.regionSelected ? this.regionSelected.toLowerCase() : '';
        if (!searchKey) {
            return;
        }
        tables = tables.filter((item) => (
            item.position && item.position.toLowerCase().indexOf(searchKey) !== -1
        ));
        this.tables = tables;
    }

    addOrder(table) {
        if (this.searchMode) {
            this.selectTable(table);
            return;
        }
        if (!table.order) {
            this.navCtrl.push('/order/add', { table });
            return;
        }
        this.selectTable(table);
    }

    openTableAdd(): void {
        this.navCtrl.push('/table/add', null);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('table-search');
        let tables: any[] = JSON.parse(JSON.stringify(this.originalTables));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            tables = tables.filter((item) => (
                item.name && item.name.toLowerCase().indexOf(searchKey) !== -1
                || item.position && item.position.toLowerCase().indexOf(searchKey) !== -1
            ));
        }
        this.tables = tables;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let tables: any[] = JSON.parse(JSON.stringify(this.originalTables));
        tables = this.sortByName(tables);
        this.tables = tables;
    }

    sortByName(tables: any[]): any[] {
        if (tables) {
            return _.orderBy(tables, ['name'], ['asc']);
        }
        return null;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    async selectTable(table: any): Promise<void> {
        if (this.searchMode) {
            if (this.callback) {
                this.callback(table);
                await this.navCtrl.back();
                return;
            }
            this.viewCtrl.dismiss(table);
            return;
        }
        this.navCtrl.push('/table/detail', { id: table.id });
    }

    async deleteTable(table: any): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('table.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.shopTableService.deleteTable(table).then(async () => {
                            this.analyticsService.logEvent('table-delete-success');
                            let i = this.tables.findIndex(item => item.id == table.id);
                            if (i >= 0) {
                                this.tables.splice(i, 1);
                            }
                            i = this.originalTables.findIndex(item => item.id == table.id);
                            if (i >= 0) {
                                this.originalTables.splice(i, 1);
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

    async presentActionSheet(table: any) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('table.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteTable(table);
                    }
                }, {
                    text: this.translateService.instant('table.view-detail'),
                    handler: () => {
                        this.selectTable(table.id);
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

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', { shop: this.store.name }),
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

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }
}
