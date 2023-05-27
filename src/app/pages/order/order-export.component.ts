import { Component } from '@angular/core';
import { DateRangeComponent } from '../shared/date-range.component';
import { ModalController, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';


@Component({
    selector: 'order-export',
    templateUrl: 'order-export.component.html'
})
export class OrderExportComponent {
    params: any = null;
    ordersInput: any[];
    dateFrom = '';
    dateTo = '';
    currency: string;
    reportType = 0; // summary
    isMobile = true;
    report: any;
    store: any;
    checkStore: string;
    selectedStaff;

    constructor(
        private modalCtrl: ModalController,
        public translateService: TranslateService,
        private userService: UserService,
        private excelService: ExcelService,
        public navCtrl: RouteHelperService,
        private storeService: StoreService,
        private alertCtrl: AlertController,
        public staffService: StaffService,
        private analyticsService: AnalyticsService,
        private platform: Platform,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-export');
    }

    selectOrder(id: number): void {
        this.navCtrl.navigateForward('/order/detail', { id });
    }

    selectProduct(id: number): void {
        this.navCtrl.navigateForward('/product/detail', { id, selectedStaff: this.selectedStaff });
    }

    selectContact(id: number): void {
        if (id == 0) {
            return;
        }
        this.navCtrl.navigateForward('/contact/detail', { id });
    }

    selectStaff(id: number): void {
        if (id == 0) {
            return;
        }
        this.navCtrl.navigateForward('/staff/detail', { id });
    }

    ngOnInit(): void {
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    async generate() {
        const loading = await this.navCtrl.loading();
        const orderIds = this.ordersInput && this.ordersInput.length
            ? this.ordersInput.map(o => o.id)
            : null;
        this.excelService.getSalesReport(orderIds, this.reportType, this.selectedStaff ? this.selectedStaff.id : 0, this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (report) => {
            this.analyticsService.logEvent('order-export-generated');
            this.report = report;
            await loading.dismiss();
        });
    }

    resetReport() {
        this.report = null;
    }

    reportName() {
        if (this.reportType === 0) {
            return this.translateService.instant('order-export.report-type-by-order');
        }
        if (this.reportType === 1) {
            return this.translateService.instant('order-export.report-type-by-product');
        }
        if (this.reportType === 2) {
            return this.translateService.instant('order-export.report-type-by-customer');
        }
    }

    async export(): Promise<void> {
        const loading = await this.navCtrl.loading();
        const fileName = this.reportType === 0
            ? 'sales-report-by-order-' + this.dateFormatInFile(this.dateFrom) + '-to-' + this.dateFormatInFile(this.dateTo) + '.xlsx'
            : this.reportType === 1
                ? 'sales-report-by-product-' + this.dateFormatInFile(this.dateFrom) + '-to-' + this.dateFormatInFile(this.dateTo) + '.xlsx'
                : 'sales-report-by-customer-' + this.dateFormatInFile(this.dateFrom) + '-to-' + this.dateFormatInFile(this.dateTo) + '.xlsx';
        const orderIds = this.ordersInput && this.ordersInput.length
            ? this.ordersInput.map(o => o.id)
            : null;
        this.excelService.downloadExcelOrderReport(orderIds, fileName, this.reportType, this.selectedStaff ? this.selectedStaff.id : 0, this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (url) => {
            await loading.dismiss();
            this.analyticsService.logEvent('order-export-downloaded');
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + url,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFileUrl(fileName, fileName, url);
        }).catch(async () => {
            await loading.dismiss();
        });
    }

    async selectDateRange(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            this.analyticsService.logEvent('order-export-daterange-selected');
            if (data.dateFrom !== '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo !== '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.report = null;
        }
    }

    async reload(): Promise<void> {
        this.isMobile = this.platform.width() < 720;
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
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
        if (this.params && this.params.reportType) {
            this.reportType = this.params.reportType;
        } else {
            this.reportType = 0;
        }
        if (this.params && this.params.orders) {
            this.ordersInput = this.params.orders;
        } else {
            this.ordersInput = null;
        }
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateFormatInFile(date: string): string {
        return this.dateFormat(date).split('/').join('-');
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
                        this.resetReport();
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

    async showSearchStaff() {
        this.analyticsService.logEvent('order-export-search-staff');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.selectedStaff = staff;
            }
        };
        this.navCtrl.push('/staff', { callback, searchMode: true });
    }

    removeStaff(): void {
        this.selectedStaff = null;
    }
}
