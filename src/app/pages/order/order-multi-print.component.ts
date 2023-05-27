import { IOrder } from '../../models/order.interface';
import { Component } from '@angular/core';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
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
    ordersInput: IOrder[];
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
    totalProductsQuantity = 0;
    printOrderLikeInvoice = false;
    hideTax = false;
    orderInvoiceMaxEmptyRows = 10;
    hideDiscountColumn = true;
    showStaffNameUnderSign = false;
    showStaffPhone = false;
    hideProductCodePrint = true;
    orderPrintNote = '';

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
        this.currency = await this.userService.getAttr('current-currency');
        const store = await this.storeService.getCurrentStore();
        this.shop = store ? store : await this.dataService.getFirstObject('shop');
        this.isMobile = this.platform.width() < 720;
        this.currentPlan = await this.planService.getCurrentPlan();
        this.printOrderLikeInvoice = await this.userService.getAttr('print-order-like-invoice');
        this.hideTax = await this.userService.getAttr('hide-tax');
        this.orderInvoiceMaxEmptyRows = await this.userService.getAttr('order-invoice-max-empty-rows');
        this.hideDiscountColumn = await this.userService.getAttr('hide-discount-column');
        this.orderPrintNote = await this.userService.getAttr('order-print-note');
        this.showStaffNameUnderSign = await this.userService.getAttr('show-staff-name-under-sign');
        this.hideProductCodePrint = await this.userService.getAttr('hide-product-code-print');
        this.showStaffPhone = await this.userService.getAttr('show-staff-phone');
        this.stores = await this.storeService.getStores();
        this.selectedStaff = this.staffService.selectedStaff;
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.dateFrom = this.params.dateFrom;
            this.dateTo = this.params.dateTo;
            this.selectedStaff = this.params.selectedStaff;
            this.orderStatusFilter = this.params.orderStatusFilter;
            this.storeSelected = this.params.storeSelected;
            this.ordersInput = this.params.ordersInput;
        }
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        if (this.ordersInput && this.ordersInput.length) {
            const orders = JSON.parse(JSON.stringify(this.ordersInput));
            const arr = [];
            for (const order of orders) {
                order.items = JSON.parse(order.itemsJson);
                order.store = !this.checkStore && order.storeId && this.stores && this.stores.length
                    ? this.stores.find(s => s.id === order.storeId)
                    : null;
                const totalProductsAmount = order.items && order.items.length
                    ? _.sumBy(order.items, (item: IOrderItem) => item.total)
                    : 0;
                const totalProductsQuantity = order.items && order.items.length
                    ? _.sumBy(order.items, (item: IOrderItem) => item.count)
                    : 0;
                order['totalProductsAmount'] = totalProductsAmount;
                order['totalProductsQuantity'] = totalProductsQuantity;
                arr.push(order);
            }
            this.orders = arr;
            this.filter();
            await loading.dismiss();
            this.doPrintOrShare();
            return;
        }
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
                        const totalProductsQuantity = order.items && order.items.length
                            ? _.sumBy(order.items, (item: IOrderItem) => item.count)
                            : 0;
                        order['totalProductsAmount'] = totalProductsAmount;
                        order['totalProductsQuantity'] = totalProductsQuantity;
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
                await this.excelService.downloadPdf(fileName, html).then(async (url) => {
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
}
