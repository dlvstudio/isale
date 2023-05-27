import { Component } from '@angular/core';
import * as _ from 'lodash';
import { DateRangeComponent } from '../shared/date-range.component';

import { IMoneyAccount } from '../../models/money-account.interface';
import { MoneyAccount } from '../../models/money-account.model';
import { IMoneyAccountTransaction } from '../../models/money-account-transaction.interface';
import { Trade } from '../../models/trade.model';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ModalController } from '@ionic/angular';
import { MoneyAccountService } from '../../providers/money-account.service';
import { TradeService } from '../../providers/trade.service';
import { MoneyAccountTransactionService } from '../../providers/money-account-transaction.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'money-account-transfer',
    templateUrl: 'money-account-transfer.component.html',
})
export class MoneyAccountTransferComponent {
    params: any = null;
    currentMoneyAccount: IMoneyAccount = new MoneyAccount();
    moneyAccountSelected: IMoneyAccount;
    transferValue = 0;
    transferFee = 0;
    arr = [];
    currencyCode: string;
    currency: any;
    dateFrom = '';
    dateTo = '';
    trades: IMoneyAccountTransaction[] = [];
    total = 0;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private userService: UserService,
        private modalCtrl: ModalController,
        private productService: MoneyAccountService,
        private transactionService: TradeService,
        private tradeService: MoneyAccountTransactionService,
        private analyticsService: AnalyticsService,
    ) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account-transfer');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    reload(): void {
        this.userService.getAttr('current-currency').then((code) => {
            this.currencyCode = code;
            this.currency = Helper.getCurrencyByCode(code);
        });
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        this.currentMoneyAccount = new MoneyAccount();
        if (data && data.id && data.id > 0) {
            const id = data.id;
            this.productService.get(id).then((currentMoneyAccount) => {
                this.currentMoneyAccount = currentMoneyAccount;
                // this.dateFrom = '';
                // this.dateTo = '';
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
                this.tradeService.getMoneyAccountTransactionsByAccount(currentMoneyAccount.id, this.dateFrom, this.dateTo)
                .then((trades: IMoneyAccountTransaction[]) => {
                    if (trades && trades.length > 0) {
                        trades = _.orderBy(trades, ['createdAt'], ['desc']);
                    }
                    this.trades = trades;
                    this.total = currentMoneyAccount.total;
                });
            });
        }
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
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
            this.tradeService.getMoneyAccountTransactionsByAccount(this.currentMoneyAccount.id, this.dateFrom, this.dateTo)
                .then((trades: IMoneyAccountTransaction[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = this.currentMoneyAccount.total;
            });
        }
    }

    productName(product: IMoneyAccount): string {
        return product.accountName;
    }

    async showSearchMoneyAccount() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                if (contact.id == this.currentMoneyAccount.id) {
                    alert(this.translateService.instant('money-account-transfer.account-selected-duplicate-alert'));
                    return;
                }
                this.moneyAccountSelected = contact;
            }
        };
        this.navCtrl.push('/money-account', { callback, searchMode: true });
    }

    removeMoneyAccount(): void {
        this.moneyAccountSelected = null;
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    save(): void {
        if (!this.moneyAccountSelected) {
            alert(this.translateService.instant('money-account-transfer.no-to-account-selected-alert'));
            return;
        }
        if (!this.transferValue || this.transferValue <= 0) {
            alert(this.translateService.instant('money-account-transfer.transfer-value-zero-alert'));
            return;
        }
        if (this.transferFee < 0) {
            alert(this.translateService.instant('money-account-transfer.transfer-fee-zero-alert'));
            return;
        }
        const totalTransfer = (+this.transferValue + +this.transferFee);

        const arr: Promise<any>[] = [];

        const moneyAccountTransaction1 = new Trade();
        moneyAccountTransaction1.isReceived = false;
        moneyAccountTransaction1.value = totalTransfer;
        moneyAccountTransaction1.moneyAccountId = this.currentMoneyAccount.id;
        moneyAccountTransaction1.note = this.transferText(this.currentMoneyAccount, this.moneyAccountSelected, this.transferFee);
        const p3 = this.transactionService.saveTrade(moneyAccountTransaction1);

        const moneyAccountTransaction2 = new Trade();
        moneyAccountTransaction2.isReceived = true;
        moneyAccountTransaction2.value = this.transferValue;
        moneyAccountTransaction2.moneyAccountId = this.moneyAccountSelected.id;
        moneyAccountTransaction2.note = this.transferText(this.currentMoneyAccount, this.moneyAccountSelected, this.transferFee);
        const p4 = this.transactionService.saveTrade(moneyAccountTransaction2);

        arr.push(p3);
        arr.push(p4);
        Promise.all(arr).then(async () => {
            this.analyticsService.logEvent('money-account-transfer-save-success');
            this.exitPage();
        });
    }

    transferText(fromAccount: IMoneyAccount, toAccount: IMoneyAccount, transferFee: number) {
        let text = this.translateService.instant('money-account-transfer.transfer-money-from-to');
        text = text.replace('{0}', fromAccount.accountName);
        text = text.replace('{1}', toAccount.accountName);
        text = text.replace('{2}', transferFee);
        return text;
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadMoneyAccountList');
        this.navCtrl.publish('reloadMoneyAccount', this.currentMoneyAccount);
        this.navCtrl.publish('reloadMoneyAccount', this.moneyAccountSelected);
    }
}
