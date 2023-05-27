import * as _ from 'lodash';
import { Debt } from './../../models/debt.model';
import { IDebtToCategory } from './../../models/debt-to-category.interface';
import { IDebt } from './../../models/debt.interface';
import { IContact } from './../../models/contact.interface';
import { Component } from '@angular/core';
import { ITrade } from '../../models/trade.interface';
import { DateRangeComponent } from '../shared/date-range.component';
import { TranslateService } from '@ngx-translate/core';
import { DebtService } from '../../providers/debt.service';
import { ContactService } from '../../providers/contact.service';
import { UserService } from '../../providers/user.service';
import { TradeService } from '../../providers/trade.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ModalController, ActionSheetController, AlertController, Platform } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { OrderService } from '../../providers/order.service';

@Component({
    selector: 'debt-detail',
    templateUrl: 'debt-detail.component.html',
})
export class DebtDetailComponent {
    contactSelected: IContact;
    debt: IDebt = new Debt();
    params: any = null;
    categories: IDebtToCategory[] = [];
    currency: string;
    tab = 'info';
    dateFrom = '';
    dateTo = '';
    total = 0;
    trades: ITrade[] = [];

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private modalCtrl: ModalController,
        private debtService: DebtService,
        private contactService: ContactService,
        private userService: UserService,
        private tradeService: TradeService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private orderService: OrderService
    ) {
        const reloadDebtHandle = (event) => {
            const debt = event.detail;
            if (this.debt && debt.id === this.debt.id) {
                this.reload();
            }
        };
        this.navCtrl.removeEventListener('reloadDebt', reloadDebtHandle);
        this.navCtrl.addEventListener('reloadDebt', reloadDebtHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('debt-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    selectOrder() {
        this.navCtrl.navigateForward('/order/detail', { id: this.debt.order.id });
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.debt = new Debt();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.debtService.get(id).then(async (debt) => {
                await loading.dismiss();
                this.debt = debt;
                this.debtService.getCategoriesToDebt(id).then((categories: IDebtToCategory[]) => {
                    this.categories = categories;
                });
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
                this.tradeService.getTradesByDebt(debt.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                    if (trades && trades.length > 0) {
                        trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                    }
                    this.trades = trades;
                    this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                });
            });
        } else {
            await loading.dismiss();
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.debt.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.debt.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.debt.contact.lastActive = DateTimeService.toDbString();
        this.debt.contact.lastAction = action;
        return this.contactService.saveContact(this.debt.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.debt.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.debt.contact.avatarUrl);
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

    edit(): void {
        this.navCtrl.navigateForward('/debt/add', { id: this.debt.id });
    }

    async pay(): Promise<void> {
        const totalLeft = +this.debt.value - +this.debt.valuePaid;
        if (!totalLeft) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('debt-detail.paid-alert'),
                buttons: [
                    {
                        text: this.translateService.instant('common.cancel'),
                        handler: () => {
                        }
                    },
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                            this.navCtrl.navigateForward('/trade/add', { debt: this.debt.id });
                        }
                    },
                ]
            });
            confirm.present();
            return;
        }
        this.navCtrl.navigateForward('/trade/add', { debt: this.debt.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('debt.delete-debt'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteDebt();
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

    async isPaidChange(): Promise<void> {
        let confirmMessage: string = this.translateService.instant('debt.confirm-paid');
        const statusString = this.debt.isPaid
            ? this.translateService.instant('debt-detail.paid')
            : this.translateService.instant('debt-detail.not-yet-paid');
        confirmMessage = confirmMessage.replace('{paid}', statusString);
        if (!confirm(confirmMessage)) {
            setTimeout(() => {
                this.debt.isPaid = !this.debt.isPaid;
            }, 200);
            return;
        }
        const allDebts = await this.debtService.getDebtsByOrder(this.debt.order.id, null, null);
        let allDebtsPaid = true;
        for (const debt of allDebts) {
            if (!debt.isPaid && debt.id !== this.debt.id) {
                allDebtsPaid = false;
                break;
            }
        }
        if (allDebtsPaid && this.debt.isPaid) {
            this.debt.order.status = 3;
            await this.orderService.saveOrder(this.debt.order);
        }
        if (!this.debt.isPaid || (this.trades && this.trades.length)) {
            await this.debtService.saveDebt(this.debt);
            if (this.debt.contact && this.debt.contact.id != 0) {
                this.navCtrl.publish('reloadContact', this.debt.contact);
                this.navCtrl.publish('reloadContactDebt', this.debt.contact.id);
            }
            this.navCtrl.publish('reloadDebtList', { type: this.debt.debtType.toString() });
            if (this.debt.order && this.debt.order.id != 0) {
                this.navCtrl.publish('reloadOrder', this.debt.order);
            }
            return;
        }
        this.debtService.saveDebt(this.debt).then(async () => {
            this.navCtrl.publish('reloadDebtList', { type: this.debt.debtType.toString() });
            if (this.debt.contact && this.debt.contact.id != 0) {
                this.navCtrl.publish('reloadContact', this.debt.contact);
                this.navCtrl.publish('reloadContactDebt', this.debt.contact.id);
            }
            if (this.debt.order && this.debt.order.id != 0) {
                this.navCtrl.publish('reloadOrder', this.debt.order);
            }

            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('debt.paid-alert'),
                buttons: [
                    {
                        text: this.translateService.instant('common.cancel'),
                        handler: () => {
                        }
                    },
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                            this.debtService.saveDebt(this.debt);
                            this.navCtrl.push('/trade/add', { debt: this.debt.id });
                        }
                    },
                ]
            });
            confirm.present();
        });
    }

    async deleteDebt(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('debt.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.debtService.deleteDebt(this.debt).then(async () => {
                            this.analyticsService.logEvent('debt-detail-delete-success');
                            this.navCtrl.publish('reloadDebtList', null);
                            if (this.debt.contact) {
                                this.navCtrl.publish('reloadContact', this.debt.contact);
                            }
                            if (this.debt.product) {
                                this.navCtrl.publish('reloadProduct', this.debt.product);
                            }
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
        confirm.present();
    }

    moveToCategory(category: IDebtToCategory): void {
        this.navCtrl.push('/cagegory/detail', { id: category.categoryId, tab: 'debt' });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id });
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
            this.tradeService.getTradesByDebt(this.debt.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });
        }
    }
}
