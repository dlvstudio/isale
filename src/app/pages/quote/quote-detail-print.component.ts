import { Component } from '@angular/core';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { UserService } from '../../providers/user.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { DataService } from '../../providers/data.service';
import { ExcelService } from '../../providers/excel.service';
import { StoreService } from '../../providers/store.service';
import { StorageService } from '../../providers/storage.service';

@Component({
    selector: 'quote-detail-print',
    templateUrl: 'quote-detail-print.component.html',
})
export class QuoteDetailPrintComponent {
    params: any = null;
    mode = 'share';
    quote: any = {};
    currency: string;
    shop: any;
    isMobile = false;
    totalProductsAmount = 0;
    totalProductsQuantity = 0;
    hideTax = false;
    hideDiscountColumn = true;
    showStaffNameUnderSign = false;
    hideProductCodePrint = true;
    showImage = true;
    showDes = false;

    constructor(
        public navCtrl: RouteHelperService,
        private platform: Platform,
        private printer: Printer,
        public translateService: TranslateService,
        private userService: UserService,
        private storeService: StoreService,
        private analyticsService: AnalyticsService,
        private dataService: DataService,
        private excelService: ExcelService,
        private storage: StorageService,
        private alertCtrl: AlertController,
    ) {
    }

    get colspan1() {
        let start = 3;
        if (this.showImage) {
            start++;
        }
        if (this.showDes) {
            start++;
        }
        return start;
    }

    get colspan2() {
        let start = 5;
        if (this.showImage) {
            start++;
        }
        if (this.showDes) {
            start++;
        }
        return start;
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('quote-detail-print');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit() {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        await this.reload();
    }

    async reload(): Promise<void> {
        this.currency = await this.userService.getAttr('current-currency');
        const store = await this.storeService.getCurrentStore();
        this.shop = store ? store : await this.dataService.getFirstObject('shop');
        this.hideTax = await this.userService.getAttr('hide-tax');
        this.hideDiscountColumn = await this.userService.getAttr('hide-discount-column');
        this.showStaffNameUnderSign = await this.userService.getAttr('show-staff-name-under-sign');
        this.hideProductCodePrint = await this.userService.getAttr('hide-product-code-print');
        this.quote = {};
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.mode) {
            this.mode = this.params.mode;
        }
        const showImageStr = await this.storage.get('quote-show-Image');
        this.showImage = showImageStr && showImageStr === '1';

        const showDesStr = await this.storage.get('quote-show-Des');
        this.showDes = showDesStr && showDesStr === '1';
        if (this.params && this.params.quote) {
            this.quote = this.params.quote;
            this.totalProductsAmount = this.quote.items && this.quote.items.length
                ? _.sumBy(this.quote.items, (item: any) => item.total)
                : 0;
            this.totalProductsQuantity = this.quote.items && this.quote.items.length
                ? _.sumBy(this.quote.items, (item: any) => item.count)
                : 0;
            this.doPrintOrShare();
        }
    }

    doPrintOrShare() {
        setTimeout(async () => {
            const target = document.getElementById('print-page');
            const html: any = target.innerHTML;
            if (this.mode !== 'print') {
                const fileName = 'quote-' + this.quote.id + '.pdf';
                await this.excelService.downloadPdf(fileName, html, 4).then(async (url) => {
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
                this.navCtrl.back();
                return;
            }
            if (this.navCtrl.isNotCordova()) {
                Helper.webPrint(html, 500);
                this.navCtrl.back();
                return;
            }
            await this.printer.print(html, { orientation: 'portrait' }).then(() => { });
            this.navCtrl.back();
        }, 1000);
    }

    toHtml(key, afterFix = ':') {
        return Helper.toHtml(this.translateService.instant(key), afterFix);
    }

    numberArrays(start, end) {
        return Helper.numberArrays(start, end);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(this.hideProductCodePrint ? '' : code, title);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }
}
