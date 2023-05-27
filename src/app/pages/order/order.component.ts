import { IOrder } from './../../models/order.interface';
import { Component, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Platform, ActionSheetController, AlertController, ModalController, IonContent, ToastController } from '@ionic/angular';
import { OrderService } from '../../providers/order.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ProductService } from '../../providers/product.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { PlanService } from '../../providers/plan.service';
import { DataService } from '../../providers/data.service';
import { StoreService } from '../../providers/store.service';
import { IStaff } from '../../models/staff.interface';
import { StaffService } from '../../providers/staff.service';
import { TradeService } from '../../providers/trade.service';

@Component({
    selector: 'order',
    templateUrl: 'order.component.html'
})
export class OrderComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    originalOrders: IOrder[];
    orders: IOrder[];
    searchKey = '';
    multiEditMode = false;
    noteFilter = 'frequency';
    total = 0;
    dateFrom = '';
    dateTo = '';
    orderStatusFilter = null;
    currency: string;
    isMobile = true;
    checkOrder = 0;
    currentPlan: any = null;
    isOnTrial = false;
    store: any;
    storeSelected: any;
    checkStore: string;
    selectedStaff: IStaff = null;
    stores: any[];
    start = 0;
    pageSize = 40;
    end = 39;
    currentPage = 0;
    selectMode = false;
    isSelectAll = false;
    getOrderNoDone = false;
    multiStatus = 0;
    selectedCount = 0;

    constructor(
        private platform: Platform,
        private orderService: OrderService,
        public translateService: TranslateService,
        private userService: UserService,
        private productService: ProductService,
        private barcodeScanner: BarcodeScanner,
        private excelService: ExcelService,
        private modalCtrl: ModalController,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private file: File,
        private storeService: StoreService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        private planService: PlanService,
        private toastCtrl: ToastController,
        public staffService: StaffService,
        private tradeService: TradeService,
    ) {
        this.navCtrl.removeEventListener('reloadOrderList', this.reload);
        this.navCtrl.addEventListener('reloadOrderList', this.reload);
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
                            if (this.getOrderNoDone && order.status === 3) {
                                continue;
                            }
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

    scanForOrder = async () => {
        this.analyticsService.logEvent('order-scan-for-search');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.analyticsService.logEvent('order-scan-for-scanned-web');
                this.doEnteredBarcode(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.analyticsService.logEvent('order-scan-for-scanned');
            this.doEnteredBarcode(barcodeData.text);
        }).catch((err) => {
            console.error(err);
        });
    }

    exportToExcel(): void {
        let orders = [];
        if (this.selectMode) {
            const ordersSelected = [];
            for (const order of this.orders) {
                if (order['isSelected']) {
                    ordersSelected.push(order);
                }
            }
            orders = ordersSelected;
            if (!orders || !orders.length) {
                alert(this.translateService.instant('order-detail.no-order-selected-alert'));
                return;
            }
        }
        this.navCtrl.navigateForward('/order/export', { orders, dateFrom: this.dateFrom, dateTo: this.dateTo });
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.isMobile = this.platform.width() < 720;
        this.currency = await this.userService.getAttr('current-currency');
        this.currentPlan = await this.planService.getCurrentPlan();
        this.stores = await this.storeService.getStores();
        this.selectedStaff = this.staffService.selectedStaff;
        this.getOrderNoDone = this.selectedStaff && (this.selectedStaff.updateStatusExceptDone && !this.selectedStaff.hasFullAccess);
        if (!this.currentPlan) {
            this.checkOrder = await this.planService.checkOrder();
            if (this.checkOrder >= 10) {
                this.isOnTrial = await this.planService.isOnTrial(this.currentPlan);
            }
        }
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
                        if (this.getOrderNoDone && order.status === 3) {
                            continue;
                        }
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

    openOrderAdd(): void {
        if (!this.currentPlan && this.checkOrder >= 10 && !this.isOnTrial) {
            this.analyticsService.logEvent('check-order-alert');
            alert(this.translateService.instant('order.check-order-alert', { total: this.checkOrder }));
            return;
        }
        this.navCtrl.navigateForward('/order/add', null);
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
        if (this.selectMode) {
            return;
        }
        this.navCtrl.navigateForward('/order/detail', { id });
    }

    copyOrder(order): void {
        this.navCtrl.push('/order/add', { order, mode: 'copy' });
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
                    text: this.translateService.instant('order.import-excel'),
                    handler: () => {
                        this.importExcel();
                    }
                }, {
                    text: this.translateService.instant('product-detail.multi-select'),
                    handler: () => {
                        this.selectMode = true;
                    }
                }, {
                    text: this.translateService.instant('order.multi-print'),
                    handler: () => {
                        this.multiPrint();
                    }
                }, {
                    text: this.translateService.instant('order.search-by-barcode'),
                    handler: () => {
                        this.scanForOrder();
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
        let orders = [];
        if (this.selectMode) {
            const ordersSelected = [];
            for (const order of this.orders) {
                if (order['isSelected']) {
                    ordersSelected.push(order);
                }
            }
            orders = ordersSelected;
            if (!orders || !orders.length) {
                alert(this.translateService.instant('order-detail.no-order-selected-alert'));
                return;
            }
        }
        this.navCtrl.push('/order/multi-print', { dateFrom: this.dateFrom, dateTo: this.dateTo, selectedStaff: this.selectedStaff, orderStatusFilter: this.orderStatusFilter, ordersInput: orders });
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
        let dateChanged = date;
        if (date.indexOf(':00Z') < 0) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    async presentActionSheet(order: IOrder) {
        let orderdate = order.createdAt;
        if (orderdate.indexOf(':00Z') < 0) {
            orderdate = moment(orderdate).format(DateTimeService.getDateTimeDbFormat());
        }
        const orderMoment = DateTimeService.getMoment(orderdate);
        const orderAdd1Hour = orderMoment.add(this.selectedStaff.hourLimit, 'hours').toDate();
        const isOwner = this.selectedStaff && this.selectedStaff.id === order.staffId;
        const isOwnerValidTime = this.selectedStaff && (this.selectedStaff.canCreateOrder && orderAdd1Hour >= moment().toDate() || this.selectedStaff.canUpdateDeleteOrder);
        const buttons = [];
        const shopOwner = !this.selectedStaff || this.selectedStaff.hasFullAccess;
        if (isOwner && isOwnerValidTime || shopOwner) {
            buttons.push(
                {
                    text: this.translateService.instant('order.delete-order'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteOrder(order);
                    }
                }
            );
        }
        buttons.push(...[
            {
                text: this.translateService.instant('order.edit-order'),
                handler: () => {
                    this.selectOrder(order.id);
                }
            }, {
                text: this.translateService.instant('order.copy'),
                handler: () => {
                    this.copyOrder(order);
                }
            }, {
                text: this.translateService.instant('product-detail.multi-select'),
                handler: () => {
                    this.selectMode = true;
                }
            }, {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel',
                handler: () => {
                }
            }
        ]);
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        await actionSheet.present();
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    doEnteredBarcode = (barcode) => {
        if (!barcode) {
            return;
        }
        this.orderService.getByCode(barcode).then((order: IOrder) => {
            if (order) {
                this.analyticsService.logEvent('order-scan-barcode-ok');
                this.navCtrl.push('/order/detail', { id: order.id });
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
            message: this.translateService.instant('store.exit-store-alert', { shop: this.store.name }),
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

    showSelect() {
        this.selectMode = true;
        this.isSelectAll = false;
    }

    exitSelectMode() {
        this.selectMode = false;
        this.isSelectAll = false;
        for (const order of this.orders) {
            order['isSelected'] = false;
        }
        this.orderSelectedChange();
    }

    async multiDelete() {
        const count = this.orders ? this.orders.filter(t => t['isSelected']).length : 0;
        if (count === 0) {
            alert(this.translateService.instant('order-detail.multi-delete-no-order-alert'));
            return;
        }
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('order-detail.multi-delete-alert', { count }),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const loading = await this.navCtrl.loading();
                        const ordersToDelete = [];
                        const arr = [];
                        for (const order of this.orders) {
                            if (order['isSelected']) {
                                ordersToDelete.push(order);
                                arr.push(this.orderService.deleteOrder(order));
                            }
                        }
                        await Promise.all(arr);
                        for (const product of ordersToDelete) {
                            this.analyticsService.logEvent('order-delete-success');
                            let i = this.orders.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.orders.splice(i, 1);
                            }
                            i = this.originalOrders.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.originalOrders.splice(i, 1);
                            }
                        }
                        this.selectMode = false;
                        await loading.dismiss();
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

    selectAll() {
        for (const product of this.orders) {
            product['isSelected'] = false;
        }
        for (let i = this.start; i < this.end; i++) {
            const product = this.orders[i];
            if (product) {
                product['isSelected'] = this.isSelectAll;
            }
        }
        this.orderSelectedChange();
    }

    multiEdit() {
        this.multiEditMode = !this.multiEditMode;
    }

    showHelpMultiEditForField() {
        alert(this.translateService.instant('order.multi-edit-field-apply-des'));
    }

    applyMultiEditForField(field = 'status') {
        const count = this.orders ? this.orders.filter(t => t['isSelected']).length : 0;
        if (count === 0) {
            alert(this.translateService.instant('order-detail.multi-delete-no-order-alert'));
            return;
        }
        for (const order of this.orders) {
            if (order['isSelected']) {
                order[field] = this.multiStatus;
            }
        }
    }

    revertValues() {
        let rowCount = 0
        for (const order of this.orders) {
            if (order['isSelected']) {
                const old = this.originalOrders.find(p => p.id === order.id);
                order.status = old.status;
                rowCount++;
            }
        }
        if (!rowCount) {
            alert(this.translateService.instant('common.no-selected-item-alert'));
            return;
        }
    }

    async saveMultiEdit() {
        const loading = await this.navCtrl.loading();
        let rowCount = 0
        for (const order of this.orders) {
            if (order['isSelected']) {
                const oldProduct = this.originalOrders.find(p => p.id === order.id);
                if (!oldProduct) {
                    continue;
                }
                await this.orderService.saveOrderStatus(order);
                rowCount++;
                oldProduct.status = order.status;
            }
        }
        if (!rowCount) {
            await loading.dismiss();
            alert(this.translateService.instant('common.no-selected-item-alert'));
            return;
        }
        await loading.dismiss();
        this.presentToast(this.translateService.instant('common.saved-item-alert', { count: rowCount }));
        this.multiStatus = 0;
    }

    async presentToast(message: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'bottom',
            color: 'danger'
        });
        await toast.present();
    }

    changeValue(order, field) {
        const oldProduct = this.originalOrders.find(p => p.id === order.id);
        if (!oldProduct) {
            return;
        }
        if (order[field] !== oldProduct[field] && !order['isSelected']) {
            order['isSelected'] = true;
            this.orderSelectedChange();
        }
    }

    orderSelectedChange() {
        let selectedCount = 0;
        for (const product of this.orders) {
            if (product['isSelected']) {
                selectedCount++;
            }
        }
        this.selectedCount = selectedCount;
    }
}
