import { PeriodRangeComponent } from './../shared/period-range.component';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { DateRangeComponent } from './../shared/date-range.component';
import { ITrade } from './../../models/trade.interface';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Component, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { Platform, ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { TradeService } from '../../providers/trade.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ProductService } from '../../providers/product.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'trade',
    templateUrl: 'trade.component.html'
})
export class TradeComponent {
    params: any = null;
    originalTrades: ITrade[];
    trades: ITrade[];
    searchKey = '';
    noteFilter = 'frequency';
    total = 0;
    dateFrom = '';
    dateTo = '';
    currency: string;
    isLoading = false;
    isReceivedTrade = -1;
    @ViewChild('period-range', { static: true }) periodRange: PeriodRangeComponent;

    constructor(
        private platform: Platform,
        private barcodeScanner: BarcodeScanner,
        private file: File,
        private tradeService: TradeService,
        public translateService: TranslateService,
        private staffService: StaffService,
        private userService: UserService,
        private productService: ProductService,
        private modalCtrl: ModalController,
        public navCtrl: RouteHelperService,
        private excelService: ExcelService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadTradeList', this.reload);
        this.navCtrl.subscribe('reloadTradeList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('trades');
    }

    ngOnInit(): void {
        this.reload();
    }

    onPeriodChanged(data: any): void {
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
            this.isReceivedTrade = data.isReceivedTrade;
            this.tradeService.getTrades(this.dateFrom, this.dateTo, this.isReceivedTrade).then((trades) => {
                this.originalTrades = JSON.parse(JSON.stringify(trades));
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                this.filter();
            });
        }
    }

    reload = async () => {
        this.currency = await this.userService.getAttr('current-currency');
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.dateFrom) {
            this.dateFrom = this.params.dateFrom;
        } else {
            this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
        }
        if (this.params && this.params.dateTo) {
            this.dateTo = this.params.dateTo;
        } else {
            this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
        }
        const loading = await this.navCtrl.loading();
        this.tradeService.getTrades(this.dateFrom, this.dateTo).then(async (trades) => {
            await loading.dismiss();
            this.originalTrades = JSON.parse(JSON.stringify(trades));
            this.trades = trades;
            this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            this.filter();
        });
    }

    openTradeAdd(): void {
        const hasPermission = !this.staffService.isStaff() 
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canCreateNewTransaction;
        if (!hasPermission) {
            alert(this.translateService.instant('trade.no-permission-to-create-trade'));
            return;
        }
        this.navCtrl.push('/trade/add');
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('trade-search');
        let trades: ITrade[] = JSON.parse(JSON.stringify(this.originalTrades));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            trades = trades.filter((item) => {
                return (item.note && item.note.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.code && item.product.code.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.title && item.product.title.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.trades = trades;
        this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let trades: ITrade[] = JSON.parse(JSON.stringify(this.originalTrades));
        trades = this.sortByModifiedAt(trades);
        this.trades = trades;
    }

    sortByModifiedAt(trades: ITrade[]): ITrade[] {
        if (trades) {
            return _.orderBy(trades, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id: id });
    }

    async deleteTrade(trade: ITrade): Promise<void> {
        if (trade && (trade.orderId || trade.debtId || trade.receivedNoteId || trade.transferNoteId)) {
            alert(this.translateService.instant('trade.trade-related-alert'));
            return;
        }
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('trade.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.tradeService.deleteTrade(trade).then(async () => {
                            this.analyticsService.logEvent('trade-delete-success');
                            let i = this.trades.findIndex(item => item.id == trade.id);
                            if (i >= 0) {
                                this.trades.splice(i, 1);
                                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                            }
                            i = this.originalTrades.findIndex(item => item.id == trade.id);
                            if (i >= 0) {
                                this.originalTrades.splice(i, 1);
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

    async presentOtherActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('export.export-to-excel'),
                    handler: () => {
                        try {
                            this.exportExcel();
                        } catch (error) {
                            alert(error);
                        }

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

    exportExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.transaction-report')]);
        if (this.dateFrom && this.dateTo) {
            const strFrom = this.translateService.instant('common.from');
            const strTo = this.translateService.instant('common.to');
            const str = strFrom + ' ' + this.dateFormat(this.dateFrom) + ' ' + strTo + ' ' + this.dateFormat(this.dateTo);
            data.push([str]);
        }
        data.push([
            this.translateService.instant('common.total') + ': ' +
            this.total + ' ' +
            this.currency
        ]);
        data.push([
            this.translateService.instant('export.contact'),
            this.translateService.instant('export.product'),
            this.translateService.instant('export.product-count'),
            this.translateService.instant('export.money'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const trade of this.trades) {
            data.push([
                trade.contactId != 0 && trade.contact ? trade.contact.fullName : '',
                trade.productId != 0 && trade.product ? Helper.productName(trade.product.code, trade.product.title) : '',
                trade.productId != 0 && trade.product && trade.isPurchase
                    ? trade.productCount ? trade.productCount : 0
                    : ' ',
                trade.isReceived ? trade.value : -1 * trade.value,
                this.currency,
                this.dateFormat(trade.createdAt)
            ]);
        }
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'transaction-report-' + Helper.getCurrentDate() + '.xlsx';
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

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    async presentActionSheet(trade: ITrade) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('trade.delete-trade'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteTrade(trade);
                    }
                }, {
                    text: this.translateService.instant('trade.edit-trade'),
                    handler: () => {
                        this.selectTrade(trade.id);
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
            this.tradeService.getTrades(this.dateFrom, this.dateTo).then((trades) => {
                this.originalTrades = JSON.parse(JSON.stringify(trades));
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                this.filter();
            });
        }
    }

    addReport(): void {
        this.navCtrl.navigateRoot('/report');
    }

    scan(): void {
        if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
            alert(this.translateService.instant('common.feature-only-on-app'));
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            if (isNaN(+barcodeData.text)) {
                return;
            }
            const seletectedProductId = +barcodeData.text;
            this.productService.get(seletectedProductId, 0).then(() => {
                this.navCtrl.push('/trade/add', { product: seletectedProductId })
            });
        });
    }

    previousMoment(): void {

    }

    nextMoment(): void {

    }

    selectMomentType(): void {

    }
}
