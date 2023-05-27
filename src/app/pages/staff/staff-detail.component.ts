import { IDebt } from '../../models/debt.interface';
import { DateRangeComponent } from '../shared/date-range.component';
import { ITrade } from '../../models/trade.interface';
import { INote } from '../../models/note.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { IStaff } from '../../models/staff.interface';
import { Staff } from '../../models/staff.model';
import { IOrder } from '../../models/order.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { StaffService } from '../../providers/staff.service';
import { TradeService } from '../../providers/trade.service';
import { OrderService } from '../../providers/order.service';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { ContactService } from '../../providers/contact.service';

@Component({
    selector: 'staff-detail',
    templateUrl: 'staff-detail.component.html',
})
export class StaffDetailComponent {
    params: any = null;
    id: number;
    staff: IStaff = new Staff();
    notes: INote[] = [];
    trades: ITrade[] = [];
    orders: IOrder[] = [];
    customerPrices: any[] = [];
    customerDiscounts: any[] = [];
    tab = 'order';
    dateFrom = '';
    dateTo = '';
    total = 0;
    currency: string;
    debts: IDebt[] = [];
    dateDebtFrom = '';
    dateDebtTo = '';
    totalDebt = 0;
    orderTotal = 0;
    dateOrderFrom = '';
    dateOrderTo = '';
    allStaffPermissions = {};
    permissionKeys = [];
    staffPermissionProps = {};
    typeOfPermissions = {};

    constructor(public navCtrl: RouteHelperService,
                public translateService: TranslateService,
                private modalCtrl: ModalController,
                private staffService: StaffService,
                private tradeService: TradeService,
                private file: File,
                private orderService: OrderService,
                private actionSheetCtrl: ActionSheetController,
                private userService: UserService,
                private excelService: ExcelService,
                private alertCtrl: AlertController,
                private contactService: ContactService,
                private toastCtrl: ToastController,
                private analyticsService: AnalyticsService,
    ) {
        this.permissionKeys = this.staffService.getPermissionsKey();
        this.staffPermissionProps = this.staffService.getAllStaffPermissionProps();
        this.typeOfPermissions = this.staffService.getAllTypesOfStaffPermissions();
        this.allStaffPermissions = this.staffService.getAllStaffPermissions();
        const reloadStaffHandle = (event) => {
            const staff = event.detail;
            if (staff && this.staff && staff.id === this.staff.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadStaff', reloadStaffHandle);
        this.navCtrl.subscribe('reloadStaff', reloadStaffHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('staff-detail');
    }

    selectOrder(id: number): void {
        this.navCtrl.push('/order/detail', { id });
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            if (this.params.tab && this.params.tab != '') {
                this.tab = this.params.tab;
            }
            this.staffService.get(id).then(async (staff) => {
                await loading.dismiss();
                this.staff = staff;
                // this.dateFrom = '';
                // this.dateTo = '';
                if (this.params.dateFrom) {
                    this.dateFrom = this.params.dateFrom;
                } else {
                    this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
                }
                if (this.params.dateTo) {
                    this.dateTo = this.params.dateTo;
                } else {
                    this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
                }
                this.tradeService.getTradesByStaff(staff.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                    if (trades && trades.length > 0) {
                        trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                    }
                    this.trades = trades;
                    this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                });

                this.dateOrderFrom = '';
                this.dateOrderTo = '';
                if (this.params.dateOrderFrom) {
                    this.dateOrderFrom = this.params.dateOrderFrom;
                } else {
                    this.dateOrderFrom = DateTimeService.GetFirstDateOfMonth();
                }
                if (this.params.dateOrderTo) {
                    this.dateOrderTo = this.params.dateOrderTo;
                } else {
                    this.dateOrderTo = DateTimeService.GetEndDateOfMonth();
                }
                this.orderService.getOrdersByStaff(staff.id, this.dateOrderFrom, this.dateOrderTo).then((orders: IOrder[]) => {
                    if (orders && orders.length > 0) {
                        orders = _.orderBy(orders, ['modifiedAt'], ['desc']);
                    }
                    this.orders = orders;
                    this.orderTotal = _.sumBy(this.orders, (item: IOrder) => item.total);
                });

                this.contactService.getCustomerPricesByStaff(staff.id).then((customerPrices: any[]) => {
                    if (customerPrices && customerPrices.length > 0) {
                        customerPrices = _.orderBy(customerPrices, ['product.title'], ['asc']);
                    }
                    this.customerPrices = customerPrices;
                });

                this.contactService.getCustomerDiscountsByStaff(staff.id).then((customerDiscounts: any[]) => {
                    if (customerDiscounts && customerDiscounts.length > 0) {
                        customerDiscounts = _.orderBy(customerDiscounts, ['createdAt'], ['desc']);
                    }
                    this.customerDiscounts = customerDiscounts;
                });
            });
        } else {
            await loading.dismiss();
        }
    }

    ngOnInit(): void {
        this.reload();
    }

    edit(): void {
        this.navCtrl.push('/staff/add', { id: this.staff.id });
    }

    staffImageOrPlaceholder(): string {
        return this.staff.avatarUrl !== null && this.staff.avatarUrl !== ''
            ? this.staff.avatarUrl
            : 'assets/person-placeholder.jpg';
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    openEmail(): void {
        Helper.sendEmail(this.staff.userName);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        Helper.callPhone(this.staff.userName);
    }

    text(): void {
        Helper.sendSms(this.staff.userName);
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id });
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('staff-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.staffService.deleteStaff(this.staff).then(async () => {
                            this.analyticsService.logEvent('staff-detail-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadStaffList');
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

    async presentActionSheet() {
        const buttons = [
            {
                text: this.translateService.instant('export.export-trade'),
                handler: () => {
                    this.exportTradeToExcel();
                }
            },
            {
                text: this.translateService.instant('staff-detail.delete'),
                role: 'destructive',
                handler: () => {
                    this.delete();
                }
            },
            {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel',
                handler: () => {
                }
            }
        ];
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        await actionSheet.present();
    }

    exportTradeToExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.customer-transaction-report')]);
        data.push([
            this.translateService.instant('export.staff') + ': ' +
            this.staff.name
        ]);

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
            this.translateService.instant('export.staff'),
            this.translateService.instant('export.contact'),
            this.translateService.instant('export.product'),
            this.translateService.instant('export.product-count'),
            this.translateService.instant('export.money'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const trade of this.trades) {
            data.push([
                trade.staffId != 0 && trade.staff ? trade.staff.name : '',
                trade.contactId != 0 && trade.contact ? trade.contact.fullName : '',
                trade.productId != 0 && trade.product ? Helper.productName(trade.product.code, trade.product.title) : '',
                trade.productId != 0 && trade.product && trade.isPurchase
                    ? trade.productCount ? trade.productCount : 0
                    : ' ',
                trade.isReceived ? trade.value : -1 * trade.value,
                this.currency,
                this.dateFormat(trade.createdAt)
            ]);
        }
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'staff-transations-' + this.staff.id + '-' + Helper.getCurrentDate() + '.xlsx';
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

    async selectDateRangeForTrade(): Promise<void> {
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
            this.tradeService.getTradesByStaff(this.staff.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });
        }
    }

    async selectDateRangeForOrder(): Promise<void> {
        const modal = await this.modalCtrl.create({component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateOrderFrom, dateToInput: this.dateOrderTo }});
        await modal.present();
        const {data} = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom != '') {
                this.dateOrderFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateOrderFrom = '';
            }
            if (data.dateTo != '') {
                this.dateOrderTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateOrderTo = '';
            }
            this.orderService.getOrdersByStaff(this.staff.id, this.dateOrderFrom, this.dateOrderTo).then((orders: IOrder[]) => {
                if (orders && orders.length > 0) {
                    orders = _.orderBy(orders, ['modifiedAt'], ['desc']);
                }
                this.orders = orders;
                this.orderTotal = _.sumBy(this.orders, (item: IOrder) => item.total);
            });
        }
    }

    addPrice() {
        this.navCtrl.push('/contact/add-price', { collaborator: this.staff.id });
    }

    selectCustomerPrice(id) {
        this.navCtrl.push('/contact/add-price', { id });
    }

    async autoSave() {
        const loading = await this.navCtrl.loading();
        this.staffService.saveStaff(this.staff).then(async () => {
            this.analyticsService.logEvent('staff-add-save-success');
            const mess1 = this.translateService.instant('staff-detail.saved-alert');
            this.presentToast(mess1);
            await loading.dismiss();
        });
    }

    async presentToast(message: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'bottom'
        });
        await toast.present();
    }

    addDiscount() {
        this.navCtrl.push('/contact/add-discount', { staff: this.staff.id });
    }

    selectCustomerDiscount(id) {
        this.navCtrl.push('/contact/add-discount', { id });
    }
}
