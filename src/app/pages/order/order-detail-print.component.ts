import { IOrder } from '../../models/order.interface';
import { Component } from '@angular/core';
import { Order } from '../../models/order.model';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { DataService } from '../../providers/data.service';
import { IOrderItem } from '../../models/order-item.interface';

import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ExcelService } from '../../providers/excel.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'order-detail-print',
    templateUrl: 'order-detail-print.component.html',
})
export class OrderDetailPrintComponent {
    params: any = null;
    mode = 'share';
    order: IOrder = new Order();
    currency: string;
    shop: any;
    isMobile = false;
    totalProductsAmount = 0;
    totalProductsQuantity = 0;
    printOrderLikeInvoice = false;
    hideTax = false;
    orderInvoiceMaxEmptyRows = 10;
    hideDiscountColumn = true;
    showStaffNameUnderSign = false;
    hideProductCodePrint = true;

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
        private alertCtrl: AlertController,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-detail-print');
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
        this.currency = await this.userService.getCurrentCurrency();
        const store = await this.storeService.getCurrentStore();
        this.shop = store ? store : await this.dataService.getFirstObject('shop');
        this.printOrderLikeInvoice = await this.userService.getPrintOrderLikeInvoice();
        this.hideTax = await this.userService.getHideTax();
        this.orderInvoiceMaxEmptyRows = await this.userService.getOrderInvoiceMaxEmptyRows();
        this.hideDiscountColumn = await this.userService.getHideDiscountColumn();
        this.showStaffNameUnderSign = await this.userService.getShowStaffNameUnderSign();
        this.hideProductCodePrint = await this.userService.getHideProductCodePrint();
        this.order = new Order();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.mode) {
            this.mode = this.params.mode;
        }
        if (this.params && this.params.order) {
            this.order = this.params.order;
            this.totalProductsAmount = this.order.items && this.order.items.length
                ? _.sumBy(this.order.items, (item: IOrderItem) => item.total)
                : 0;
            this.totalProductsQuantity = this.order.items && this.order.items.length
                ? _.sumBy(this.order.items, (item: IOrderItem) => item.count)
                : 0;
            this.doPrintOrShare();
        }
    }

    doPrintOrShare() {
        setTimeout(async () => {
            const target = document.getElementById('print-page');
            const html: any = target.innerHTML;
            if (this.mode !== 'print') {
                const fileName = 'order-' + this.order.id + '.pdf';
                await this.excelService.downloadOrderPdf(fileName, html).then(async (url) => {
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
                this.webPrint(html);
                this.navCtrl.back();
                return;
            }
            await this.printer.print(html, { orientation: 'portrait' }).then(() => { });
            this.navCtrl.back();
        }, 1000);
    }

    toHtml(key, afterFix = ':') {
        let text: string = this.translateService.instant(key);
        text = text ? text.split(' ').join('&nbsp;') : '';
        return text + afterFix;
    }

    numberArrays(start, end) {
        const arr = [];
        for (let i = start; i < end; i++) {
            arr.push(i);
        }
        return arr;
    }

    webPrint(body) {
        const mywindow = window.open('', 'PRINT', 'height=400,width=600');
        if (!mywindow || !mywindow.document) {
            return;
        }
        mywindow.document.write('<html><head><title>' + document.title + '</title>');
        mywindow.document.write('</head><body >');
        mywindow.document.write(body);
        mywindow.document.write('</body></html>');
        mywindow.document.close(); // necessary for IE >= 10
        mywindow.focus(); // necessary for IE >= 10*/
        setTimeout(() => {
            mywindow.print();
            mywindow.close();
        }, 500);
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
        const arr = [];
        for (const type of product.types) {
            const typeArr = [];
            for (const val of type.values) {
                if (!val.selected) {
                    continue;
                }
                if (!val.price) {
                    typeArr.push(val.title);
                }
            }
            if (typeArr && typeArr.length) {
                const vals = typeArr.join(', ');
                arr.push(type.title + ': ' + vals);
            }
        }
        return arr.join('; ');
    }
}
