import { IOrder } from '../../models/order.interface';
import { Component } from '@angular/core';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ExcelService } from '../../providers/excel.service';
import { StoreService } from '../../providers/store.service';
import { IStaff } from '../../models/staff.interface';
import { PlanService } from '../../providers/plan.service';
import { StaffService } from '../../providers/staff.service';
import { OrderService } from '../../providers/order.service';
import { IOrderItem } from '../../models/order-item.interface';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'order-multi-print',
    templateUrl: 'order-multi-print.component.html',
})
export class OrderMultiPrintComponent {
    params: any = null;
    orders: IOrder[];
    dateFrom = '';
    dateTo = '';
    orderStatusFilter = null;
    currency: string;
    isMobile = true;
    checkOrder = 0;
    currentPlan: any = null;
    isOnTrial = false;
    shop: any;
    store: any;
    checkStore: string;
    storeSelected: any;
    selectedStaff: IStaff = null;
    stores: any[];
    mode = 'print';
    totalProductsAmount = 0;
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
        private dataService: DataService,
        private analyticsService: AnalyticsService,
        private excelService: ExcelService,
        private planService: PlanService,
        private staffService: StaffService,
        private orderService: OrderService,
        private alertCtrl: AlertController,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-detail-print');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getCurrentCurrency();
        const store = await this.storeService.getCurrentStore();
        this.shop = store ? store : await this.dataService.getFirstObject('shop');
        this.isMobile = this.platform.width() < 720;
        this.currency = await this.userService.getCurrentCurrency();
        this.currentPlan = await this.planService.getCurrentPlan();
        this.printOrderLikeInvoice = await this.userService.getPrintOrderLikeInvoice();
        this.hideTax = await this.userService.getHideTax();
        this.orderInvoiceMaxEmptyRows = await this.userService.getOrderInvoiceMaxEmptyRows();
        this.hideDiscountColumn = await this.userService.getHideDiscountColumn();
        this.showStaffNameUnderSign = await this.userService.getShowStaffNameUnderSign();
        this.hideProductCodePrint = await this.userService.getHideProductCodePrint();
        this.stores = await this.storeService.getStores();
        this.selectedStaff = this.staffService.selectedStaff;
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.dateFrom = this.params.dateFrom;
            this.dateTo = this.params.dateTo;
            this.selectedStaff = this.params.selectedStaff;
            this.orderStatusFilter = this.params.orderStatusFilter;
            this.storeSelected = this.params.storeSelected;
        } 
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
            this.orderService.getOrders(this.selectedStaff ? this.selectedStaff.id : null, this.dateFrom, this.dateTo, 
                this.store ? this.store.id : (this.storeSelected && !this.storeSelected.isMainShop ? this.storeSelected.id : 0),
                this.orderStatusFilter).then(async (orders) => {
                const arr = [];
                if (orders && orders.length) {
                    for (const order of orders) {
                        order.items = JSON.parse(order.itemsJson);
                        order.store = !this.checkStore && order.storeId && this.stores && this.stores.length
                            ? this.stores.find(s => s.id === order.storeId)
                            : null;
                        const totalProductsAmount = order.items && order.items.length
                            ? _.sumBy(order.items, (item: IOrderItem) => item.total)
                            : 0;
                        order['totalProductsAmount'] = totalProductsAmount;
                        arr.push(order);
                    }
                }
                this.orders = arr;
                this.filter();
                await loading.dismiss();
                this.doPrintOrShare();
            }).catch(async () => {
                await loading.dismiss();
            });
    }

    filter(): void {
        let orders: IOrder[] = JSON.parse(JSON.stringify(this.orders));
        orders = this.sortByModifiedAt(orders);
        this.orders = orders;
    }

    sortByModifiedAt(orders: IOrder[]): IOrder[] {
        if (orders) {
            return _.orderBy(orders, ['createdAt'], ['desc']);
        }
        return null;
    }

    doPrintOrShare() {
        setTimeout(async () => {
            const target = document.getElementById('print-page');
            const html: any = target.innerHTML;
            if (this.mode !== 'print') {
                const fileName = 'orders.pdf';
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
