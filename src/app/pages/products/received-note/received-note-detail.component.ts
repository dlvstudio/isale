import { Component } from '@angular/core';
import { IDebt } from '../../../models/debt.interface';
import { IContact } from '../../../models/contact.interface';
import { IReceivedNote } from '../../../models/received-note.interface';
import { ReceivedNote } from '../../../models/received-note.model';
import { DateRangeComponent } from '../../shared/date-range.component';
import { Trade } from '../../../models/trade.model';
import * as _ from 'lodash';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ReceivedNoteService } from '../../../providers/received-note.service';
import { TradeService } from '../../../providers/trade.service';
import { ContactService } from '../../../providers/contact.service';
import { DebtService } from '../../../providers/debt.service';
import { UserService } from '../../../providers/user.service';
import { ExcelService } from '../../../providers/excel.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { AnalyticsService } from '../../../providers/analytics.service';
import { ProductService } from '../../../providers/product.service';

@Component({
    selector: 'received-note-detail',
    templateUrl: 'received-note-detail.component.html',
})
export class ReceivedNoteDetailComponent {
    originalDebts: IDebt[];
    contactSelected: IContact;
    params: any = null;
    receivedNote: IReceivedNote = new ReceivedNote();
    currency: string;
    isDisabled = false;
    tab = 'info';
    debts: IDebt[] = [];
    dateDebtFrom = '';
    dateDebtTo = '';
    totalDebt = 0;
    totalDebtPaid = 0;
    totalProductsAmount = 0;

    constructor(
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        public translateService: TranslateService,
        private receivedNoteService: ReceivedNoteService,
        private tradeService: TradeService,
        private contactService: ContactService,
        private debtService: DebtService,
        private userService: UserService,
        private actionSheetCtrl: ActionSheetController,
        private excelService: ExcelService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private productService: ProductService
    ) {
        const reloadReceivedNoteHandle = (event) => {
            const receivedNote = event.detail;
            if (this.receivedNote && receivedNote.id === this.receivedNote.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadReceivedNote', reloadReceivedNoteHandle);
        this.navCtrl.subscribe('reloadReceivedNote', reloadReceivedNoteHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('received-note-detail');
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
            this.debtService.getDebtsByReceivedNote(this.receivedNote.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                if (debts && debts.length > 0) {
                    debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                }
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
                this.totalDebtPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
            });
        }
    }

    reload = async () => {
        this.currency = await this.userService.getAttr('current-currency');
        this.receivedNote = new ReceivedNote();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            const id = data.id;
            const loading = await this.navCtrl.loading();
            this.receivedNoteService.get(id).then((note) => {
                this.receivedNote = note;
                if (!note) {
                    return;
                }
                this.receivedNote.items = note && note.itemsJson ? JSON.parse(note.itemsJson) : [];
                this.getProductsAmount();
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
                this.debtService.getDebtsByReceivedNote(note.id, this.dateDebtFrom, this.dateDebtTo).then(async (debts: IDebt[]) => {
                    await loading.dismiss();
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

    getProductsAmount() {
        let netValue = 0;
        for (const item of this.receivedNote.items) {
            netValue += item.amount * 1;
        }
        this.totalProductsAmount = netValue;
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.receivedNote.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.receivedNote.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.receivedNote.contact.lastActive = DateTimeService.toDbString();
        this.receivedNote.contact.lastAction = action;
        return this.contactService.saveContact(this.receivedNote.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.receivedNote.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.receivedNote.contact.avatarUrl);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateTimeString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/received-note/add', { id: this.receivedNote.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('received-note.delete-received-note'),
                    role: 'destructive',
                    handler: () => {
                        this.delete();
                    }
                }, {
                    text: this.translateService.instant('received-note-detail.share'),
                    handler: () => {
                        this.share();
                    }
                }, {
                    text: this.translateService.instant('received-note-detail.print'),
                    handler: () => {
                        this.print();
                    }
                }, {
                    text: this.translateService.instant('received-note-detail.export'),
                    handler: () => {
                        this.export();
                    }
                }, {
                    text: this.translateService.instant('received-note-detail.add-debt'),
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

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('received-note.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.deleteRelated();
                        this.receivedNoteService.delete(this.receivedNote).then(async () => {
                            this.analyticsService.logEvent('received-note-detail-delete-success');
                            this.navCtrl.publish('reloadReceivedNoteList');
                            this.navCtrl.publish('reloadContact', this.receivedNote.contact);
                            this.navCtrl.pop();
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
        const arr = [];
        const tradesToDelete = await this.tradeService.getTradesByReceivedNote(this.receivedNote.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }
        const productNotesToDelete = await this.productService.getNotesByReceivedNote(this.receivedNote.id);
        for (const item of productNotesToDelete) {
            arr.push(this.productService.deleteProductNote(item));
        }
        await Promise.all(arr);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    share(): void {
        this.navCtrl.push('/received-note/detail-share', { receivedNote: this.receivedNote });
    }

    print(): void {
        this.navCtrl.push('/received-note/detail-print', { receivedNote: this.receivedNote });
    }

    async export(): Promise<void> {
        const loading = await this.navCtrl.loading();
        const fileName = 'received-detail-' + this.receivedNote.id + '.xlsx';
        this.excelService.createReceivedNoteFile(fileName, this.receivedNote.id).then(async (url) => {
            await loading.dismiss();
            this.analyticsService.logEvent('received-note-export-downloaded');
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
        }).catch(async () => {
            await loading.dismiss();
        });
    }

    addDebt(): void {
        this.navCtrl.push('/debt/add', { receivedNote: this.receivedNote.id });
    }

    changeStatus(): void {
        this.isDisabled = true;
        this.receivedNoteService.save(this.receivedNote).then(async () => {
            this.isDisabled = false;
            this.navCtrl.publish('reloadReceivedNoteList');
            // Done
            if (!(this.debts && this.debts.length)) {
                const confirm = await this.alertCtrl.create({
                    header: this.translateService.instant('common.confirm'),
                    message: this.translateService.instant('received-note-detail.done-alert'),
                    buttons: [
                        {
                            text: this.translateService.instant('common.agree'),
                            handler: () => {
                                this.createTransactions();
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
        });
    }

    selectDebt(id: number): void {
        this.navCtrl.push('/debt/detail', { id });
    }

    createTransactions(): void {
        if (this.receivedNote.items && this.receivedNote.items.length > 0) {
            const arr = [];
            for (const item of this.receivedNote.items) {
                const trade = new Trade();
                trade.contactId = this.receivedNote.contactId;
                trade.productId = item.productId;
                trade.isPurchase = true;
                trade.isReceived = true;
                trade.productCount = item.quantity;
                trade.value = item.amount;
                trade.moneyAccountId = this.receivedNote.moneyAccountId;
                trade.note = '#' + this.receivedNote.id;
                arr.push(this.tradeService.saveTrade(trade));
            }
            this.isDisabled = true;
            Promise.all(arr).then(() => {
                this.isDisabled = false;
            });
        }
    }
}
