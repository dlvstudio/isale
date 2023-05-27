import { Component } from '@angular/core';
import * as _ from 'lodash';
import { DateRangeComponent } from '../shared/date-range.component';

import { IMoneyAccount } from '../../models/money-account.interface';
import { MoneyAccount } from '../../models/money-account.model';
import { ITrade } from '../../models/trade.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { MoneyAccountService } from '../../providers/money-account.service';
import { TradeService } from '../../providers/trade.service';
import { ExcelService } from '../../providers/excel.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'money-account-detail',
    templateUrl: 'money-account-detail.component.html',
})
export class MoneyAccountDetailComponent {
    params: any = null;
    account: IMoneyAccount = new MoneyAccount();
    arr = [];
    currency: string;
    dateFrom = '';
    dateTo = '';
    trades: ITrade[] = [];
    total = 0;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private userService: UserService,
        private modalCtrl: ModalController,
        private moneyAccountService: MoneyAccountService,
        private file: File,
        private tradeService: TradeService,
        private excelService: ExcelService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        const reloadMoneyAccountHandle = (event) => {
            const account = event.detail;
            if (this.account && account.id === this.account.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadMoneyAccount', reloadMoneyAccountHandle);
        this.navCtrl.subscribe('reloadMoneyAccount', reloadMoneyAccountHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.params = this.navCtrl.getParams(this.params);
        this.account = new MoneyAccount();
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.moneyAccountService.get(id).then(async (account) => {
                await loading.dismiss();
                this.account = account;
                // this.dateFrom = '';
                // this.dateTo = '';
                if (this.params.dateFrom) {
                    this.dateFrom = this.params.dateFrom;
                } else {
                    this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
                }
                if (this.params.dateTo) {
                    this.dateTo = this.params.dateTo;
                } else {
                    this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
                }
                this.tradeService.getTradesByAccount(account.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                    if (trades && trades.length > 0) {
                        trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                    }
                    this.trades = trades;
                    this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                });
            });
        } else {
            await loading.dismiss();
        }
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/money-account/add', { id: this.account.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('export.export-trade'),
                    handler: () => {
                        this.exportTradeToExcel();
                    }
                }, {
                    text: this.translateService.instant('money-account-detail.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteProduct();
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

    exportTradeToExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.product-transaction-report')]);
        data.push([
            this.translateService.instant('export.product') + ': ' +
            this.account.accountName
        ]);

        if (this.dateFrom && this.dateTo) {
            const strFrom = this.translateService.instant('common.from');
            const strTo = this.translateService.instant('common.to');
            const str = `${strFrom} ${this.dateFormat(this.dateFrom)} ${strTo} ${this.dateFormat(this.dateTo)}`;
            data.push([str]);
        }
        data.push([
            `${this.translateService.instant('common.total')}: ${this.total} ${this.currency}`
        ]);
        data.push([
            this.translateService.instant('export.accountName'),
            this.translateService.instant('export.note'),
            this.translateService.instant('export.value'),
            this.translateService.instant('export.transferFee'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const trade of this.trades) {
            data.push([
                trade.moneyAccount.accountName,
                trade.note,
                trade.value,
                0,
                this.currency,
                this.dateFormat(trade.createdAt)
            ]);
        }
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'product-transactions-report-' + this.account.id + '-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async (content) => {
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + this.file.externalDataDirectory + fileName,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFile(null, content);
        });
    }

    async deleteProduct(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('money-account-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.moneyAccountService.deleteMoneyAccount(this.account).then(async () => {
                            this.analyticsService.logEvent('money-account-detail-delete-success');
                            this.navCtrl.publish('reloadMoneyAccountList');
                            this.navCtrl.publish('reloadHome');
                            this.navCtrl.pop();
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

    async selectDateRangeForTrade(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom != '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo != '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.tradeService.getTradesByAccount(this.account.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });
        }
    }

    productName(product: IMoneyAccount): string {
        return product.accountName;
    }

    transfer(): void {
        this.navCtrl.push('/money-account/transfer', { id: this.account.id });
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id });
    }
}
