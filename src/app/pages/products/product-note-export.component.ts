import { Component } from '@angular/core';
import { DateRangeComponent } from '../shared/date-range.component';
import { ModalController, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { IProduct } from '../../models/product.interface';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { ProductService } from '../../providers/product.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';


@Component({
    selector: 'product-note-export',
    templateUrl: 'product-note-export.component.html'
})
export class ProductNoteExportComponent {
    params: any = null;
    dateFrom = '';
    dateTo = '';
    currency: string;
    reportType: number = 0; // summary
    report: any;
    isMobile;
    productSelected: IProduct;
    store;
    checkStore;
    selectedStaff;

    constructor(
        private modalCtrl: ModalController,
        public translateService: TranslateService,
        private userService: UserService,
        private excelService: ExcelService,
        public navCtrl: RouteHelperService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private platform: Platform,
        private storeService: StoreService,
        private barcodeScanner: BarcodeScanner,
        private staffService: StaffService,
        private productService: ProductService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-note-export');
    }

    ngOnInit(): void {
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    async export(): Promise<void> {
        const fileName = this.reportType === 0
            ? 'products-report-summary-' + this.dateFormatInFile(this.dateFrom) + '-to-' + this.dateFormatInFile(this.dateTo) + '.xlsx'
            : 'products-report-detail-' + this.dateFormatInFile(this.dateFrom) + '-to-' + this.dateFormatInFile(this.dateTo) + '.xlsx';
        this.excelService.downloadExcelInventoryReport(fileName,
            (this.productSelected && this.reportType === 1 ? this.productSelected.id : 0),
            this.reportType, this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (url) => {
                this.analyticsService.logEvent('product-note-export-downloaded');
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
        // this.dateFrom = '';
        this.dateTo = '';
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data.dateFrom) {
            this.dateFrom = data.dateFrom;
        } else {
            this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
        }
        if (data.dateTo) {
            this.dateTo = data.dateTo;
        } else {
            this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
        }
        if (data.reportType) {
            this.reportType = data.reportType;
        } else {
            this.reportType = 0;
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

    async generate() {
        const loading = await this.navCtrl.loading();
        this.excelService.getProductReport(this.reportType, this.productSelected ? this.productSelected.id : 0, this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (report) => {
            this.analyticsService.logEvent('product-note-export-generated');
            this.report = report;
            await loading.dismiss();
        });
    }

    resetReport() {
        this.report = null;
    }

    reportName() {
        if (this.reportType === 0) {
            return this.translateService.instant('product-note-export.report-type-by-summary');
        }
        if (this.reportType === 1) {
            return this.translateService.instant('product-note-export.report-type-by-detail');
        }
        return '';
    }
    productName(code, title) {
        return Helper.productName(code, title);
    }

    async showSearchProduct() {
        const callback = (data) => {
            const product = data;
            if (product) {
                this.productSelected = product;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    removeProduct(): void {
        this.productSelected = null;
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('product-note-export-scan-barcode');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.checkBarcodeScaned(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.checkBarcodeScaned(barcodeData.text);
        });
    }

    checkBarcodeScaned(barcode) {
        this.productService.searchByBarcode(barcode).then(async (product) => {
            if (!product) {
                return;
            }
            this.analyticsService.logEvent('product-note-export-searched-barcode');
            this.productSelected = product;
        });
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

    selectProduct(id: number): void {
        this.navCtrl.navigateForward('/product/detail', { id, selectedStaff: this.selectedStaff });
    }
}
