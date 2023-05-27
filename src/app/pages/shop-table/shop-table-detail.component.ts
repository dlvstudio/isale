import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShopTableService } from '../../providers/shop-table.service';

@Component({
    selector: 'table-detail',
    templateUrl: 'shop-table-detail.component.html',
})
export class TableDetailComponent {
    table: any = {};
    params: any = null;
    currency: string;

    constructor(
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private userService: UserService,
        private shopTableService: ShopTableService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        const reloadTableHandle = (event) => {
            const table = event.detail;
            if (this.table && table.id === this.table.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadTable', reloadTableHandle);
        this.navCtrl.subscribe('reloadTable', reloadTableHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('table-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        this.table = {};
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.shopTableService.getTable(id).then((table) => {
                this.table = table;
            });
        }
    }

    edit(): void {
        this.navCtrl.push('/table/add', {id: this.table.id});
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('table.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteTable();
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

    async deleteTable(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('table.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.shopTableService.deleteTable(this.table).then(async () => {
                            this.analyticsService.logEvent('table-detail-delete-success');
                            this.navCtrl.publish('reloadTableList', null);
                            this.navCtrl.pop();
                        });
                    }
                },
            ]
        });
        confirm.present();
    }

    selectTable(id: number): void {
        this.navCtrl.push('/table/detail', {id});
    }
}
