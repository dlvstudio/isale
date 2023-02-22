import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ModalController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShopTableService } from '../../providers/shop-table.service';
import { StoreService } from '../../providers/store.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'search-table',
    templateUrl: 'search-shop-table.component.html'
})
export class TableSearchComponent {
    tables: any[];
    originalTables: any[];
    searchKey = '';

    constructor(public navCtrl: RouteHelperService,
                public staffService: StaffService,
                public viewCtrl: ModalController,
                private shopTableService: ShopTableService,
                private storeService: StoreService,
                private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadTableList', this.reload);
        this.navCtrl.subscribe('reloadTableList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('table-search');
    }

    reload = async () => {
        const store = await this.storeService.getCurrentStore();
        this.shopTableService.getTables(store ? store.id : 0).then(async (tables) => {
            let processingOrders = await this.shopTableService.getProcessingOrders();
            processingOrders = processingOrders ? processingOrders.filter((order) => order.tableId > 0) : [];
            const tbs = tables.filter(t => {
                const orderFound = processingOrders.find(o => o.tableId == t.id);
                if (orderFound) {
                    return false;
                }
                return true;
            });
            this.originalTables = JSON.parse(JSON.stringify(tbs));
            this.tables = tbs;
        });
    }

    ngOnInit(): void {
        this.reload();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-table-detail-search');
        let tables: any[] = JSON.parse(JSON.stringify(this.originalTables));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            tables = tables.filter((item) => {
                return (
                    item.name && item.name.toLowerCase().indexOf(searchKey) !== -1
                    || item.position && item.position.toLowerCase().indexOf(searchKey) !== -1
                );
            });
        }
        this.tables = tables;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    selectTable(table: any): void {
        this.viewCtrl.dismiss(table);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    openTableAdd(): void {
        this.navCtrl.push('/table/add', null);
    }
}
