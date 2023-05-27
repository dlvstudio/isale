import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';


@Component({
    selector: 'product-import',
    templateUrl: 'product-import.component.html'
})
export class ProductImportComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    currency: string;
    fileToUpload: any;
    uploadDisabled = false;
    productsImported: any[] = [];
    isMobile = true;
    store;
    checkStore;
    selectedStaff;
    isMaterial = false;

    constructor(
        private userService: UserService,
        private excelService: ExcelService,
        public navCtrl: RouteHelperService,
        private platform: Platform,
        private alertCtrl: AlertController,
        public translateService: TranslateService,
        private storeService: StoreService,
        private staffService: StaffService,
        private analyticsService: AnalyticsService
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-import');
    }

    async ngOnInit(): Promise<void> {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
        const params = this.navCtrl.getParams();
        this.isMaterial = params && params.isMaterial;
    }

    async downloadTemplate(): Promise<void> {
        this.analyticsService.logEvent('product-import-download');
        const fileName = 'product-template.xlsx';
        const loading = await this.navCtrl.loading();
        this.excelService.downloadProductsTemplate(fileName).then(async (url) => {
            await loading.dismiss();
            if (!(this.platform.is('capacitor') || this.platform.is('cordova'))
                || document.URL.indexOf('atakafe.com/isale') !== -1 || document.URL.indexOf('isale.online/app') !== -1
                // || document.URL.indexOf('localhost') !== -1
            ) {
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

    rememberFile($event): void {
        this.fileToUpload = $event.target.files[0];
        this.uploadProducts();
    }

    async uploadProducts(): Promise<void> {
        this.analyticsService.logEvent('product-import-upload');
        this.uploadDisabled = true;
        const loading = await this.navCtrl.loading();
        this.excelService.uploadProductsFile(this.fileToUpload, this.store ? this.store.id : 0, this.isMaterial).then(async (message) => {
            await loading.dismiss();
            if (message && message.id) {
                this.analyticsService.logEvent('product-import-uploaded-success');
                alert(this.translateService.instant('product-import.done'));
                this.navCtrl.publish('reloadProductList');
                this.productsImported = message.products;
            } else if (message && message.error) {
                this.analyticsService.logEvent('product-import-error');
                let err = message.error + '';
                err = err.replace('{', '').replace('}', '');
                const arr = err.split(':');
                err = '';
                if (arr.length >= 2) {
                    err = this.translateService.instant('product-import.' + arr[0]) + arr[1];
                } else {
                    err = this.translateService.instant('product-import.' + arr[0]);
                }
                alert(err);
            } else {
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            }
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        }).catch(async () => {
            await loading.dismiss();
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
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
                        this.store = null;
                        this.checkStore = null;
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
