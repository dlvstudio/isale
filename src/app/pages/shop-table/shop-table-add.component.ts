import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShopTableService } from '../../providers/shop-table.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'table-add',
    templateUrl: 'shop-table-add.component.html',
})
export class TableAddComponent {
    params: any = null;
    table: any = {};

    constructor(
        public navCtrl: RouteHelperService,
        private shopTableService: ShopTableService,
        private storeService: StoreService,
        private analyticsService: AnalyticsService,
    ) {
    }
    
    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('table-add');
    }

    ngOnInit(): void {
        this.table = {};
        let id = 0;
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id) {
            id = data.id;
        }

        if (id && id > 0) {
            this.shopTableService.getTable(id).then((table) => {
                this.table = table;
            });
        }
    }

    async save(): Promise<void> {
        const store = await this.storeService.getCurrentStore();
        this.table.storeId = store ? store.id : 0;
        this.shopTableService.saveTable(this.table).then(async () => {
            this.analyticsService.logEvent('table-add-save-success');
            this.exitPage();
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadTableList', null);
        this.navCtrl.publish('reloadTable', this.table);
    }
}
