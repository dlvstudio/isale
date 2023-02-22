import { Trade } from './../../models/trade.model';
import { IOrder } from './../../models/order.interface';
import { IContact } from './../../models/contact.interface';
import { Component } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Order } from '../../models/order.model';
import { DateRangeComponent } from '../shared/date-range.component';
import { IDebt } from '../../models/debt.interface';
import { ModalController, ActionSheetController, AlertController, ToastController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { OrderService } from '../../providers/order.service';
import { TradeService } from '../../providers/trade.service';
import { DebtService } from '../../providers/debt.service';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ContactService } from '../../providers/contact.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TableSearchComponent } from '../shop-table/search-shop-table.component';
import { ProductService } from '../../providers/product.service';
import { IOrderItem } from '../../models/order-item.interface';
import { StorageService } from '../../providers/storage.service';
import { StaffService } from '../../providers/staff.service';
import { copyMessage } from '../../providers/helper';

@Component({
    selector: 'order-detail',
    templateUrl: 'order-detail.component.html',
})
export class OrderDetailComponent {
    params: any = null;
    originalDebts: IDebt[];
    contactSelected: IContact;
    order: IOrder = new Order();
    currency: string;
    isDisabled = false;
    tab = 'info';
    debts: IDebt[] = [];
    dateDebtFrom = '';
    dateDebtTo = '';
    totalDebt = 0;
    totalDebtPaid = 0;
    hideTax = false;
    totalProductsAmount = 0;
    totalProductsQuantity = 0;
    lang = 'vn';

    constructor(
        public navCtrl: RouteHelperService,
        private file: File,
        private modalCtrl: ModalController,
        public translateService: TranslateService,
        private orderService: OrderService,
        private tradeService: TradeService,
        private contactService: ContactService,
        private debtService: DebtService,
        private userService: UserService,
        private staffService: StaffService,
        private actionSheetCtrl: ActionSheetController,
        private excelService: ExcelService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private toastCtrl: ToastController,
        private storage: StorageService,
        private platform: Platform,
        private productService: ProductService,
    ) {
        this.navCtrl.removeEventListener('reloadOrder', this.onLoadOrder);
        this.navCtrl.addEventListener('reloadOrder', this.onLoadOrder);
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 'p' || event.key === 'P') {
            this.printOrder();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    onLoadOrder = (event) => {
        const order: IOrder = event.detail;
        if (this.order && order.id === this.order.id) {
            this.reload();
        }
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-detail');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    async selectDateRangeForDebt(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateDebtFrom, dateToInput: this.dateDebtTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom !== '') {
                this.dateDebtFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateDebtFrom = '';
            }
            if (data.dateTo !== '') {
                this.dateDebtTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateDebtTo = '';
            }
            this.debtService.getDebtsByOrder(this.order.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                if (debts && debts.length > 0) {
                    debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                }
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
                this.totalDebtPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
            });
        }
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getCurrentCurrency();
        this.hideTax = await this.userService.getHideTax();
        this.order = new Order();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            const id = data.id;
            this.orderService.get(id).then(async (order) => {
                await loading.dismiss();
                this.order = order;
                this.order.items = order && order.itemsJson ? JSON.parse(order.itemsJson) : [];
                this.totalProductsAmount = this.order.items && this.order.items.length
                    ? _.sumBy(this.order.items, (item: IOrderItem) => item.total)
                    : 0;
                this.totalProductsQuantity = this.order.items && this.order.items.length
                    ? _.sumBy(this.order.items, (item: IOrderItem) => item.count)
                    : 0;
                this.dateDebtFrom = '';
                this.dateDebtTo = '';
                if (data.dateDebtFrom) {
                    this.dateDebtFrom = data.dateDebtFrom;
                } else {
                    this.dateDebtFrom = DateTimeService.GetFirstDateOfMonth();
                }
                if (data.dateDebtTo) {
                    this.dateDebtTo = data.dateDebtTo;
                } else {
                    this.dateDebtTo = DateTimeService.GetEndDateOfMonth();
                }
                this.debtService.getDebtsByOrder(order.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                    this.originalDebts = JSON.parse(JSON.stringify(debts));
                    if (debts && debts.length > 0) {
                        debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                    }
                    this.debts = debts;
                    this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
                    this.totalDebtPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
                });
            });
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.order.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.order.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.order.contact.lastActive = DateTimeService.toDbString();
        this.order.contact.lastAction = action;
        return this.contactService.saveContact(this.order.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.order.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.order.contact.avatarUrl);
    }

    dateFormat(date: string): string {
        let dateChanged = date;
        if (date.indexOf(':00Z') < 0 ) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.navigateForward('/order/add', { id: this.order.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('order.delete-order'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteOrder();
                    }
                }, {
                    text: this.translateService.instant('order-detail.share'),
                    handler: () => {
                        this.shareOrder();
                    }
                }, {
                    text: this.translateService.instant('order.copy'),
                    handler: () => {
                        this.copyOrder();
                    }
                }, {
                    text: this.translateService.instant('order-detail.print'),
                    handler: () => {
                        this.printOrder();
                    }
                }, {
                    text: this.translateService.instant('order-detail.export'),
                    handler: () => {
                        this.exportOrder();
                    }
                }, {
                    text: this.translateService.instant('order-detail.add-debt'),
                    handler: () => {
                        this.addDebt();
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
            message: this.translateService.instant('order.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.deleteRelated();
                        this.orderService.deleteOrder(this.order).then(async () => {
                            this.analyticsService.logEvent('order-detail-delete-success');
                            this.navCtrl.publish('reloadOrderList');
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

    async deleteRelated() {
        const arr: Promise<any>[] = [];
        const tradesToDelete = await this.tradeService.getTradesByOrder(this.order.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }

        const productNotesToDelete = await this.productService.getNotesByOrder(this.order.id);
        for (const item of productNotesToDelete) {
            arr.push(this.productService.deleteProductNote(item));
        }
        await Promise.all(arr);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    shareOrder(): void {
        this.navCtrl.push('/order/detail-print', { order: this.order, mode: 'share' });
    }

    copyOrder(): void {
        this.navCtrl.push('/order/add', { order: this.order, mode: 'copy' });
    }

    async printOrder(): Promise<void> {
        const noRepeat = await this.storage.get('print-alert-no-repeat');
        if (!noRepeat || noRepeat === '0') {
            this.navCtrl.push('/order/print-alert', { order: this.order });
            return;
        }
        this.navCtrl.push('/order/detail-print', { order: this.order, mode: 'print' });
    }

    exportOrder(): void {
        const data = [];
        data.push([this.translateService.instant('order-detail.title')]);
        data.push([this.translateService.instant('order-add.order-code'), '#' + this.order.orderCode]);
        let status = '';
        if (this.order.status === 0) {
            status = this.translateService.instant('order-detail.status-draft');
        } else if (this.order.status === 1) {
            status = this.translateService.instant('order-detail.status-inprogress');
        } else if (this.order.status === 2) {
            status = this.translateService.instant('order-detail.status-shipping');
        } else if (this.order.status === 3) {
            status = this.translateService.instant('order-detail.status-done');
        } else if (this.order.status === 4) {
            status = this.translateService.instant('order-detail.status-cancel');
        }
        data.push([this.translateService.instant('order-detail.status'), status]);
        if (this.order.contactId !== 0 && this.order.contact && this.order.contact.fullName) {
            data.push([this.translateService.instant('contact-add.full-name'), this.order.contact.fullName]);
        }
        if (this.order.contactId !== 0 && this.order.contact && this.order.contact.mobile) {
            data.push([this.translateService.instant('contact-add.phone'), this.order.contact.mobile]);
        }
        if (this.order.contactId === 0 && this.order.contactName) {
            data.push([this.translateService.instant('contact-add.full-name'), this.order.contactName]);
        }
        if (this.order.contactId === 0 && this.order.contactPhone) {
            data.push([this.translateService.instant('contact-add.phone'), this.order.contactPhone]);
        }
        data.push([' ']);
        data.push([
            this.translateService.instant('order-add.product-code'),
            this.translateService.instant('order-add.product-name'),
            this.translateService.instant('order-add.product-count'),
            this.translateService.instant('order-add.product-unit'),
            this.translateService.instant('order-add.product-price'),
            this.translateService.instant('order-add.product-discount') + ' (' + this.currency + ')',
            this.translateService.instant('order-add.product-total') + ' (' + this.currency + ')'
        ]);

        for (const item of this.order.items) {
            data.push([
                item.productCode,
                item.productName,
                item.count,
                item.unit,
                item.price,
                item.discount,
                item.total
            ]);
        }
        data.push([' ']);
        data.push([this.translateService.instant('order-add.net-value') + ' (' + this.currency + ')', this.order.netValue]);
        data.push([this.translateService.instant('order-add.shipping-fee') + ' (' + this.currency + ')', this.order.shippingFee]);
        data.push([this.translateService.instant('order-add.tax') + ' (' + this.currency + ')', this.order.tax]);
        data.push([this.translateService.instant('order-add.total') + ' (' + this.currency + ')', this.order.total]);
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'order-detail-' + this.order.orderCode + '-' + Helper.getCurrentDate() + '.xlsx';
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

    addDebt(): void {
        this.navCtrl.navigateForward('/debt/add', { order: this.order.id });
    }

    changeStatus(): void {
        this.isDisabled = true;
        this.orderService.saveOrder(this.order).then(async () => {
            this.isDisabled = false;
            await this.createTransactions();
            this.navCtrl.publish('reloadOrderList');
        });
    }

    async createTransactions(): Promise<void> {
        if (this.order.paid === 0) {
            return;
        }

        if (this.order.paid === null && this.order.status !== 3) {
            return;
        }

        let staffId = 0;
        if (this.staffService.isStaff()) {
            staffId = this.staffService.selectedStaff.id;
        }
        const arr = [];
        const tradesToDelete = await this.tradeService.getTradesByOrder(this.order.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }
        const change = this.order.change ? (+this.order.change) : 0;
        const trade = new Trade();
        trade.contactId = this.order.contactId;
        trade.staffId = staffId;
        trade.isPurchase = true;
        trade.isReceived = true;
        trade.value = this.order.paid !== null ? (+this.order.paid - change) : this.order.total;
        trade.orderId = this.order.id;
        trade.moneyAccountId = this.order.moneyAccountId;
        trade.note = this.translateService.instant('order-add.order') + this.order.orderCode;
        trade.createdAt = this.order.createdAt;
        arr.push(this.tradeService.saveTrade(trade));

        await Promise.all(arr);
    }

    selectDebt(id: number): void {
        this.navCtrl.navigateForward('/debt/detail', { id });
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    async swapTable() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('order-detail.swap-table-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.selectTableToSwap();
                    }
                },
            ]
        });
        await confirm.present();
    }

    async selectTableToSwap() {
        const modal = await this.modalCtrl.create({
            component: TableSearchComponent
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (!data) {
            return;
        }
        this.order.tableId = data.id;
        this.order.table = data;
        const loading = await this.navCtrl.loading();
        this.orderService.saveOrder(this.order).then(async () => {
            await loading.dismiss();
            this.navCtrl.publish('reloadOrderList');
            this.navCtrl.publish('reloadTableList');
            this.navCtrl.publish('reloadTable', { id: this.order.tableId });
            this.presentToast(this.translateService.instant('order-detail.swap-table-success',
                {
                    table: data.name + (data.position ? ' -' + data.position : '')
                }));
        });
    }

    async presentToast(message) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'top'
        });
        await toast.present();
    }

    async finish() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('order-detail.finish-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.doFinish();
                    }
                },
            ]
        });
        await confirm.present();
    }

    async doFinish() {
        this.order.status = 3;
        const loading = await this.navCtrl.loading();
        this.orderService.saveOrder(this.order).then(async () => {
            await loading.dismiss();
            this.navCtrl.publish('reloadOrderList');
            this.navCtrl.publish('reloadTableList');
            this.navCtrl.publish('reloadTable', { id: this.order.tableId });
            await this.navCtrl.back();
        });
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

    async copy(val) {
        if (this.isCordova()) {
            return this.share(val);
        }
        await copyMessage(val);
        const message = this.translateService.instant('request-pro.copied') + val;
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'bottom'
        });
        await toast.present();
    }

    isCordova(): boolean {
        return this.platform.is('capacitor') || this.platform.is('cordova');
    }

    async share(mess) {
        await this.userService.shareText(mess);
    }
}
