import { IDebt } from './../../models/debt.interface';
import { DateRangeComponent } from './../shared/date-range.component';
import { ITrade } from './../../models/trade.interface';
import { INote } from './../../models/note.interface';
import { Contact } from './../../models/contact.model';
import { IContact } from './../../models/contact.interface';
import { Component, ElementRef, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { IOrder } from '../../models/order.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ModalController, ActionSheetController, AlertController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ContactService } from '../../providers/contact.service';
import { NoteService } from '../../providers/note.service';
import { TradeService } from '../../providers/trade.service';
import { OrderService } from '../../providers/order.service';
import { DebtService } from '../../providers/debt.service';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { StaffService } from '../../providers/staff.service';
import * as JsBarcode from 'JsBarcode';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { copyMessage } from '../../providers/helper';

@Component({
    selector: 'contact-detail',
    templateUrl: 'contact-detail.component.html',
})
export class ContactDetailComponent {
    @ViewChild('barcode', { static: false }) barcode: ElementRef;
    id: number;
    params: any = null;
    contact: IContact = new Contact();
    notes: INote[] = [];
    trades: ITrade[] = [];
    orders: IOrder[] = [];
    customerPrices: any[] = [];
    customerDiscounts: any[] = [];
    tab = 'info';
    dateOrderFrom = '';
    dateFrom = '';
    dateOrderTo = '';
    dateTo = '';
    total = 0;
    orderTotal = 0;
    currency: string;
    debts: IDebt[] = [];
    dateDebtFrom = '';
    dateDebtTo = '';
    totalDebt = 0;
    isShowBarcode = false;
    barcode64base: any;

    constructor(public navCtrl: RouteHelperService,
        private printer: Printer,
        public staffService: StaffService,
        public translateService: TranslateService,
        private modalCtrl: ModalController,
        private contactService: ContactService,
        private noteService: NoteService,
        private tradeService: TradeService,
        private orderService: OrderService,
        private debtService: DebtService,
        private actionSheetCtrl: ActionSheetController,
        private userService: UserService,
        private excelService: ExcelService,
        private file: File,
        private alertCtrl: AlertController,
        private platform: Platform,
        private toastController: ToastController,
        private analyticsService: AnalyticsService
    ) {
        const reloadContactHandle = (event) => {
            const contact = event.detail;
            if (contact && this.contact && contact.id === this.contact.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadContact', reloadContactHandle);
        this.navCtrl.subscribe('reloadContact', reloadContactHandle);

        const reloadContactTradeHandle = (event) => {
            const contactId = event.detail;
            if (contactId === this.contact.id) {
                this.tab = 'trade';
            }
        };
        this.navCtrl.unsubscribe('reloadContactTrade', reloadContactTradeHandle);
        this.navCtrl.subscribe('reloadContactTrade', reloadContactTradeHandle);

        const reloadContactOrderHandle = (event) => {
            const contactId = event.detail;
            if (contactId === this.contact.id) {
                this.tab = 'order';
            }
        };
        this.navCtrl.unsubscribe('reloadContactOrder', reloadContactOrderHandle);
        this.navCtrl.subscribe('reloadContactOrder', reloadContactOrderHandle);

        const reloadContactDebtHandle = (event) => {
            const contactId = event.detail;
            if (contactId === this.contact.id) {
                this.tab = 'debt';
            }
        };
        this.navCtrl.unsubscribe('reloadContactDebt', reloadContactDebtHandle);
        this.navCtrl.subscribe('reloadContactDebt', reloadContactDebtHandle);

        const reloadContactNoteHandle = (event) => {
            const contactId = event.detail;
            if (contactId === this.contact.id) {
                this.tab = 'debt';
            }
        };
        this.navCtrl.unsubscribe('reloadContactNote', reloadContactNoteHandle);
        this.navCtrl.subscribe('reloadContactNote', reloadContactNoteHandle);

        const reloadContactPriceHandle = (event) => {
            const contactId = event.detail;
            if (contactId === this.contact.id) {
                this.tab = 'prices';
            }
        };
        this.navCtrl.unsubscribe('reloadContactPrice', reloadContactPriceHandle);
        this.navCtrl.subscribe('reloadContactPrice', reloadContactPriceHandle);

        const reloadContactDiscountHandle = (event) => {
            const contactId = event.detail;
            if (contactId === this.contact.id) {
                this.tab = 'discounts';
            }
        };
        this.navCtrl.unsubscribe('reloadContactDiscount', reloadContactDiscountHandle);
        this.navCtrl.subscribe('reloadContactDiscount', reloadContactDiscountHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-detail');
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            this.params = data;
            const id = data.id;
            if (data.tab && data.tab != '') {
                this.tab = data.tab;
            }
            const contact = await this.contactService.get(id);

            this.contact = contact;
            this.noteService.getNotesByContact(contact.id).then((notes: INote[]) => {
                if (notes && notes.length > 0) {
                    notes = _.orderBy(notes, ['modifiedAt'], ['desc']);
                }
                this.notes = notes;
            });
            if (data.dateFrom) {
                this.dateFrom = data.dateFrom;
            } else {
                this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
            }
            if (data.dateTo) {
                this.dateTo = data.dateTo;
            } else {
                this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
            }
            this.tradeService.getTradesByContact(contact.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });

            this.dateOrderFrom = '';
            this.dateOrderTo = '';
            if (data.dateOrderFrom) {
                this.dateOrderFrom = data.dateOrderFrom;
            } else {
                this.dateOrderFrom = DateTimeService.GetFirstDateOfMonth();
            }
            if (data.dateOrderTo) {
                this.dateOrderTo = data.dateOrderTo;
            } else {
                this.dateOrderTo = DateTimeService.GetEndDateOfMonth();
            }
            this.orderService.getOrdersByContact(contact.id, this.dateOrderFrom, this.dateOrderTo).then((orders: IOrder[]) => {
                if (orders && orders.length > 0) {
                    orders = _.orderBy(orders, ['modifiedAt'], ['desc']);
                }
                this.orders = orders;
                this.orderTotal = _.sumBy(this.orders, (item: IOrder) => item.total);
            });

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
            this.debtService.getDebtsByContact(contact.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                if (debts && debts.length > 0) {
                    debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                }
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
            });

            this.contactService.getCustomerPricesByContact(contact.id).then((customerPrices: any[]) => {
                if (customerPrices && customerPrices.length > 0) {
                    customerPrices = _.orderBy(customerPrices, ['createdAt'], ['desc']);
                }
                this.customerPrices = customerPrices;
            });

            this.contactService.getCustomerDiscountsByContact(contact.id).then((customerDiscounts: any[]) => {
                if (customerDiscounts && customerDiscounts.length > 0) {
                    customerDiscounts = _.orderBy(customerDiscounts, ['createdAt'], ['desc']);
                }
                this.customerDiscounts = customerDiscounts;
            });
        }
        setTimeout(() => {
            JsBarcode(this.barcode.nativeElement, this.contact.id.toString(),
                { displayValue: true, fontSize: 12.5, textMargin: 0, height: 50, margin: 3 });
            this.barcode64base = this.barcode.nativeElement.toDataURL('image/png');
        }, 1000);
        await loading.dismiss();
    }

    // tslint:disable-next-line: use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    edit(): void {
        this.navCtrl.push('/contact/add', { id: this.contact.id });
    }

    showEditPoint() {
        this.navCtrl.push('/contact/edit-point', { id: this.contact.id });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.contact.avatarUrl);
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
        Helper.sendEmail(this.contact.email);
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.contact.lastActive = DateTimeService.toDbString();
        this.contact.lastAction = action;
        return this.contactService.saveContact(this.contact).then((result) => {
            this.navCtrl.publish('reloadContactList', null);
            this.navCtrl.publish('reloadContact', this.contact);
            return result;
        });
    }

    selectNote(id: number): void {
        this.navCtrl.push('/note/detail', { id });
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id });
    }

    selectOrder(id: number): void {
        this.navCtrl.push('/order/detail', { id });
    }

    selectDebt(id: number): void {
        this.navCtrl.push('/debt/detail', { id });
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('contact-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.contactService.deleteContact(this.contact).then(async () => {
                            this.analyticsService.logEvent('contact-detail-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadContactList', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    addNote(): void {
        this.navCtrl.push('/note/add', { contact: this.contact.id });
    }

    addTrade(): void {
        this.navCtrl.push('/trade/add', { contact: this.contact.id });
    }

    addOrder(): void {
        this.navCtrl.push('/order/add', { contact: this.contact.id });
    }

    addDebt(): void {
        this.navCtrl.push('/debt/add', { contact: this.contact.id });
    }

    async presentActionSheet() {
        const buttons = [

            {
                text: this.translateService.instant('contact.new-trade'),
                handler: () => {
                    this.addTrade();
                }
            },
            {
                text: this.translateService.instant('export.export-trade'),
                handler: () => {
                    this.exportTradeToExcel();
                }
            }, {
                text: this.translateService.instant('contact.new-debts'),
                handler: () => {
                    this.addDebt();
                }
            }, {
                text: this.translateService.instant('contact.new-order'),
                handler: () => {
                    this.addOrder();
                }
            }, {
                text: this.translateService.instant('contact-detail.delete'),
                role: 'destructive',
                handler: () => {
                    this.delete();
                }
            }, {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel',
                handler: () => {
                }
            }
        ];
        buttons.push(
            {
                text: this.translateService.instant('contact.new-note'),
                handler: () => {
                    this.addNote();
                }
            }
        );
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
            this.translateService.instant('export.contact') + ': ' +
            this.contact.fullName
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
            this.translateService.instant('export.contact'),
            this.translateService.instant('export.product'),
            this.translateService.instant('export.product-count'),
            this.translateService.instant('export.money'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const trade of this.trades) {
            data.push([
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
        const fileName = 'customer-transations-' + this.contact.id + '-' + Helper.getCurrentDate() + '.xlsx';
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
            this.tradeService.getTradesByContact(this.contact.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });
        }
    }

    async selectDateRangeForOrder(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateOrderFrom, dateToInput: this.dateOrderTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
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
            this.orderService.getOrdersByContact(this.contact.id, this.dateOrderFrom, this.dateOrderTo).then((orders: IOrder[]) => {
                if (orders && orders.length > 0) {
                    orders = _.orderBy(orders, ['modifiedAt'], ['desc']);
                }
                this.orders = orders;
                this.orderTotal = _.sumBy(this.orders, (item: IOrder) => item.total);
            });
        }
    }

    async selectDateRangeForDebt(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateDebtFrom, dateToInput: this.dateDebtTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom != '') {
                this.dateDebtFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateDebtFrom = '';
            }
            if (data.dateTo != '') {
                this.dateDebtTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateDebtTo = '';
            }
            this.debtService.getDebtsByContact(this.contact.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                if (debts && debts.length > 0) {
                    debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                }
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
            });
        }
    }

    addPrice() {
        this.navCtrl.push('/contact/add-price', { contact: this.contact.id });
    }

    selectCustomerPrice(id) {
        this.navCtrl.push('/contact/add-price', { id });
    }

    addDiscount() {
        this.navCtrl.push('/contact/add-discount', { contact: this.contact.id });
    }

    selectCustomerDiscount(id) {
        this.navCtrl.push('/contact/add-discount', { id });
    }

    showBarcode() {
        this.isShowBarcode = !this.isShowBarcode;
    }

    printBarcode(): void {
        const html = `<div style='text-align: center;'><img src='${this.barcode64base}'/></div>`;

        if (this.navCtrl.isNotCordova()) {
            Helper.webPrint(html);
            return;
        }
        this.printer.print(html).then(() => { });
    }

    async copy(val) {
        if (this.isCordova()) {
            return this.share(val);
        }
        await copyMessage(val);
        const message = this.translateService.instant('request-pro.copied') + val;
        const toast = await this.toastController.create({
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
