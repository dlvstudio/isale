import { IOrder } from '../../models/order.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { Order } from '../../models/order.model';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { OrderService } from '../../providers/order.service';
import { UserService } from '../../providers/user.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { IOrderItem } from '../../models/order-item.interface';

@Component({
    selector: 'online-order-detail',
    templateUrl: 'online-order-detail.component.html',
})
export class OnlineOrderDetailComponent {
    params: any = null;
    order: any = {};
    currency: string;
    isDisabled = false;
    tab = 'info';
    hideTax = false;
    totalProductsAmount = 0;
    lang = 'vn';

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private orderService: OrderService,
        private userService: UserService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private toastCtrl: ToastController,
    ) {
        this.navCtrl.removeEventListener('reloadOnlineOrder', this.onLoadOrder);
        this.navCtrl.addEventListener('reloadOnlineOrder', this.onLoadOrder);
    }

    onLoadOrder = (event) => {
        const order: IOrder = event.detail;
        if (this.order && order.id === this.order.id) {
            this.reload();
        }
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('online-order-detail');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.hideTax = await this.userService.getAttr('hide-tax');
        this.order = new Order();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            const id = data.id;
            this.orderService.getOnlineOrder(id).then(async (order) => {
                await loading.dismiss();
                this.order = order;
                this.order.items = order && order.itemsJson ? JSON.parse(order.itemsJson) : [];
                this.totalProductsAmount = this.order.items && this.order.items.length
                    ? _.sumBy(this.order.items, (item: IOrderItem) => item.total)
                    : 0;
                if (this.order && this.order.convertedOrder) {
                    this.order.convertedOrder.items = this.order.convertedOrder && this.order.convertedOrder.itemsJson ? JSON.parse(this.order.convertedOrder.itemsJson) : [];
                }
            });
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    convert(): void {
        this.navCtrl.navigateForward('/order/add', { convert: this.order });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('online-order.delete-order'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteOrder();
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

    async deleteOrder(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('online-order.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        this.orderService.deleteOnlineOrder(this.order).then(async () => {
                            this.analyticsService.logEvent('online-order-detail-delete-success');
                            this.navCtrl.publish('reloadOnlineOrderList');
                            this.navCtrl.publish('reloadContact', this.order.contact);
                            this.navCtrl.back();
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

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    async presentToast(message) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'top'
        });
        await toast.present();
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

    getOptionPrices(orderItem: any) {
        return Helper.getOptionPrices(orderItem);
    }

    changeStatus(): void {
        this.isDisabled = true;
        this.orderService.saveOnlineOrder(this.order).then(async () => {
            this.isDisabled = false;
            this.navCtrl.publish('reloadOnlineOrderList');
        });
    }

    selectOrder(id: number): void {
        this.navCtrl.navigateForward('/order/detail', { id });
    }
}
