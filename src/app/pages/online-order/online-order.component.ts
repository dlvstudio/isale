import { IOrder } from '../../models/order.interface';
import { Component, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Platform, ActionSheetController, AlertController, IonContent } from '@ionic/angular';
import { OrderService } from '../../providers/order.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ProductService } from '../../providers/product.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { IProduct } from '../../models/product.interface';
import { PlanService } from '../../providers/plan.service';
import { DataService } from '../../providers/data.service';
import { StoreService } from '../../providers/store.service';
import { IStaff } from '../../models/staff.interface';
import { StaffService } from '../../providers/staff.service';
import { TradeService } from '../../providers/trade.service';

@Component({
    selector: 'online-order',
    templateUrl: 'online-order.component.html'
})
export class OnlineOrderComponent {
    @ViewChild(IonContent, {static: true}) content: IonContent;
    storeSelected: any;
    params: any = null;
    originalOrders: IOrder[];
    orders: IOrder[];
    searchKey = '';
    noteFilter = 'frequency';
    total = 0;
    dateFrom = '';
    dateTo = '';
    orderStatusFilter = null;
    currency: string;
    checkStore: string;
    selectedStaff: IStaff = null;
    stores: any[];
    start = 0;
    pageSize = 40;
    end = 39;
    currentPage = 0;
    isMobile = true;
    checkOrder = 0;
    store: any;

    constructor(
        private platform: Platform,
        private orderService: OrderService,
        public translateService: TranslateService,
        private userService: UserService,
        private productService: ProductService,
        private excelService: ExcelService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private file: File,
        private storeService: StoreService,
        private dataService: DataService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        private planService: PlanService,
        public staffService: StaffService,
        private tradeService: TradeService,
    ) {
        this.navCtrl.removeEventListener('reloadOnlineOrderList', this.reload);
        this.navCtrl.addEventListener('reloadOnlineOrderList', this.reload);
    }

    // tslint:disable-next-line: use-lifecycle-interface
    ngOnInit(): void {
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order');
    }

    async onPeriodChanged(data: any): Promise<void> {
        if (data) {
            this.analyticsService.logEvent('order-period-changed');
            const loading = await this.navCtrl.loading();
            this.start = 0;
            this.end = this.pageSize - 1;
            this.currentPage = 0;
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
            this.selectedStaff = data.selectedStaff;
            this.storeSelected = data.storeSelected;
            this.orderStatusFilter = data.orderStatus;

            if (!this.params) {
                this.params = {};
            }
            this.params.dateFrom = this.dateFrom;
            this.params.dateTo = this.dateTo;
            this.orderService.getOnlineOrders(this.dateFrom, this.dateTo, this.orderStatusFilter == -1 ? null : this.orderStatusFilter).then(async (orders) => {
                const arr = [];
                if (orders && orders.length) {
                    for (const order of orders) {
                        order.items = JSON.parse(order.itemsJson);
                        order.store = !this.checkStore && order.storeId && this.stores && this.stores.length
                            ? this.stores.find(s => s.id === order.storeId)
                            : null;
                        arr.push(order);
                    }
                }
                this.originalOrders = JSON.parse(JSON.stringify(arr));
                this.orders = arr;
                this.total = _.sumBy(this.orders, (item: IOrder) => item.total);
                this.filter();
                await loading.dismiss();
            });
        }
    }

    exportToExcel(): void {
        this.navCtrl.navigateForward('/order/export', { orders: this.orders, dateFrom: this.dateFrom, dateTo: this.dateTo });
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.isMobile = this.platform.width() < 720;
        this.currency = await this.userService.getAttr('current-currency');
        this.stores = await this.storeService.getStores();
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
        if (this.params && this.params.selectedStaff) {
            this.selectedStaff = this.params.selectedStaff;
        }
        if (!this.params) {
            this.params = { dateFrom: this.dateFrom, dateTo: this.dateTo, selectedStaff: null };
        }
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.orderService.getOnlineOrders(this.dateFrom, this.dateTo, this.orderStatusFilter == -1 ? null : this.orderStatusFilter).then(async (orders) => {
            const arr = [];
            if (orders && orders.length) {
                for (const order of orders) {
                    order.items = JSON.parse(order.itemsJson);
                    order.store = !this.checkStore && order.storeId && this.stores && this.stores.length
                        ? this.stores.find(s => s.id === order.storeId)
                        : null;
                    arr.push(order);
                }
            }
            this.originalOrders = JSON.parse(JSON.stringify(arr));
            this.orders = arr;
            this.total = _.sumBy(this.orders, (item: IOrder) => item.total);
            this.filter();
            await loading.dismiss();
        }).catch(async () => {
            await loading.dismiss();
        });
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('order-search');
        let orders: IOrder[] = JSON.parse(JSON.stringify(this.originalOrders));
        if (this.searchKey !== null && this.searchKey !== '') {
            this.start = 0;
            this.end = this.pageSize - 1;
            this.currentPage = 0;
            const searchKey = this.searchKey.toLowerCase();
            orders = orders.filter((item) => (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contactName && item.contactName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.staff && item.staff.name.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.staff && item.staff.userName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.store && item.store.name && item.store.name.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contactPhone && item.contactPhone.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.note && item.note.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.orderCode && item.orderCode.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.hasShipInfo && item.billOfLadingCode && item.billOfLadingCode.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.hasShipInfo && item.shippingPartner && item.shippingPartner.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.hasShipInfo && item.shipperName && item.shipperName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.hasShipInfo && item.shipperPhone && item.shipperPhone.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.hasShipInfo && item.deliveryAddress && item.deliveryAddress.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.items && item.items.length
                        && item.items.filter(p => (p.productCode && p.productCode.toLowerCase().indexOf(searchKey) !== -1)
                                || (p.productName && p.productName.toLowerCase().indexOf(searchKey) !== -1)
                                || (p.note && p.note.toLowerCase().indexOf(searchKey) !== -1)).length > 0)
                    );
        }
        this.orders = orders;
        this.total = _.sumBy(this.orders, (item: IOrder) => item.total);
    }

    clearSearch() {
        this.start = 0;
        this.end = this.pageSize - 1;
        this.currentPage = 0;
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let orders: IOrder[] = JSON.parse(JSON.stringify(this.originalOrders));
        orders = this.sortByModifiedAt(orders);
        this.orders = orders;
    }

    sortByModifiedAt(orders: IOrder[]): IOrder[] {
        if (orders) {
            return _.orderBy(orders, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    selectOrder(id: number): void {
        this.navCtrl.navigateForward('/online-order/detail', { id });
    }

    async deleteOrder(order: IOrder): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('order.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.deleteRelated(order);
                        this.orderService.deleteOrder(order).then(async () => {
                            this.analyticsService.logEvent('order-delete-success');
                            let i = this.orders.findIndex(item => item.id === order.id);
                            if (i >= 0) {
                                this.orders.splice(i, 1);
                                this.total = _.sumBy(this.orders, (item: IOrder) => item.total);
                            }
                            i = this.originalOrders.findIndex(item => item.id === order.id);
                            if (i >= 0) {
                                this.originalOrders.splice(i, 1);
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

    async deleteRelated(order: IOrder) {
        const arr: Promise<any>[] = [];
        const tradesToDelete = await this.tradeService.getTradesByOrder(order.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }

        const productNotesToDelete = await this.productService.getNotesByOrder(order.id);
        for (const item of productNotesToDelete) {
            arr.push(this.productService.deleteProductNote(item));
        }
        await Promise.all(arr);
    }

    async presentOtherActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('export.export-to-excel'),
                    handler: () => {
                        this.exportExcel();
                    }
                }, {
                    text: this.translateService.instant('order.import-excel'),
                    handler: () => {
                        this.importExcel();
                    }
                }, {
                    text: this.translateService.instant('order.multi-print'),
                    handler: () => {
                        this.multiPrint();
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

    multiPrint() {
        this.navCtrl.push('/order/multi-print', {dateFrom: this.dateFrom, dateTo: this.dateTo, selectedStaff: this.selectedStaff, orderStatusFilter: this.orderStatusFilter});
    }

    importExcel() {
        this.navCtrl.push('/order/import');
    }

    exportExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.order-report')]);
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
            this.translateService.instant('export.order-code'),
            this.translateService.instant('export.contact'),
            this.translateService.instant('export.money'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const order of this.orders) {
            data.push([
                order.orderCode,
                order.contactId !== 0 && order.contact ? order.contact.fullName : '',
                order.total,
                this.currency,
                this.dateFormat(order.createdAt)
            ]);
        }
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'order-report-' + Helper.getCurrentDate() + '.xlsx';
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
        return DateTimeService.toUiLocalDateString(date);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    doEnteredBarcode = (barcode) => {
        if (!barcode) {
            return;
        }
        this.productService.searchByBarcode(barcode).then((product: IProduct) => {
            if (product) {
                this.analyticsService.logEvent('order-scan-barcode-ok');
                this.navCtrl.push('/order/add', { product: product.id });
                return;
            }
        });
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    requestProPlan() {
        this.navCtrl.push('/request-pro');
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
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

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    get isShowPaging() {
        if (this.orders && this.orders.length > this.pageSize) {
            return true;
        }
        return false;
    }

    previousPage() {
        if (this.currentPage <= 0) {
            this.currentPage = 0;
            return;
        }
        this.currentPage--;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.content.scrollToTop();
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.orders.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.content.scrollToTop();
    }
}
